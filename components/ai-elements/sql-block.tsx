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
  BarChart3Icon,
  TableIcon,
  MaximizeIcon,
  XIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { ChartRenderer } from "@/components/chart/ChartRenderer"
import type { CustomChartConfig, TableData } from "@/components/chart/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SaveChartButton } from "@/components/chart/SaveChartButton"

interface SqlBlockProps {
  sql: string
  autoExecute?: boolean
  chartConfig?: CustomChartConfig
}

type QueryState = "idle" | "loading" | "success" | "error"

export function SqlBlock({
  sql,
  autoExecute = true,
  chartConfig,
}: SqlBlockProps) {
  const [queryState, setQueryState] = useState<QueryState>("idle")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("chart")
  const hasExecutedRef = useRef(false)
  const hasChart = !!chartConfig

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

  // Render the result content (used in both normal and fullscreen views)
  const renderResultContent = (isExpanded: boolean) => {
    const contentHeight = isExpanded ? "h-full" : "h-[400px]"

    if (queryState === "idle") {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <DatabaseIcon className="size-8 opacity-50" />
          <p className="text-sm">Click play to execute the query</p>
        </div>
      )
    }

    if (queryState === "loading") {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2Icon className="size-8 animate-spin" />
          <p className="text-sm">Executing query...</p>
        </div>
      )
    }

    if (queryState === "error") {
      return (
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
      )
    }

    if (queryState === "success" && result) {
      if (result.rowCount === 0) {
        return (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <DatabaseIcon className="size-8 opacity-50" />
            <p className="text-sm">No results found</p>
          </div>
        )
      }

      if (hasChart) {
        return (
          <div className={`${contentHeight} overflow-auto`}>
            <TabsContent value="chart" className={`mt-0 h-full p-4`}>
              <ChartRenderer
                data={result.rows as TableData[]}
                config={chartConfig}
                className="h-full"
              />
            </TabsContent>
            <TabsContent value="table" className={`mt-0 ${contentHeight}`}>
              <QueryResults columns={result.columns} rows={result.rows} />
            </TabsContent>
          </div>
        )
      }

      return (
        <div className={`${contentHeight} overflow-auto`}>
          <QueryResults columns={result.columns} rows={result.rows} />
        </div>
      )
    }

    return null
  }

  // Render header actions
  const renderHeaderActions = (showExpandButton: boolean) => (
    <div className="flex items-center gap-1">
      {/* Tab switcher - only show when chart is available and has results */}
      {hasChart &&
        queryState === "success" &&
        result &&
        result.rowCount > 0 && (
          <TabsList className="h-7 bg-muted/50 p-0.5">
            <TabsTrigger
              value="chart"
              className="h-6 px-2 text-xs data-[state=active]:bg-background"
            >
              <BarChart3Icon className="mr-1 size-3" />
              Chart
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="h-6 px-2 text-xs data-[state=active]:bg-background"
            >
              <TableIcon className="mr-1 size-3" />
              Table
            </TabsTrigger>
          </TabsList>
        )}
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
      {hasChart &&
        queryState === "success" &&
        result &&
        result.rowCount > 0 &&
        chartConfig && (
          <SaveChartButton sql={trimmedSql} chartConfig={chartConfig} />
        )}
      {showExpandButton &&
        queryState === "success" &&
        result &&
        result.rowCount > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsFullscreen(true)}
            className="size-7"
            title="Fullscreen"
          >
            <MaximizeIcon className="size-3.5" />
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
  )

  const mainContent = (
    <>
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
        {renderHeaderActions(true)}
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
      <div className="min-h-[100px]">{renderResultContent(false)}</div>
    </>
  )

  // Wrap with Tabs if chart is available
  const wrappedContent = hasChart ? (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full gap-0"
    >
      {mainContent}
    </Tabs>
  ) : (
    mainContent
  )

  return (
    <>
      <div className="my-4 overflow-hidden rounded-lg border border-border bg-background">
        {wrappedContent}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] h-[95vh] flex flex-col p-0"
        >
          <DialogHeader className="flex-shrink-0 border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-sm font-medium">
                <DatabaseIcon className="size-4" />
                <span>Query Result</span>
                {result && queryState === "success" && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({result.rowCount} rows)
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {hasChart &&
                  queryState === "success" &&
                  result &&
                  result.rowCount > 0 && (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="h-7 bg-muted/50 p-0.5">
                        <TabsTrigger
                          value="chart"
                          className="h-6 px-2 text-xs data-[state=active]:bg-background"
                        >
                          <BarChart3Icon className="mr-1 size-3" />
                          Chart
                        </TabsTrigger>
                        <TabsTrigger
                          value="table"
                          className="h-6 px-2 text-xs data-[state=active]:bg-background"
                        >
                          <TableIcon className="mr-1 size-3" />
                          Table
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
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
                {hasChart &&
                  queryState === "success" &&
                  result &&
                  result.rowCount > 0 &&
                  chartConfig && (
                    <SaveChartButton
                      sql={trimmedSql}
                      chartConfig={chartConfig}
                    />
                  )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsFullscreen(false)}
                  className="size-7"
                  title="Close"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {hasChart ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full"
              >
                {renderResultContent(true)}
              </Tabs>
            ) : (
              renderResultContent(true)
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export interface ExtractedSqlBlock {
  sql: string
  config?: CustomChartConfig
}

/**
 * Extract SQL blocks from markdown content
 * Returns the content with SQL blocks replaced and the extracted SQL queries with optional chart configs
 *
 * Supports two formats:
 * - `<sql>SELECT ...</sql>` - Plain SQL without chart
 * - `<sql config='{"type":"bar",...}'>SELECT ...</sql>` - SQL with chart config (use single quotes to wrap JSON with double quotes inside)
 */
export function extractSqlBlocks(content: string): {
  processedContent: string
  sqlBlocks: ExtractedSqlBlock[]
} {
  // Match <sql> or <sql config='...'> (single quotes allow double quotes inside) or <sql config="..."> (double quotes allow single quotes inside)
  const sqlBlockRegex =
    /<sql(?:\s+config\s*=\s*(?:'([^']*)'|"([^"]*)"))?\s*>([\s\S]*?)<\/sql>/g
  const sqlBlocks: ExtractedSqlBlock[] = []
  let index = 0

  const processedContent = content.replace(
    sqlBlockRegex,
    (_, configSingleQuote, configDoubleQuote, sql) => {
      let config: CustomChartConfig | undefined
      const configStr = configSingleQuote || configDoubleQuote
      if (configStr) {
        try {
          config = JSON.parse(configStr) as CustomChartConfig
        } catch {
          console.warn("Failed to parse chart config:", configStr)
        }
      }
      sqlBlocks.push({ sql: sql.trim(), config })
      return `__SQL_BLOCK_${index++}__`
    }
  )

  return { processedContent, sqlBlocks }
}

/**
 * Check if content contains SQL blocks
 */
export function hasSqlBlocks(content: string): boolean {
  return /<sql(?:\s+config\s*=\s*(?:'[^']*'|"[^"]*"))?\s*>[\s\S]*?<\/sql>/.test(
    content
  )
}
