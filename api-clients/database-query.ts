"use client"

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

export interface QueryError {
  error: string
}

export type QueryResponse = QueryResult | QueryError

export function isQueryError(response: QueryResponse): response is QueryError {
  return "error" in response
}

export async function executeQuery(
  sql: string,
  databaseId?: string | null
): Promise<QueryResponse> {
  try {
    const response = await fetch("/api/database/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, databaseId: databaseId || undefined }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || "Failed to execute query" }
    }

    return data as QueryResult
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to execute query",
    }
  }
}

export async function fetchSchema(databaseId?: string | null) {
  const params = databaseId ? `?databaseId=${databaseId}` : ""
  const response = await fetch(`/api/database/schema${params}`)
  return response.json()
}

