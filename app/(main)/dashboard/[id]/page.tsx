"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboardIcon,
  SettingsIcon,
  Loader2Icon,
  ArrowLeftIcon,
  TrashIcon,
} from "lucide-react"
import {
  getDashboard,
  updateDashboard,
  deleteDashboard,
} from "@/api-clients/dashboards"
import type {
  DashboardDetail,
  DashboardChartItem,
  DashboardRenderConfig,
} from "@/api-clients/dashboards"
import { getCustomCharts } from "@/api-clients/custom-charts"
import type { CustomChart } from "@/api-clients/custom-charts"
import { DashboardChartCard } from "@/components/dashboard/DashboardChartCard"
import { DashboardChartConfigDialog } from "@/components/dashboard/DashboardChartConfigDialog"
import type { CustomChartConfig } from "@/components/chart/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DashboardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.id as string

  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null)
  const [allCharts, setAllCharts] = useState<CustomChart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [dashboardResult, chartsResult] = await Promise.all([
        getDashboard(dashboardId),
        getCustomCharts(),
      ])

      if (dashboardResult.error) {
        setError(dashboardResult.error)
      } else {
        setDashboard(dashboardResult.dashboard)
      }

      if (chartsResult.error) {
        setError(chartsResult.error)
      } else {
        setAllCharts(chartsResult.charts)
      }
    } catch (err) {
      setError("Failed to fetch dashboard")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [dashboardId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveConfig = async (
    name: string,
    chartItems: DashboardChartItem[]
  ) => {
    const renderConfig: DashboardRenderConfig = { charts: chartItems }
    const result = await updateDashboard(dashboardId, name, renderConfig)
    if (result.error) {
      throw new Error(result.error)
    }
    await fetchData()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteDashboard(dashboardId)
      if (result.error) {
        setError(result.error)
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("Failed to delete dashboard")
      console.error(err)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to Dashboards
        </Button>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Dashboard not found</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to Dashboards
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/")}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <LayoutDashboardIcon className="size-6" />
          <h1 className="text-2xl font-semibold">{dashboard.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigDialogOpen(true)}
          >
            <SettingsIcon className="mr-2 size-4" />
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <TrashIcon className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      {dashboard.charts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <LayoutDashboardIcon className="mb-4 size-16 opacity-30" />
          <h2 className="mb-2 text-lg font-medium">No charts configured</h2>
          <p className="mb-4 max-w-md text-center text-sm">
            Add charts to this dashboard by clicking the Configure button above.
          </p>
          <Button onClick={() => setIsConfigDialogOpen(true)}>
            <SettingsIcon className="mr-2 size-4" />
            Configure Dashboard
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-6">
            {dashboard.charts.map((chart) => (
              <div
                key={chart.id}
                className={
                  chart.width === "half"
                    ? "w-[calc(50%-0.75rem)] min-w-[400px]"
                    : "w-full"
                }
              >
                <DashboardChartCard
                  id={chart.id}
                  name={chart.name}
                  sql={chart.sql}
                  chartConfig={chart.chartConfig as CustomChartConfig}
                  databaseId={chart.databaseId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Dialog */}
      <DashboardChartConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
        charts={allCharts}
        initialName={dashboard.name}
        initialChartItems={dashboard.renderConfig.charts}
        onSave={handleSaveConfig}
        title="Configure Dashboard"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{dashboard.name}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
