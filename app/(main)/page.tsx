"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboardIcon,
  PlusIcon,
  Loader2Icon,
  CalendarIcon,
  UserIcon,
} from "lucide-react"
import { getDashboards, createDashboard } from "@/api-clients/dashboards"
import { getCustomCharts } from "@/api-clients/custom-charts"
import type {
  Dashboard,
  DashboardChartItem,
  DashboardRenderConfig,
} from "@/api-clients/dashboards"
import type { CustomChart } from "@/api-clients/custom-charts"
import { DashboardChartConfigDialog } from "@/components/dashboard/DashboardChartConfigDialog"

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface DashboardCardProps {
  dashboard: Dashboard
  onClick: () => void
}

function DashboardCard({ dashboard, onClick }: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border bg-background p-4 text-left cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <LayoutDashboardIcon className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-medium">{dashboard.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {dashboard.creator && (
              <span className="flex items-center gap-1">
                <UserIcon className="size-3" />
                {dashboard.creator.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {formatDate(dashboard.updatedAt || dashboard.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [allCharts, setAllCharts] = useState<CustomChart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [dashboardsResult, chartsResult] = await Promise.all([
        getDashboards(),
        getCustomCharts(),
      ])

      if (dashboardsResult.error) {
        setError(dashboardsResult.error)
      } else {
        setDashboards(dashboardsResult.dashboards)
      }

      if (chartsResult.error) {
        setError(chartsResult.error)
      } else {
        setAllCharts(chartsResult.charts)
      }
    } catch (err) {
      setError("Failed to fetch data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateDashboard = async (
    name: string,
    chartItems: DashboardChartItem[]
  ) => {
    const renderConfig: DashboardRenderConfig = { charts: chartItems }
    const result = await createDashboard(name, renderConfig)
    if (result.error) {
      throw new Error(result.error)
    }
    // Navigate to the new dashboard
    router.push(`/dashboard/${result.dashboard.id}`)
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
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboardIcon className="size-6" />
          <h1 className="text-2xl font-semibold">Dashboards</h1>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          New Dashboard
        </Button>
      </div>

      {/* Dashboard List */}
      {dashboards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <LayoutDashboardIcon className="mb-4 size-16 opacity-30" />
          <h2 className="mb-2 text-lg font-medium">No dashboards yet</h2>
          <p className="mb-4 max-w-md text-center text-sm">
            Create your first dashboard to organize and display your charts.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            Create Dashboard
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            {dashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.id}
                dashboard={dashboard}
                onClick={() => router.push(`/dashboard/${dashboard.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Dashboard Dialog */}
      <DashboardChartConfigDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        charts={allCharts}
        onSave={handleCreateDashboard}
        title="Create Dashboard"
      />
    </div>
  )
}
