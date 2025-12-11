"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { QueryResults } from "@/components/database/query-results"
import {
  executeQuery,
  isQueryError,
  type QueryResult,
} from "@/api-clients/database-query"
import {
  PlayIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertCircleIcon,
  Loader2Icon,
  DatabaseIcon,
  DownloadIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

interface SqlBlockProps {
  sql: string
  autoExecute?: boolean
}

type QueryState = "idle" | "loading" | "success" | "error"

export function SqlBlock({ sql, autoExecute = true }: SqlBlockProps) {
  const [queryState, setQueryState] = useState<QueryState>("idle")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const hasExecutedRef = useRef(false)

  const trimmedSql = sql.trim()

  const runQuery = useCallback(async () => {
    if (!trimmedSql) return

    setQueryState("loading")
    setError(null)

    const response = await executeQuery(trimmedSql)

    if (isQueryError(response)) {
      setQueryState("error")
      setError(response.error)
    } else {
      setQueryState("success")
      setResult(response)
    }
  }, [trimmedSql])

  // Auto-execute on mount if enabled
  useEffect(() => {
    if (autoExecute && trimmedSql && !hasExecutedRef.current) {
      hasExecutedRef.current = true
      runQuery()
    }
  }, [autoExecute, trimmedSql, runQuery])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trimmedSql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCsv = () => {
    if (!result || result.rowCount === 0) return

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
    const headerRow = result.columns.map(escapeCsvValue).join(",")
    const dataRows = result.rows
      .map((row) =>
        result.columns.map((col) => escapeCsvValue(row[col])).join(",")
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
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <DatabaseIcon className="size-4" />
          <span>Query Result</span>
          {result && queryState === "success" && (
            <span className="text-xs text-muted-foreground">
              ({result.rowCount} rows)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="size-7"
            title="Copy SQL"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-green-500" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
          </Button>
          {queryState === "success" && result && result.rowCount > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDownloadCsv}
              className="size-7"
              title="Download CSV"
            >
              <DownloadIcon className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSql(!showSql)}
            className="size-7"
            title={showSql ? "Hide SQL" : "Show SQL"}
          >
            {showSql ? (
              <ChevronUpIcon className="size-3.5" />
            ) : (
              <ChevronDownIcon className="size-3.5" />
            )}
          </Button>
          {queryState === "loading" ? (
            <Button variant="ghost" size="icon-sm" disabled className="size-7">
              <Loader2Icon className="size-3.5 animate-spin" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={runQuery}
              className="size-7"
            >
              {queryState === "success" ? (
                <RefreshCwIcon className="size-3.5" />
              ) : (
                <PlayIcon className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* SQL Preview (collapsible) */}
      <Collapsible open={showSql} onOpenChange={setShowSql}>
        <CollapsibleContent>
          <div className="bg-muted/20 p-3">
            <pre className="overflow-x-auto text-xs text-muted-foreground">
              <code>{trimmedSql}</code>
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Content */}
      <div className="min-h-[100px]">
        {queryState === "idle" && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <DatabaseIcon className="size-8 opacity-50" />
            <p className="text-sm">Click play to execute the query</p>
          </div>
        )}

        {queryState === "loading" && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2Icon className="size-8 animate-spin" />
            <p className="text-sm">Executing query...</p>
          </div>
        )}

        {queryState === "error" && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-destructive">
            <AlertCircleIcon className="size-8" />
            <p className="text-sm font-medium">Query failed</p>
            <p className="max-w-md text-center text-xs text-muted-foreground">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={runQuery}>
              <RefreshCwIcon className="mr-1 size-3" />
              Retry
            </Button>
          </div>
        )}

        {queryState === "success" && result && (
          <div className="h-[400px] overflow-auto">
            {result.rowCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <DatabaseIcon className="size-8 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            ) : (
              <QueryResults columns={result.columns} rows={result.rows} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Extract SQL blocks from markdown content
 * Returns the content with SQL blocks replaced and the extracted SQL queries
 */
export function extractSqlBlocks(content: string): {
  processedContent: string
  sqlBlocks: string[]
} {
  const sqlBlockRegex = /<sql>([\s\S]*?)<\/sql>/g
  const sqlBlocks: string[] = []
  let index = 0

  const processedContent = content.replace(sqlBlockRegex, (_, sql) => {
    sqlBlocks.push(sql.trim())
    return `__SQL_BLOCK_${index++}__`
  })

  return { processedContent, sqlBlocks }
}

/**
 * Check if content contains SQL blocks
 */
export function hasSqlBlocks(content: string): boolean {
  return /<sql>[\s\S]*?<\/sql>/.test(content)
}
