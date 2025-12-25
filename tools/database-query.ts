import { tool } from "ai"
import { z } from "zod"
import { dbManager } from "@/lib/db-manager"

/**
 * Create a query database tool bound to a specific database
 * @param databaseId - The ID of the external database, or null for system database
 */
export function createQueryDatabaseTool(databaseId: string | null) {
  return tool({
    description: `Execute a SQL SELECT query against the database`,
    inputSchema: z.object({
      sql: z.string().describe("The SQL SELECT query to execute"),
    }),
    execute: async ({ sql }) => {
      try {
        const result = databaseId
          ? await dbManager.executeQuery(databaseId, sql)
          : await dbManager.executeSystemQuery(sql)

        return {
          success: true,
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rowCount,
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
}

// Legacy export for backward compatibility (uses system database)
export const queryDatabase = createQueryDatabaseTool(null)
