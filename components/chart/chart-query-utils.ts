"use client"

import {
  executeQuery,
  isQueryError,
  type QueryResult,
} from "@/api-clients/database-query"

export type QueryState = "idle" | "loading" | "success" | "error"

export interface QueryExecutionResult {
  state: QueryState
  result: QueryResult | null
  error: string | null
}

export async function runChartQuery(
  sql: string,
  databaseId?: string | null
): Promise<QueryExecutionResult> {
  if (!sql.trim()) {
    return { state: "idle", result: null, error: null }
  }

  const response = await executeQuery(sql.trim(), databaseId)

  if (isQueryError(response)) {
    return { state: "error", result: null, error: response.error }
  }

  return { state: "success", result: response, error: null }
}

export function downloadCsv(result: QueryResult, filename?: string): void {
  if (result.rowCount === 0) return

  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return ""
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = result.columns.map(escapeCsvValue).join(",")
  const dataRows = result.rows
    .map((row) =>
      result.columns.map((col) => escapeCsvValue(row[col])).join(",")
    )
    .join("\n")
  const csvContent = `${headerRow}\n${dataRows}`

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename || `query-result-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

