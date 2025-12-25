import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { dbManager } from "@/lib/db-manager"

// POST /api/databases/[id]/test - Test database connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const database = await prisma.external_databases.findUnique({
      where: { id: BigInt(id) },
    })

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 })
    }

    const success = await dbManager.testConnection({
      host: database.host,
      port: database.port,
      database: database.database,
      username: database.username,
      password: database.password,
      sslEnabled: database.ssl_enabled,
    })

    if (success) {
      return NextResponse.json({ success: true, message: "Connection successful" })
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to connect to database" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Failed to test database connection:", error)
    return NextResponse.json(
      { success: false, error: "Failed to test connection" },
      { status: 500 }
    )
  }
}

