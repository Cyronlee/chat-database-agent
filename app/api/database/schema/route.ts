import { NextRequest, NextResponse } from "next/server"
import { dbManager } from "@/lib/db-manager"

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
}

export interface TableSchema {
  name: string
  columns: TableColumn[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("databaseId")

    // Get schema from the appropriate database
    const schema = databaseId
      ? await dbManager.getSchema(databaseId)
      : await dbManager.getSystemSchema()

    return NextResponse.json({ schema })
  } catch (error) {
    console.error("Failed to fetch database schema:", error)
    return NextResponse.json(
      { error: "Failed to fetch database schema" },
      { status: 500 }
    )
  }
}

