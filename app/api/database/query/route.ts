import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      )
    }

    // Basic security: only allow SELECT queries
    const trimmedSql = sql.trim().toLowerCase()
    if (!trimmedSql.startsWith("select")) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed" },
        { status: 400 }
      )
    }

    // Execute the query
    const result = await prisma.$queryRawUnsafe(sql)

    // Get column names from the first row if available
    const rawRows = result as Record<string, unknown>[]
    const rows = rawRows.map(serializeRow)
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return NextResponse.json({
      columns,
      rows,
      rowCount: rows.length,
    })
  } catch (error) {
    console.error("Failed to execute query:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to execute query"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
