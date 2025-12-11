"use client"

import { useState, useEffect } from "react"
import { Play, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SchemaTree } from "@/components/database/schema-tree"
import { QueryResults } from "@/components/database/query-results"
import type { TableSchema } from "@/app/api/database/schema/route"

export default function DatabasePage() {
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [sql, setSql] = useState("SELECT * FROM jira_projects LIMIT 10")
  const [isLoading, setIsLoading] = useState(false)
  const [isSchemaLoading, setIsSchemaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  } | null>(null)

  // Fetch schema on mount
  useEffect(() => {
    async function fetchSchema() {
      try {
        const response = await fetch("/api/database/schema")
        const data = await response.json()
        if (data.error) {
          setError(data.error)
        } else {
          setSchema(data.schema)
        }
      } catch (err) {
        setError("Failed to fetch schema")
        console.error(err)
      } finally {
        setIsSchemaLoading(false)
      }
    }
    fetchSchema()
  }, [])

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setQueryResult(null)
      } else {
        setQueryResult(data)
      }
    } catch (err) {
      setError("Failed to execute query")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadCsv = () => {
    if (!queryResult || queryResult.rowCount === 0) return

    // Escape CSV value (handle quotes and commas)
    const escapeCsvValue = (value: unknown): string => {
      if (value === null || value === undefined) return ""
      const str = String(value)
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Build CSV content
    const headerRow = queryResult.columns.map(escapeCsvValue).join(",")
    const dataRows = queryResult.rows
      .map((row) =>
        queryResult.columns.map((col) => escapeCsvValue(row[col])).join(",")
      )
      .join("\n")
    const csvContent = `${headerRow}\n${dataRows}`

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `query-result-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left sidebar - Schema Tree */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="p-4 border-b shrink-0">
            <h2 className="font-semibold text-sm">Table Schema</h2>
          </div>
          <div className="h-full p-2 flex-1 overflow-y-auto">
            <SchemaTree
              key={schema.map((t) => t.name).join(",")}
              schema={schema}
              isLoading={isSchemaLoading}
            />
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right side - Query Input and Results */}
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          {/* Query Input */}
          <ResizablePanel defaultSize={30} minSize={15}>
            <div className="flex h-full flex-col p-4">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="Enter your SQL query..."
                className="font-mono text-sm flex-1 resize-none"
              />
              <div className="flex items-center justify-between mt-3 shrink-0">
                <Button
                  onClick={handleExecute}
                  disabled={isLoading || !sql.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
                {queryResult && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {queryResult.rowCount} row
                      {queryResult.rowCount !== 1 ? "s" : ""} returned
                    </span>
                    {queryResult.rowCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCsv}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Query Results */}
          <ResizablePanel defaultSize={70} minSize={20}>
            <div className="h-full flex flex-col overflow-hidden">
              {error ? (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive text-sm">
                  {error}
                </div>
              ) : queryResult ? (
                <div className="flex-1 min-h-0">
                  <QueryResults
                    columns={queryResult.columns}
                    rows={queryResult.rows}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Execute a query to see results
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

