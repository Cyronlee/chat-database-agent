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

export async function GET() {
  const validation = await validateAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const charts = await prisma.custom_charts.findMany({
    select: {
      id: true,
      name: true,
      row_created_at: true,
      row_updated_at: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      row_updated_at: "desc",
    },
  })

  return NextResponse.json({
    charts: charts.map((chart) => ({
      id: chart.id.toString(),
      name: chart.name,
      createdAt: chart.row_created_at?.toISOString() ?? null,
      updatedAt: chart.row_updated_at?.toISOString() ?? null,
      creator: chart.creator
        ? {
            id: chart.creator.id.toString(),
            name: chart.creator.name,
            email: chart.creator.email,
          }
        : null,
    })),
  })
}

export async function POST(req: Request) {
  const validation = await validateAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { name, sql, chartConfig } = await req.json()

  if (!name || !sql || !chartConfig) {
    return NextResponse.json(
      { error: "Name, sql, and chartConfig are required" },
      { status: 400 }
    )
  }

  const chart = await prisma.custom_charts.create({
    data: {
      name,
      sql,
      chart_config: chartConfig,
      created_by: validation.session.id,
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

