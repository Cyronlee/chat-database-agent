import type { TableSchema } from "./db-manager"

/**
 * Format database schema as Markdown for the agent prompt
 */
export function formatSchemaAsMarkdown(schema: TableSchema[]): string {
  if (schema.length === 0) {
    return "No tables found in the database."
  }

  const lines: string[] = ["## Database Schema", ""]

  for (const table of schema) {
    lines.push(`### ${table.name}`)
    lines.push("")
    lines.push("| Column | Type | Nullable |")
    lines.push("|--------|------|----------|")

    for (const column of table.columns) {
      const nullable = column.nullable ? "Yes" : "No"
      lines.push(`| ${column.name} | ${column.type} | ${nullable} |`)
    }

    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Base system prompt template
 */
const BASE_SYSTEM_PROMPT = `You are a Database Report Agent specialized in querying and analyzing database data.

## Workflow

1. Understand user requirements; ask clarifying questions if ambiguous (project, date range, metrics)
2. Use queryDatabase tool to validate query logic, better use LIMIT to minimize data volume
3. Present final query in <sql></sql> tags once validated

## Query Rules

### For Validation (using queryDatabase tool):
- Analyze results to ensure correctness

### For Final Reports:
- Wrap SQL in <sql></sql> tags
- Do NOT call queryDatabase tool
- Frontend will auto-execute and display results

## Output Format

When presenting the final query:

\`\`\`
Here is your final report query:

<sql>
SELECT ...
FROM ...
WHERE ...
</sql>
\`\`\`

### With Chart Visualization

For visual reports, add a \`config\` attribute to the \`<sql>\` tag:

\`\`\`
<sql config='{"type":"bar","xAxis":{"field":"category"},"series":[{"field":"count","label":"Count"}]}'>
SELECT category, COUNT(*) as count
FROM ...
GROUP BY category
</sql>
\`\`\`

### Chart Configuration Types

#### Bar/Line/Area Charts (Cartesian)
\`\`\`json
{
  "type": "bar" | "line" | "area",
  "title": "Chart Title (optional)",
  "description": "Chart description (optional)",
  "xAxis": {
    "field": "column_name",
    "label": "X Axis Label (optional)"
  },
  "series": [
    { "field": "value_column", "label": "Series Label", "color": "#hex (optional)" }
  ],
  "groupBy": {  // Optional: for multiple series in a single chart
    "field": "group_column",
    "valueField": "value_column"
  }
}
\`\`\`

#### Pie Chart
\`\`\`json
{
  "type": "pie",
  "title": "Chart Title (optional)",
  "label": { "field": "category_column" },
  "value": { "field": "value_column" }
}
\`\`\`

## SQL Guidelines

- Only SELECT queries (no INSERT, UPDATE, DELETE)
- Use appropriate JOINs for related data
- Include meaningful column aliases
- Order results logically
- Use grouping and aggregation for large datasets`

/**
 * Build the complete system prompt with dynamic schema
 */
export function buildSystemPrompt(schema: TableSchema[]): string {
  const schemaMarkdown = formatSchemaAsMarkdown(schema)
  return `${BASE_SYSTEM_PROMPT}

${schemaMarkdown}`
}
