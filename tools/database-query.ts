import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

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

export const queryDatabase = tool({
  description: `Execute a SQL SELECT query against the database`,
  inputSchema: z.object({
    sql: z.string().describe("The SQL SELECT query to execute"),
  }),
  execute: async ({ sql }) => {
    try {
      const result = await prisma.$queryRawUnsafe(sql)
      const rawRows = result as Record<string, unknown>[]
      const rows = rawRows.map(serializeRow)
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []

      return {
        success: true,
        columns,
        rows,
        rowCount: rows.length,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to execute query"
      return {
        success: false,
        error: errorMessage,
        columns: [] as string[],
        rows: [] as Record<string, unknown>[],
        rowCount: 0,
      }
    }
  },
})
