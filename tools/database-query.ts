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
  description: `Execute a SQL SELECT query against the Jira database. Only SELECT queries are allowed for security.

Available tables and their key columns:
- jira_projects: id, source_id, name, key, project_type_key
- jira_issues: id, source_id, issue_type_id, project_id, status_id, priority_id, user_id, summary, key, story_points, created_at, updated_at, resolution_date
- jira_users: id, source_id, account_id, email, name, actived
- jira_statuses: id, source_id, name, status_category
- jira_priorities: id, source_id, name
- jira_sprints: id, source_id, board_id, project_id, name, state, start_date, end_date
- jira_issue_types: id, source_id, project_id, name, hierarchy_level
- jira_labels: id, name
- jira_issue_labels: id, issue_id, label_id
- jira_issue_sprints: id, issue_id, sprint_id, project_id, planned, planned_points
- jira_resolutions: id, source_id, name
- jira_custom_fields: id, name, key
- jira_issue_custom_field_values: id, issue_id, custom_field_id, value

Use JOINs to connect related tables. For example:
- Issues with their project: JOIN jira_projects ON jira_issues.project_id = jira_projects.id
- Issues with their status: JOIN jira_statuses ON jira_issues.status_id = jira_statuses.id
- Issues with their assignee: JOIN jira_users ON jira_issues.user_id = jira_users.id`,
  inputSchema: z.object({
    sql: z.string().describe("The SQL SELECT query to execute"),
  }),
  execute: async ({ sql }) => {
    const trimmedSql = sql.trim().toLowerCase()
    if (!trimmedSql.startsWith("select")) {
      return {
        success: false,
        error: "Only SELECT queries are allowed",
        columns: [] as string[],
        rows: [] as Record<string, unknown>[],
        rowCount: 0,
      }
    }

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
