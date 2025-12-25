import { NextRequest, NextResponse } from "next/server"
import { dbManager } from "@/lib/db-manager"

export async function POST(request: NextRequest) {
  try {
    const { sql, databaseId } = await request.json()

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      )
    }

    // Execute the query against the appropriate database
    const result = databaseId
      ? await dbManager.executeQuery(databaseId, sql)
      : await dbManager.executeSystemQuery(sql)

    return NextResponse.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
    })
  } catch (error) {
    console.error("Failed to execute query:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to execute query"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
