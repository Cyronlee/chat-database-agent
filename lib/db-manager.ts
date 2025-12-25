import { Pool, PoolClient } from "pg"
import { prisma } from "./prisma"

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
}

export interface TableSchema {
  name: string
  columns: TableColumn[]
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

export interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  sslEnabled: boolean
}

// Connection pool cache
const poolCache = new Map<string, Pool>()

function buildConnectionString(config: ConnectionConfig): string {
  const ssl = config.sslEnabled ? "?sslmode=require" : ""
  return `postgresql://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${encodeURIComponent(config.database)}${ssl}`
}

function getPoolKey(databaseId: string): string {
  return `db_${databaseId}`
}

async function getConnectionConfig(
  databaseId: string
): Promise<ConnectionConfig | null> {
  const db = await prisma.external_databases.findUnique({
    where: { id: BigInt(databaseId) },
  })

  if (!db) return null

  return {
    host: db.host,
    port: db.port,
    database: db.database,
    username: db.username,
    password: db.password,
    sslEnabled: db.ssl_enabled,
  }
}

function createPool(config: ConnectionConfig): Pool {
  return new Pool({
    connectionString: buildConnectionString(config),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

async function getPool(databaseId: string): Promise<Pool> {
  const key = getPoolKey(databaseId)
  let pool = poolCache.get(key)

  if (!pool) {
    const config = await getConnectionConfig(databaseId)
    if (!config) {
      throw new Error(`Database ${databaseId} not found`)
    }
    pool = createPool(config)
    poolCache.set(key, pool)
  }

  return pool
}

// Helper function to convert BigInt values to strings for JSON serialization
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "bigint") {
      serialized[key] = value.toString()
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString()
    } else {
      serialized[key] = value
    }
  }
  return serialized
}

export const dbManager = {
  /**
   * Get a connection from the pool for a specific database
   */
  async getConnection(databaseId: string): Promise<PoolClient> {
    const pool = await getPool(databaseId)
    return pool.connect()
  },

  /**
   * Execute a query against a specific external database
   */
  async executeQuery(databaseId: string, sql: string): Promise<QueryResult> {
    const pool = await getPool(databaseId)
    const result = await pool.query(sql)

    const rows = result.rows.map(serializeRow)
    const columns = result.fields.map((f) => f.name)

    return {
      columns,
      rows,
      rowCount: rows.length,
    }
  },

  /**
   * Execute a query against the system database (using Prisma)
   */
  async executeSystemQuery(sql: string): Promise<QueryResult> {
    const result = await prisma.$queryRawUnsafe(sql)
    const rawRows = result as Record<string, unknown>[]
    const rows = rawRows.map(serializeRow)
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return {
      columns,
      rows,
      rowCount: rows.length,
    }
  },

  /**
   * Get the schema for a specific external database
   */
  async getSchema(databaseId: string): Promise<TableSchema[]> {
    const pool = await getPool(databaseId)

    const result = await pool.query<{
      table_name: string
      column_name: string
      data_type: string
      is_nullable: string
    }>(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `)

    const schemaMap = new Map<string, TableSchema>()

    for (const row of result.rows) {
      if (!schemaMap.has(row.table_name)) {
        schemaMap.set(row.table_name, {
          name: row.table_name,
          columns: [],
        })
      }

      schemaMap.get(row.table_name)!.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
      })
    }

    return Array.from(schemaMap.values())
  },

  /**
   * Get the schema for the system database
   */
  async getSystemSchema(): Promise<TableSchema[]> {
    const tables = await prisma.$queryRaw<
      Array<{
        table_name: string
        column_name: string
        data_type: string
        is_nullable: string
      }>
    >`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `

    const schemaMap = new Map<string, TableSchema>()

    for (const row of tables) {
      if (!schemaMap.has(row.table_name)) {
        schemaMap.set(row.table_name, {
          name: row.table_name,
          columns: [],
        })
      }

      schemaMap.get(row.table_name)!.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
      })
    }

    return Array.from(schemaMap.values())
  },

  /**
   * Test connection to an external database
   */
  async testConnection(config: ConnectionConfig): Promise<boolean> {
    const pool = new Pool({
      connectionString: buildConnectionString(config),
      max: 1,
      connectionTimeoutMillis: 5000,
    })

    try {
      const client = await pool.connect()
      await client.query("SELECT 1")
      client.release()
      await pool.end()
      return true
    } catch {
      await pool.end()
      return false
    }
  },

  /**
   * Invalidate the cached pool for a database (call after update/delete)
   */
  async invalidatePool(databaseId: string): Promise<void> {
    const key = getPoolKey(databaseId)
    const pool = poolCache.get(key)
    if (pool) {
      await pool.end()
      poolCache.delete(key)
    }
  },

  /**
   * Close all pools (for cleanup)
   */
  async closeAll(): Promise<void> {
    for (const pool of poolCache.values()) {
      await pool.end()
    }
    poolCache.clear()
  },
}

