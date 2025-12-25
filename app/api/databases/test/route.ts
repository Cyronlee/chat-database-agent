import { NextRequest, NextResponse } from "next/server"
import { dbManager } from "@/lib/db-manager"
import { z } from "zod"

const testConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  sslEnabled: z.boolean().default(false),
})

// POST /api/databases/test - Test database connection before saving
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = testConnectionSchema.parse(body)

    const success = await dbManager.testConnection({
      host: validatedData.host,
      port: validatedData.port,
      database: validatedData.database,
      username: validatedData.username,
      password: validatedData.password,
      sslEnabled: validatedData.sslEnabled,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to test connection" },
      { status: 500 }
    )
  }
}

