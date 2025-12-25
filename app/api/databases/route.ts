import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDatabaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  sslEnabled: z.boolean().default(false),
})

// GET /api/databases - List all databases
export async function GET() {
  try {
    const databases = await prisma.external_databases.findMany({
      orderBy: { row_created_at: "desc" },
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

    const result = databases.map((db) => ({
      id: db.id.toString(),
      name: db.name,
      host: db.host,
      port: db.port,
      database: db.database,
      username: db.username,
      sslEnabled: db.ssl_enabled,
      createdAt: db.row_created_at?.toISOString(),
    }))

    return NextResponse.json({ databases: result })
  } catch (error) {
    console.error("Failed to fetch databases:", error)
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    )
  }
}

// POST /api/databases - Create a new database connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDatabaseSchema.parse(body)

    const database = await prisma.external_databases.create({
      data: {
        name: validatedData.name,
        host: validatedData.host,
        port: validatedData.port,
        database: validatedData.database,
        username: validatedData.username,
        password: validatedData.password,
        ssl_enabled: validatedData.sslEnabled,
      },
    })

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
    console.error("Failed to create database:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create database" },
      { status: 500 }
    )
  }
}

