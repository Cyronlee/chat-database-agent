import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { DashboardRenderConfig, DashboardChartItem } from "@/api-clients/dashboards"

async function validateAccess() {
  const session = await getSession()
  if (!session) {
    return { error: "Unauthorized", status: 401 }
  }

  return { session }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { id } = await params

  const dashboard = await prisma.custom_dashboards.findUnique({
    where: { id: parseInt(id) },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
  }

  const renderConfig = dashboard.render_config as unknown as DashboardRenderConfig

  // Fetch all charts referenced in the render config
  const chartIds = renderConfig.charts.map((c: DashboardChartItem) => BigInt(c.chartId))

  const charts = await prisma.custom_charts.findMany({
    where: {
      id: { in: chartIds },
    },
    select: {
      id: true,
      name: true,
      sql: true,
      chart_config: true,
    },
  })

  // Create a map for quick lookup
  const chartMap = new Map(charts.map((c) => [c.id.toString(), c]))

  // Build the charts array in the order specified by render_config
  const orderedCharts = renderConfig.charts
    .map((item: DashboardChartItem) => {
      const chart = chartMap.get(item.chartId)
      if (!chart) return null
      return {
        id: chart.id.toString(),
        name: chart.name,
        sql: chart.sql,
        chartConfig: chart.chart_config,
        width: item.width,
      }
    })
    .filter(Boolean)

  return NextResponse.json({
    dashboard: {
      id: dashboard.id.toString(),
      name: dashboard.name,
      renderConfig,
      charts: orderedCharts,
      createdAt: dashboard.row_created_at?.toISOString() ?? null,
      updatedAt: dashboard.row_updated_at?.toISOString() ?? null,
      creator: dashboard.creator
        ? {
            id: dashboard.creator.id.toString(),
            name: dashboard.creator.name,
            email: dashboard.creator.email,
          }
        : null,
    },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { id } = await params
  const body = await req.json()
  const { name, renderConfig } = body

  if (!name || !renderConfig) {
    return NextResponse.json(
      { error: "Missing required fields: name, renderConfig" },
      { status: 400 }
    )
  }

  const updatedDashboard = await prisma.custom_dashboards.update({
    where: { id: parseInt(id) },
    data: {
      name,
      render_config: renderConfig,
      row_updated_at: new Date(),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json({
    success: true,
    dashboard: {
      id: updatedDashboard.id.toString(),
      name: updatedDashboard.name,
      createdAt: updatedDashboard.row_created_at?.toISOString() ?? null,
      updatedAt: updatedDashboard.row_updated_at?.toISOString() ?? null,
      creator: updatedDashboard.creator
        ? {
            id: updatedDashboard.creator.id.toString(),
            name: updatedDashboard.creator.name,
            email: updatedDashboard.creator.email,
          }
        : null,
    },
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { id } = await params

  await prisma.custom_dashboards.delete({
    where: { id: parseInt(id) },
  })

  return NextResponse.json({ success: true })
}

