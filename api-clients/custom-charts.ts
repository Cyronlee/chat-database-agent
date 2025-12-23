import type { CustomChartConfig } from "@/components/chart/types"

export interface CustomChart {
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

export interface CustomChartDetail extends CustomChart {
  sql: string
  chartConfig: CustomChartConfig
}

export interface CustomChartsListResponse {
  charts: CustomChart[]
  error?: string
}

export interface CustomChartGetResponse {
  chart: CustomChartDetail
  error?: string
}

export interface CustomChartCreateResponse {
  success: boolean
  chart: CustomChartDetail
  error?: string
}

export interface CustomChartDeleteResponse {
  success: boolean
  error?: string
}

export interface CustomChartUpdateResponse {
  success: boolean
  chart: CustomChartDetail
  error?: string
}

export async function getCustomCharts(): Promise<CustomChartsListResponse> {
  const response = await fetch("/api/custom-charts")
  return response.json()
}

export async function getCustomChart(
  id: string
): Promise<CustomChartGetResponse> {
  const response = await fetch(`/api/custom-charts/${id}`)
  return response.json()
}

export async function createCustomChart(
  name: string,
  sql: string,
  chartConfig: CustomChartConfig
): Promise<CustomChartCreateResponse> {
  const response = await fetch("/api/custom-charts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, sql, chartConfig }),
  })
  return response.json()
}

export async function deleteCustomChart(
  id: string
): Promise<CustomChartDeleteResponse> {
  const response = await fetch(`/api/custom-charts/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

export async function updateCustomChart(
  id: string,
  name: string,
  sql: string,
  chartConfig: CustomChartConfig
): Promise<CustomChartUpdateResponse> {
  const response = await fetch(`/api/custom-charts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, sql, chartConfig }),
  })
  return response.json()
}
