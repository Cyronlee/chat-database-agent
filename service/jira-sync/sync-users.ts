import { getJiraConfig, getJiraAuthHeaders } from "@/lib/jira-config"
import type { JiraUser } from "@/lib/jira-config"
import { prisma } from "@/lib/prisma"
import type { SyncTaskResult } from "./types"

/**
 * Sync Jira users data
 */
export async function syncUsers(): Promise<SyncTaskResult> {
  const startTime = Date.now()
  const taskName = "Users"

  console.log(`[${taskName}] Starting user data sync...`)

  try {
    const config = getJiraConfig()
    const headers = getJiraAuthHeaders()

    // Paginate to get all active user data
    const allJiraUsers: JiraUser[] = []
    let startAt = 0
    const maxResults = 1000
    let hasMoreData = true

    while (hasMoreData) {
      console.log(
        `[${taskName}] Fetching user data, startAt: ${startAt}, maxResults: ${maxResults}`
      )

      const jiraResponse = await fetch(
        `${config.baseUrl}/rest/api/2/users?startAt=${startAt}&maxResults=${maxResults}`,
        {
          method: "GET",
          headers,
        }
      )

      if (!jiraResponse.ok) {
        const errorText = await jiraResponse.text()
        console.error(
          `[${taskName}] Jira API error: ${jiraResponse.status} ${jiraResponse.statusText}`,
          errorText
        )
        return {
          taskName,
          success: false,
          duration: Date.now() - startTime,
          created: 0,
          updated: 0,
          errors: 1,
          message: `Jira API error: ${jiraResponse.status} ${jiraResponse.statusText}`,
        }
      }

      const batchUsers: JiraUser[] = await jiraResponse.json()

      // Only keep active users
      const activeUsers = batchUsers.filter((user) => user.active)
      console.log(
        `[${taskName}] Fetched ${batchUsers.length} users, ${activeUsers.length} are active`
      )

      if (batchUsers.length === 0) {
        hasMoreData = false
        console.log(`[${taskName}] No more user data, pagination complete`)
      } else {
        allJiraUsers.push(...activeUsers)
        startAt += maxResults

        if (batchUsers.length < maxResults) {
          hasMoreData = false
          console.log(`[${taskName}] All user data fetched (last page)`)
        }
      }
    }

    console.log(
      `[${taskName}] Total ${allJiraUsers.length} active users fetched, starting database sync...`
    )

    // Batch sync user data to database
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    }

    for (let i = 0; i < allJiraUsers.length; i++) {
      const jiraUser = allJiraUsers[i]

      // Output progress every 100 users
      if (i % 100 === 0 || i === allJiraUsers.length - 1) {
        const percentage = Math.round(((i + 1) / allJiraUsers.length) * 100)
        console.log(
          `[${taskName}] Syncing user ${i + 1}/${allJiraUsers.length} (${percentage}%)`
        )
      }

      try {
        // Find existing user
        const existingUser = await prisma.jira_users.findFirst({
          where: { account_id: jiraUser.accountId },
        })

        if (existingUser) {
          // Update existing user
          await prisma.jira_users.update({
            where: { id: existingUser.id },
            data: {
              email:
                jiraUser.emailAddress || jiraUser.name || jiraUser.displayName,
              name: jiraUser.displayName,
              actived: jiraUser.active,
              row_updated_at: new Date(),
            },
          })
          syncResults.updated++
        } else {
          // Create new user
          await prisma.jira_users.create({
            data: {
              source_id: jiraUser.accountId,
              account_id: jiraUser.accountId,
              email:
                jiraUser.emailAddress || jiraUser.name || jiraUser.displayName,
              name: jiraUser.displayName,
              actived: jiraUser.active,
              row_created_at: new Date(),
              row_updated_at: new Date(),
            },
          })
          syncResults.created++
        }
      } catch (error) {
        console.error(
          `[${taskName}] Failed to sync user: ${jiraUser.displayName} (${jiraUser.accountId})`,
          error instanceof Error ? error.message : String(error)
        )
        syncResults.errors++
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[${taskName}] User sync completed! Created ${syncResults.created}, updated ${syncResults.updated}, errors ${syncResults.errors}, duration ${duration}ms`
    )

    return {
      taskName,
      success: true,
      duration,
      created: syncResults.created,
      updated: syncResults.updated,
      errors: syncResults.errors,
      message: `Created ${syncResults.created}, updated ${syncResults.updated}, errors ${syncResults.errors}`,
      details: {
        totalUsers: allJiraUsers.length,
      },
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(
      `[${taskName}] Error during sync process`,
      error instanceof Error ? error.message : String(error)
    )
    return {
      taskName,
      success: false,
      duration,
      created: 0,
      updated: 0,
      errors: 1,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
