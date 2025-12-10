import { NextResponse } from "next/server"
import {
  syncUsers,
  syncProjects,
  syncCustomFields,
  syncSprints,
  syncIssues,
} from "@/service/jira-sync"
import type { SyncTaskResult, SyncAllResult } from "@/service/jira-sync"

/**
 * Unified sync API endpoint
 * Executes all sync tasks in order: Users -> Projects -> CustomFields -> Sprints -> Issues
 */
export async function POST(): Promise<NextResponse> {
  const startTime = Date.now()
  const startedAt = new Date().toISOString()
  const tasks: SyncTaskResult[] = []

  console.log("========================================")
  console.log("[SyncAll] Starting full sync tasks...")
  console.log(`[SyncAll] Start time: ${startedAt}`)
  console.log("========================================")

  // 1. Sync Users
  console.log("\n[SyncAll] Step 1/5: Syncing user data")
  const usersResult = await syncUsers()
  tasks.push(usersResult)
  console.log(
    `[SyncAll] Step 1/5 completed: ${
      usersResult.success ? "Success" : "Failed"
    }\n`
  )

  // 2. Sync Projects and Boards
  console.log("[SyncAll] Step 2/5: Syncing projects and boards data")
  const projectsResult = await syncProjects()
  tasks.push(projectsResult)
  console.log(
    `[SyncAll] Step 2/5 completed: ${
      projectsResult.success ? "Success" : "Failed"
    }\n`
  )

  // 3. Sync Custom Fields
  console.log("[SyncAll] Step 3/5: Syncing custom fields data")
  const customFieldsResult = await syncCustomFields()
  tasks.push(customFieldsResult)
  console.log(
    `[SyncAll] Step 3/5 completed: ${
      customFieldsResult.success ? "Success" : "Failed"
    }\n`
  )

  // 4. Sync Sprints
  console.log("[SyncAll] Step 4/5: Syncing sprints data")
  const sprintsResult = await syncSprints()
  tasks.push(sprintsResult)
  console.log(
    `[SyncAll] Step 4/5 completed: ${
      sprintsResult.success ? "Success" : "Failed"
    }\n`
  )

  // 5. Sync Issues
  console.log("[SyncAll] Step 5/5: Syncing issues data")
  const issuesResult = await syncIssues()
  tasks.push(issuesResult)
  console.log(
    `[SyncAll] Step 5/5 completed: ${
      issuesResult.success ? "Success" : "Failed"
    }\n`
  )

  // Calculate summary
  const totalDuration = Date.now() - startTime
  const completedAt = new Date().toISOString()

  const summary = {
    totalCreated: tasks.reduce((sum, t) => sum + t.created, 0),
    totalUpdated: tasks.reduce((sum, t) => sum + t.updated, 0),
    totalErrors: tasks.reduce((sum, t) => sum + t.errors, 0),
    successfulTasks: tasks.filter((t) => t.success).length,
    failedTasks: tasks.filter((t) => !t.success).length,
  }

  const result: SyncAllResult = {
    success: summary.failedTasks === 0,
    totalDuration,
    startedAt,
    completedAt,
    tasks,
    summary,
  }

  console.log("========================================")
  console.log("[SyncAll] Full sync completed!")
  console.log(`[SyncAll] End time: ${completedAt}`)
  console.log(
    `[SyncAll] Total duration: ${totalDuration}ms (${(
      totalDuration / 1000
    ).toFixed(2)}s)`
  )
  console.log(
    `[SyncAll] Successful tasks: ${summary.successfulTasks}/${tasks.length}`
  )
  console.log(
    `[SyncAll] Total created: ${summary.totalCreated}, Total updated: ${summary.totalUpdated}, Total errors: ${summary.totalErrors}`
  )
  console.log("========================================\n")

  return NextResponse.json(result)
}
