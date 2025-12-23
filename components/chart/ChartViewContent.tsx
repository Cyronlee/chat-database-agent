"use client"

import { DatabaseIcon, Loader2Icon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QueryResults } from "@/components/database/query-results"
import { ChartRenderer } from "@/components/chart/ChartRenderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3Icon, TableIcon, RefreshCwIcon } from "lucide-react"
import type { CustomChartConfig, TableData } from "@/components/chart/types"
import type { QueryResult } from "@/api-clients/database-query"
import type { QueryState } from "./chart-query-utils"

interface ChartViewContentProps {
  queryState: QueryState
  result: QueryResult | null
  error: string | null
  chartConfig?: CustomChartConfig
  activeTab: string
  onTabChange: (tab: string) => void
  onRetry?: () => void
  isExpanded?: boolean
  showTabSwitcher?: boolean
}

export function ChartViewContent({
  queryState,
  result,
  error,
  chartConfig,
  activeTab,
  onTabChange,
  onRetry,
  isExpanded = false,
  showTabSwitcher = true,
}: ChartViewContentProps) {
  const hasChart = !!chartConfig
  const contentHeight = isExpanded ? "h-[calc(100vh-180px)]" : "h-[400px]"
  const chartHeight = isExpanded ? "h-[calc(100vh-220px)]" : "h-[350px]"

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
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCwIcon className="mr-1 size-3" />
            Retry
          </Button>
        )}
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

    if (hasChart && showTabSwitcher) {
      return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full">
          <div className={`${contentHeight} overflow-auto`}>
            <TabsContent value="chart" className={`mt-0 ${chartHeight} p-4`}>
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
        </Tabs>
      )
    }

    if (hasChart) {
      // Chart only mode (used in fullscreen dialog where tabs are external)
      if (activeTab === "chart") {
        return (
          <div className={`${chartHeight} p-4`}>
            <ChartRenderer
              data={result.rows as TableData[]}
              config={chartConfig}
              className="h-full"
            />
          </div>
        )
      }
      return (
        <div className={`${contentHeight} overflow-auto`}>
          <QueryResults columns={result.columns} rows={result.rows} />
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

interface ChartTabSwitcherProps {
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

export function ChartTabSwitcher({
  activeTab,
  onTabChange,
  className,
}: ChartTabSwitcherProps) {
  return (
    <TabsList className={`h-7 bg-muted/50 p-0.5 ${className || ""}`}>
      <TabsTrigger
        value="chart"
        onClick={() => onTabChange("chart")}
        className="h-6 px-2 text-xs data-[state=active]:bg-background"
        data-state={activeTab === "chart" ? "active" : "inactive"}
      >
        <BarChart3Icon className="mr-1 size-3" />
        Chart
      </TabsTrigger>
      <TabsTrigger
        value="table"
        onClick={() => onTabChange("table")}
        className="h-6 px-2 text-xs data-[state=active]:bg-background"
        data-state={activeTab === "table" ? "active" : "inactive"}
      >
        <TableIcon className="mr-1 size-3" />
        Table
      </TabsTrigger>
    </TabsList>
  )
}

