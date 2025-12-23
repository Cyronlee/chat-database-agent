"use client"

import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Play, Loader2, Download, Table2, BarChart3, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SchemaTree } from "@/components/database/schema-tree"
import { QueryResults } from "@/components/database/query-results"
import { ChartRenderer } from "@/components/chart/ChartRenderer"
import { ChartConfigEditor } from "@/components/chart/ChartConfigEditor"
import { autoInitChartConfig } from "@/components/chart/utils"
import {
  createCustomChart,
  getCustomChart,
  updateCustomChart,
} from "@/api-clients/custom-charts"
import type { CustomChartConfig } from "@/components/chart/types"
import type { TableSchema } from "@/app/api/database/schema/route"

function DataStudioContent() {
  const searchParams = useSearchParams()
  const chartIdParam = searchParams.get("chartId")

  const [schema, setSchema] = useState<TableSchema[]>([])
  const [sql, setSql] = useState("SELECT * FROM jira_projects LIMIT 10")
  const [isLoading, setIsLoading] = useState(false)
  const [isSchemaLoading, setIsSchemaLoading] = useState(true)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  } | null>(null)
  const [chartConfig, setChartConfig] = useState<CustomChartConfig | null>(null)
  const [activeTab, setActiveTab] = useState<string>("table")
  const [hasAutoInitialized, setHasAutoInitialized] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isSaveAsNewDialog, setIsSaveAsNewDialog] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [chartName, setChartName] = useState("")
  const [updateChartName, setUpdateChartName] = useState("")
  const [loadedChartName, setLoadedChartName] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const loadedChartIdRef = useRef<string | null>(null)

  const executeQuery = useCallback(
    async (queryToExecute: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/database/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql: queryToExecute }),
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
    },
    [setIsLoading, setError, setQueryResult]
  )

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

  // Load chart when chartId param changes
  useEffect(() => {
    if (!chartIdParam || loadedChartIdRef.current === chartIdParam) return

    async function loadChart(chartId: string) {
      setIsLoadingChart(true)
      try {
        const result = await getCustomChart(chartId)
        if (result.error) {
          setError(result.error)
        } else {
          const chart = result.chart
          setSql(chart.sql)
          // Set the loaded chart config directly
          setChartConfig(chart.chartConfig)
          setLoadedChartName(chart.name)
          setHasAutoInitialized(true) // Mark as initialized to prevent auto-init
          setActiveTab("chart")
          loadedChartIdRef.current = chartIdParam

          // Auto-execute the query
          await executeQuery(chart.sql)
        }
      } catch (err) {
        setError("Failed to load chart")
        console.error(err)
      } finally {
        setIsLoadingChart(false)
      }
    }
    loadChart(chartIdParam)
  }, [chartIdParam, executeQuery])

  // Auto-initialize chart config when switching to chart tab (if not already initialized)
  useEffect(() => {
    if (
      activeTab === "chart" &&
      !hasAutoInitialized &&
      queryResult &&
      queryResult.rows.length > 0
    ) {
      const autoConfig = autoInitChartConfig(queryResult.rows)
      setChartConfig(autoConfig)
      setHasAutoInitialized(true)
    }
  }, [activeTab, hasAutoInitialized, queryResult])

  // Reset auto-initialized flag when query result changes (new query executed)
  useEffect(() => {
    // Only reset if we're not loading a custom chart
    if (!chartIdParam || loadedChartIdRef.current !== chartIdParam) {
      setHasAutoInitialized(false)
      setChartConfig(null)
    }
  }, [queryResult, chartIdParam])

  const handleExecute = async () => {
    await executeQuery(sql)
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

  const handleSaveAsNew = async () => {
    if (!chartName.trim() || !sql.trim() || !chartConfig) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await createCustomChart(
        chartName.trim(),
        sql.trim(),
        chartConfig
      )
      if (result.error) {
        setSaveError(result.error)
      } else {
        setIsSaveDialogOpen(false)
        setIsSaveAsNewDialog(false)
        setChartName("")
      }
    } catch (err) {
      setSaveError("Failed to save chart")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenUpdateDialog = () => {
    setUpdateChartName(loadedChartName || "")
    setUpdateError(null)
    setIsUpdateDialogOpen(true)
  }

  const handleUpdateChart = async () => {
    if (!chartIdParam || !updateChartName.trim() || !sql.trim() || !chartConfig)
      return

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const result = await updateCustomChart(
        chartIdParam,
        updateChartName.trim(),
        sql.trim(),
        chartConfig
      )
      if (result.error) {
        setUpdateError(result.error)
      } else {
        setUpdateError(null)
        // Update the loaded chart name in case it changed
        setLoadedChartName(result.chart.name)
        setIsUpdateDialogOpen(false)
      }
    } catch (err) {
      setUpdateError("Failed to update chart")
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoadingChart) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <ResizablePanelGroup direction="vertical" className="flex-1">
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
                      <TabsList>
                        <TabsTrigger value="table">
                          <Table2 className="h-4 w-4 mr-2" />
                          Table
                        </TabsTrigger>
                        <TabsTrigger value="chart">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Chart
                        </TabsTrigger>
                      </TabsList>
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
                      {chartIdParam && loadedChartName ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenUpdateDialog}
                            disabled={
                              !chartConfig || queryResult.rowCount === 0
                            }
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsSaveAsNewDialog(true)
                              setChartName("")
                              setSaveError(null)
                            }}
                            disabled={
                              !chartConfig || queryResult.rowCount === 0
                            }
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save as New
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsSaveDialogOpen(true)
                            setChartName("")
                            setSaveError(null)
                          }}
                          disabled={!chartConfig || queryResult.rowCount === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Chart
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
                {updateError && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 mx-4 mt-4 text-destructive text-sm">
                    {updateError}
                  </div>
                )}
                {error ? (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 m-4 text-destructive text-sm">
                    {error}
                  </div>
                ) : queryResult ? (
                  <>
                    <TabsContent value="table" className="flex-1 min-h-0 mt-0">
                      <QueryResults
                        columns={queryResult.columns}
                        rows={queryResult.rows}
                      />
                    </TabsContent>

                    <TabsContent value="chart" className="flex-1 min-h-0 mt-0">
                      {chartConfig && queryResult.rows.length > 0 ? (
                        <ResizablePanelGroup direction="horizontal">
                          {/* Chart Config Editor */}
                          <ResizablePanel
                            defaultSize={30}
                            minSize={20}
                            maxSize={50}
                          >
                            <div className="h-full overflow-y-auto border-r">
                              <ChartConfigEditor
                                data={queryResult.rows}
                                value={chartConfig}
                                onChange={setChartConfig}
                              />
                            </div>
                          </ResizablePanel>

                          <ResizableHandle withHandle />

                          {/* Chart Preview */}
                          <ResizablePanel defaultSize={70}>
                            <div className="h-full bg-background">
                              <ChartRenderer
                                data={queryResult.rows}
                                config={chartConfig}
                              />
                            </div>
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available for chart visualization
                        </div>
                      )}
                    </TabsContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Execute a query to see results
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Tabs>
      </ResizablePanel>

      {/* Save new chart dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Chart</DialogTitle>
            <DialogDescription>
              Enter a name for your custom chart. The current SQL query and
              chart configuration will be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="Enter custom chart name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && chartName.trim()) {
                  handleSaveAsNew()
                }
              }}
            />
            {saveError && (
              <p className="text-sm text-destructive mt-2">{saveError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false)
                setChartName("")
                setSaveError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsNew}
              disabled={!chartName.trim() || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as new dialog (when editing existing chart) */}
      <Dialog open={isSaveAsNewDialog} onOpenChange={setIsSaveAsNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Chart</DialogTitle>
            <DialogDescription>
              Enter a name for your new chart. This will create a copy with the
              current SQL query and chart configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="Enter chart name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && chartName.trim()) {
                  handleSaveAsNew()
                }
              }}
            />
            {saveError && (
              <p className="text-sm text-destructive mt-2">{saveError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveAsNewDialog(false)
                setChartName("")
                setSaveError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsNew}
              disabled={!chartName.trim() || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update chart dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Chart</DialogTitle>
            <DialogDescription>
              Update the chart name and save the current SQL query and chart
              configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={updateChartName}
              onChange={(e) => setUpdateChartName(e.target.value)}
              placeholder="Enter chart name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && updateChartName.trim()) {
                  handleUpdateChart()
                }
              }}
            />
            {updateError && (
              <p className="text-sm text-destructive mt-2">{updateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateDialogOpen(false)
                setUpdateChartName("")
                setUpdateError(null)
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChart}
              disabled={!updateChartName.trim() || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResizablePanelGroup>
  )
}

function DataStudioFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function DatabasePage() {
  return (
    <Suspense fallback={<DataStudioFallback />}>
      <DataStudioContent />
    </Suspense>
  )
}
