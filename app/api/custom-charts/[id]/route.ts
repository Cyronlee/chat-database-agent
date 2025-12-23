import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  const chart = await prisma.custom_charts.findUnique({
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

  if (!chart) {
    return NextResponse.json({ error: "Chart not found" }, { status: 404 })
  }

  return NextResponse.json({
    chart: {
      id: chart.id.toString(),
      name: chart.name,
      sql: chart.sql,
      chartConfig: chart.chart_config,
      createdAt: chart.row_created_at?.toISOString() ?? null,
      updatedAt: chart.row_updated_at?.toISOString() ?? null,
      creator: chart.creator
        ? {
            id: chart.creator.id.toString(),
            name: chart.creator.name,
            email: chart.creator.email,
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
  const { name, sql, chartConfig } = body

  if (!name || !sql || !chartConfig) {
    return NextResponse.json(
      { error: "Missing required fields: name, sql, chartConfig" },
      { status: 400 }
    )
  }

  const updatedChart = await prisma.custom_charts.update({
    where: { id: parseInt(id) },
    data: {
      name,
      sql,
      chart_config: chartConfig,
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
    chart: {
      id: updatedChart.id.toString(),
      name: updatedChart.name,
      sql: updatedChart.sql,
      chartConfig: updatedChart.chart_config,
      createdAt: updatedChart.row_created_at?.toISOString() ?? null,
      updatedAt: updatedChart.row_updated_at?.toISOString() ?? null,
      creator: updatedChart.creator
        ? {
            id: updatedChart.creator.id.toString(),
            name: updatedChart.creator.name,
            email: updatedChart.creator.email,
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

  await prisma.custom_charts.delete({
    where: { id: parseInt(id) },
  })

  return NextResponse.json({ success: true })
}

