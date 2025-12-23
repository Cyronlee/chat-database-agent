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

  const dashboards = await prisma.custom_dashboards.findMany({
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
    dashboards: dashboards.map((dashboard) => ({
      id: dashboard.id.toString(),
      name: dashboard.name,
      createdAt: dashboard.row_created_at?.toISOString() ?? null,
      updatedAt: dashboard.row_updated_at?.toISOString() ?? null,
      creator: dashboard.creator
        ? {
            id: dashboard.creator.id.toString(),
            name: dashboard.creator.name,
            email: dashboard.creator.email,
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

  const { name, renderConfig } = await req.json()

  if (!name || !renderConfig) {
    return NextResponse.json(
      { error: "Name and renderConfig are required" },
      { status: 400 }
    )
  }

  const dashboard = await prisma.custom_dashboards.create({
    data: {
      name,
      render_config: renderConfig,
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
    dashboard: {
      id: dashboard.id.toString(),
      name: dashboard.name,
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

