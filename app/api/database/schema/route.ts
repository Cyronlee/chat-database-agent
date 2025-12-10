import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
}

export interface TableSchema {
  name: string
  columns: TableColumn[]
}

export async function GET() {
  try {
    // Query PostgreSQL information_schema to get table and column information
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

    // Group columns by table
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

    const schema = Array.from(schemaMap.values())

    return NextResponse.json({ schema })
  } catch (error) {
    console.error("Failed to fetch database schema:", error)
    return NextResponse.json(
      { error: "Failed to fetch database schema" },
      { status: 500 }
    )
  }
}

