"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  RefreshCwIcon,
  DownloadIcon,
  MaximizeIcon,
  XIcon,
  Loader2Icon,
  BarChart3Icon,
  TableIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QueryResults } from "@/components/database/query-results"
import { ChartRenderer } from "@/components/chart/ChartRenderer"
import type { CustomChartConfig, TableData } from "@/components/chart/types"
import type { QueryResult } from "@/api-clients/database-query"
import {
  type QueryState,
  runChartQuery,
  downloadCsv,
} from "@/components/chart/chart-query-utils"

interface DashboardChartCardProps {
  id: string
  name: string
  sql: string
  chartConfig: CustomChartConfig
}

export function DashboardChartCard({
  name,
  sql,
  chartConfig,
}: DashboardChartCardProps) {
  const [queryState, setQueryState] = useState<QueryState>("idle")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("chart")
  const hasExecutedRef = useRef(false)

  const runQuery = useCallback(async () => {
    if (!sql.trim()) return

    setQueryState("loading")
    setError(null)

    const response = await runChartQuery(sql)
    setQueryState(response.state)
    setResult(response.result)
    setError(response.error)
  }, [sql])

  // Auto-execute on mount
  useEffect(() => {
    if (sql && !hasExecutedRef.current) {
      hasExecutedRef.current = true
      runQuery()
    }
  }, [sql, runQuery])

  const handleDownloadCsv = () => {
    if (result && result.rowCount > 0) {
      downloadCsv(result, `${name}-${Date.now()}.csv`)
    }
  }

  const renderContent = (isExpanded: boolean) => {
    const chartHeight = isExpanded ? "h-full" : "h-[360px]"

    if (queryState === "loading") {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-2 ${chartHeight} text-muted-foreground`}
        >
          <Loader2Icon className="size-6 animate-spin" />
          <p className="text-xs">Loading...</p>
        </div>
      )
    }

    if (queryState === "error") {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-2 ${chartHeight} text-destructive`}
        >
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
          <div
            className={`flex flex-col items-center justify-center gap-2 ${chartHeight} text-muted-foreground`}
          >
            <p className="text-sm">No data</p>
          </div>
        )
      }

      return (
        <div className={`${chartHeight} overflow-hidden`}>
          <TabsContent value="chart" className="mt-0 h-full">
            <ChartRenderer
              data={result.rows as TableData[]}
              config={chartConfig}
              className="h-full"
            />
          </TabsContent>
          <TabsContent value="table" className="mt-0 h-full p-0">
            <QueryResults columns={result.columns} rows={result.rows} />
          </TabsContent>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-center ${chartHeight} text-muted-foreground`}
      >
        <p className="text-sm">No data</p>
      </div>
    )
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col overflow-hidden rounded-lg border bg-background gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="truncate text-sm font-medium">{name}</h3>
          <div className="flex items-center gap-1">
            {queryState === "success" && result && result.rowCount > 0 && (
              <>
                <TabsList className="h-7 bg-muted/50 p-0.5">
                  <TabsTrigger
                    value="chart"
                    className="h-6 px-2 text-xs data-[state=active]:bg-background"
                  >
                    <BarChart3Icon className="size-3" />
                    Chart
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="h-6 px-2 text-xs data-[state=active]:bg-background"
                  >
                    <TableIcon className="size-3" />
                    Table
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDownloadCsv}
                  className="size-7"
                  title="Download CSV"
                >
                  <DownloadIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsFullscreen(true)}
                  className="size-7"
                  title="Fullscreen"
                >
                  <MaximizeIcon className="size-3.5" />
                </Button>
              </>
            )}
            {queryState === "loading" ? (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                className="size-7"
              >
                <Loader2Icon className="size-3.5 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={runQuery}
                className="size-7"
                title="Refresh"
              >
                <RefreshCwIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderContent(false)}</div>
      </Tabs>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[95vh] max-w-[95vw] flex-col p-0"
        >
          <DialogHeader className="flex-shrink-0 border-b border-border px-4 py-3 mb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-medium">{name}</DialogTitle>
              <div className="flex items-center gap-1">
                {queryState === "success" && result && result.rowCount > 0 && (
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="gap-0"
                  >
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
                  onClick={() => setIsFullscreen(false)}
                  className="size-7"
                  title="Close"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 overflow-hidden"
          >
            {renderContent(true)}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
