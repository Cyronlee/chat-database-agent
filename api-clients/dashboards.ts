import type { CustomChartConfig } from "@/components/chart/types"

export type ChartWidth = "half" | "full"

export interface DashboardChartItem {
  chartId: string
  width: ChartWidth
}

export interface DashboardRenderConfig {
  charts: DashboardChartItem[]
}

export interface Dashboard {
  id: string
  name: string
  createdAt: string | null
  updatedAt: string | null
  creator: {
    id: string
    name: string
    email: string
  } | null
}

export interface DashboardChart {
  id: string
  name: string
  sql: string
  chartConfig: CustomChartConfig
  width: ChartWidth
}

export interface DashboardDetail extends Dashboard {
  renderConfig: DashboardRenderConfig
  charts: DashboardChart[]
}

export interface DashboardsListResponse {
  dashboards: Dashboard[]
  error?: string
}

export interface DashboardGetResponse {
  dashboard: DashboardDetail
  error?: string
}

export interface DashboardCreateResponse {
  success: boolean
  dashboard: Dashboard
  error?: string
}

export interface DashboardUpdateResponse {
  success: boolean
  dashboard: Dashboard
  error?: string
}

export interface DashboardDeleteResponse {
  success: boolean
  error?: string
}

export async function getDashboards(): Promise<DashboardsListResponse> {
  const response = await fetch("/api/dashboards")
  return response.json()
}

export async function getDashboard(id: string): Promise<DashboardGetResponse> {
  const response = await fetch(`/api/dashboards/${id}`)
  return response.json()
}

export async function createDashboard(
  name: string,
  renderConfig: DashboardRenderConfig
): Promise<DashboardCreateResponse> {
  const response = await fetch("/api/dashboards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, renderConfig }),
  })
  return response.json()
}

export async function updateDashboard(
  id: string,
  name: string,
  renderConfig: DashboardRenderConfig
): Promise<DashboardUpdateResponse> {
  const response = await fetch(`/api/dashboards/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, renderConfig }),
  })
  return response.json()
}

export async function deleteDashboard(
  id: string
): Promise<DashboardDeleteResponse> {
  const response = await fetch(`/api/dashboards/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

