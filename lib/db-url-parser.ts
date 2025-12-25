export interface ParsedDatabaseUrl {
  host: string
  port: number
  database: string
  username: string
  password: string
  sslEnabled: boolean
}

/**
 * Parse a PostgreSQL connection URL into its components
 * Supports format: postgresql://username:password@host:port/database?sslmode=require
 */
export function parseDatabaseUrl(url: string): ParsedDatabaseUrl | null {
  try {
    // Handle both postgresql:// and postgres:// protocols
    const normalizedUrl = url.replace(/^postgres:\/\//, "postgresql://")

    if (!normalizedUrl.startsWith("postgresql://")) {
      return null
    }

    const parsed = new URL(normalizedUrl)

    const host = parsed.hostname
    const port = parsed.port ? parseInt(parsed.port, 10) : 5432
    const database = parsed.pathname.slice(1) // Remove leading slash
    const username = decodeURIComponent(parsed.username)
    const password = decodeURIComponent(parsed.password)

    // Check for SSL mode in query params
    const sslmode = parsed.searchParams.get("sslmode")
    const sslEnabled = sslmode === "require" || sslmode === "verify-full"

    if (!host || !database || !username) {
      return null
    }

    return {
      host,
      port,
      database,
      username,
      password,
      sslEnabled,
    }
  } catch {
    return null
  }
}

/**
 * Build a PostgreSQL connection URL from components
 */
export function buildDatabaseUrl(config: ParsedDatabaseUrl): string {
  const { host, port, database, username, password, sslEnabled } = config

  const encodedUsername = encodeURIComponent(username)
  const encodedPassword = encodeURIComponent(password)
  const encodedDatabase = encodeURIComponent(database)
  const ssl = sslEnabled ? "?sslmode=require" : ""

  return `postgresql://${encodedUsername}:${encodedPassword}@${host}:${port}/${encodedDatabase}${ssl}`
}

/**
 * Validate if a string looks like a valid PostgreSQL URL
 */
export function isValidDatabaseUrl(url: string): boolean {
  return parseDatabaseUrl(url) !== null
}

