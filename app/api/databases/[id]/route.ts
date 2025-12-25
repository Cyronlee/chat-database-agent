import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { dbManager } from "@/lib/db-manager"
import { z } from "zod"

const updateDatabaseSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  host: z.string().min(1, "Host is required").optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1, "Database name is required").optional(),
  username: z.string().min(1, "Username is required").optional(),
  password: z.string().min(1, "Password is required").optional(),
  sslEnabled: z.boolean().optional(),
})

// GET /api/databases/[id] - Get a single database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const database = await prisma.external_databases.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        database: true,
        username: true,
        ssl_enabled: true,
        row_created_at: true,
        // Explicitly NOT including password for security
      },
    })

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 })
    }

    return NextResponse.json({
      database: {
        id: database.id.toString(),
        name: database.name,
        host: database.host,
        port: database.port,
        database: database.database,
        username: database.username,
        sslEnabled: database.ssl_enabled,
        createdAt: database.row_created_at?.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to fetch database:", error)
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    )
  }
}

// PUT /api/databases/[id] - Update a database connection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateDatabaseSchema.parse(body)

    // Check if database exists
    const existing = await prisma.external_databases.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 })
    }

    const database = await prisma.external_databases.update({
      where: { id: BigInt(id) },
      data: {
        name: validatedData.name,
        host: validatedData.host,
        port: validatedData.port,
        database: validatedData.database,
        username: validatedData.username,
        password: validatedData.password,
        ssl_enabled: validatedData.sslEnabled,
        row_updated_at: new Date(),
      },
    })

    // Invalidate the cached pool
    await dbManager.invalidatePool(id)

    return NextResponse.json({
      database: {
        id: database.id.toString(),
        name: database.name,
        host: database.host,
        port: database.port,
        database: database.database,
        username: database.username,
        sslEnabled: database.ssl_enabled,
        createdAt: database.row_created_at?.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to update database:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    )
  }
}

// DELETE /api/databases/[id] - Delete a database connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if database exists
    const existing = await prisma.external_databases.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 })
    }

    // Check if database has associated charts
    const chartCount = await prisma.custom_charts.count({
      where: { database_id: BigInt(id) },
    })

    if (chartCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete database with ${chartCount} associated chart(s). Please delete or reassign the charts first.`,
        },
        { status: 400 }
      )
    }

    // Invalidate the cached pool
    await dbManager.invalidatePool(id)

    await prisma.external_databases.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete database:", error)
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    )
  }
}

