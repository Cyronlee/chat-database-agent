import { getJiraConfig, getJiraAuthHeaders } from "@/lib/jira-config"
import { prisma } from "@/lib/prisma"
import type { SyncTaskResult } from "./types"

interface JiraSprint {
  id: number
  name: string
  state: string
  startDate?: string
  endDate?: string
  completeDate?: string
}

interface SprintWithBoard extends JiraSprint {
  boardId: string | null
  boardDbId: bigint
  boardName: string | null
}

/**
 * Sync Jira Sprints data
 * Gets existing boards from database, then fetches sprints for each board
 */
export async function syncSprints(): Promise<SyncTaskResult> {
  const startTime = Date.now()
  const taskName = "Sprints"

  console.log(`[${taskName}] Starting Sprints data sync...`)

  try {
    const config = getJiraConfig()
    const headers = getJiraAuthHeaders()

    // Get existing boards from database (only boards that support sprints)
    console.log(`[${taskName}] Fetching Boards data from database...`)

    const allBoards = await prisma.jira_boards.findMany({
      where: {
        supports_sprints: true,
        api_accessible: true,
      },
      select: {
        id: true,
        source_id: true,
        name: true,
        board_type: true,
      },
    })

    console.log(
      `[${taskName}] Found ${allBoards.length} Boards that support Sprints from database`
    )

    if (allBoards.length === 0) {
      console.error(
        `[${taskName}] No Boards found that support Sprints, please sync Projects and Boards data first`
      )
      return {
        taskName,
        success: false,
        duration: Date.now() - startTime,
        created: 0,
        updated: 0,
        errors: 1,
        message:
          "No Boards found that support Sprints, please sync Projects and Boards data first",
      }
    }

    // Get sprints for each board
    const allSprints: SprintWithBoard[] = []

    for (let boardIndex = 0; boardIndex < allBoards.length; boardIndex++) {
      const board = allBoards[boardIndex]

      try {
        let sprintStartAt = 0
        const sprintMaxResults = 1000
        let hasMoreSprints = true

        while (hasMoreSprints) {
          const sprintsUrl = new URL(
            `${config.baseUrl}/rest/agile/1.0/board/${board.source_id}/sprint`
          )
          sprintsUrl.searchParams.set("startAt", sprintStartAt.toString())
          sprintsUrl.searchParams.set("maxResults", sprintMaxResults.toString())

          const sprintsResponse = await fetch(sprintsUrl.toString(), {
            method: "GET",
            headers,
          })

          if (!sprintsResponse.ok) {
            const errorText = await sprintsResponse.text()
            console.error(
              `[${taskName}] Failed to fetch Sprints for Board ${board.source_id}: ${sprintsResponse.status}`,
              errorText
            )
            break
          }

          const sprintsResult = await sprintsResponse.json()

          if (sprintsResult.values.length === 0) {
            hasMoreSprints = false
          } else {
            // Add board info to each sprint
            const sprintsWithBoard = sprintsResult.values.map(
              (sprint: JiraSprint) => ({
                ...sprint,
                boardId: board.source_id,
                boardDbId: board.id,
                boardName: board.name,
              })
            )

            allSprints.push(...sprintsWithBoard)
            sprintStartAt += sprintMaxResults

            if (
              sprintsResult.values.length < sprintMaxResults ||
              sprintsResult.isLast ||
              sprintStartAt >= sprintsResult.total
            ) {
              hasMoreSprints = false
            }
          }
        }
      } catch (error) {
        console.error(
          `[${taskName}] Error processing Board ${board.source_id}`,
          error instanceof Error ? error.message : String(error)
        )
      }

      // Show overall progress
      if (boardIndex % 10 === 0 || boardIndex === allBoards.length - 1) {
        const boardProgress = Math.round(
          ((boardIndex + 1) / allBoards.length) * 100
        )
        console.log(
          `[${taskName}] Board processing progress: ${boardIndex + 1}/${
            allBoards.length
          } (${boardProgress}%)`
        )
      }
    }

    console.log(
      `[${taskName}] Total ${allSprints.length} Sprints fetched, starting database sync...`
    )

    // Sync Sprints to database
    const sprintSyncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    }

    for (let i = 0; i < allSprints.length; i++) {
      const sprint = allSprints[i]

      // Output progress every 20 Sprints
      if (i % 20 === 0 || i === allSprints.length - 1) {
        const percentage = Math.round(((i + 1) / allSprints.length) * 100)
        console.log(
          `[${taskName}] Syncing Sprint ${i + 1}/${
            allSprints.length
          } (${percentage}%)`
        )
      }

      try {
        // Find existing Sprint
        const existingSprint = await prisma.jira_sprints.findFirst({
          where: { source_id: sprint.id.toString() },
        })

        const sprintData = {
          source_id: sprint.id.toString(),
          board_id: sprint.boardDbId,
          name: sprint.name,
          state: sprint.state,
          start_date: sprint.startDate ? new Date(sprint.startDate) : null,
          end_date: sprint.endDate ? new Date(sprint.endDate) : null,
          complete_date: sprint.completeDate
            ? new Date(sprint.completeDate)
            : null,
          row_updated_at: new Date(),
        }

        if (existingSprint) {
          // Update existing Sprint
          await prisma.jira_sprints.update({
            where: { id: existingSprint.id },
            data: sprintData,
          })
          sprintSyncResults.updated++
        } else {
          // Create new Sprint
          await prisma.jira_sprints.create({
            data: {
              ...sprintData,
              row_created_at: new Date(),
            },
          })
          sprintSyncResults.created++
        }

        // Create sprint-board relationship
        if (sprint.boardDbId) {
          const existingSprintBoard = await prisma.jira_sprint_boards.findFirst(
            {
              where: {
                sprint_id:
                  existingSprint?.id ||
                  (
                    await prisma.jira_sprints.findFirst({
                      where: { source_id: sprint.id.toString() },
                      select: { id: true },
                    })
                  )?.id,
                board_id: sprint.boardDbId,
              },
            }
          )

          if (!existingSprintBoard) {
            const sprintRecord =
              existingSprint ||
              (await prisma.jira_sprints.findFirst({
                where: { source_id: sprint.id.toString() },
                select: { id: true },
              }))

            if (sprintRecord) {
              await prisma.jira_sprint_boards.create({
                data: {
                  sprint_id: sprintRecord.id,
                  board_id: sprint.boardDbId,
                  row_created_at: new Date(),
                  row_updated_at: new Date(),
                },
              })
            }
          }
        }
      } catch (error) {
        console.error(
          `[${taskName}] Failed to sync Sprint: ${sprint.name} (${sprint.id})`,
          error instanceof Error ? error.message : String(error)
        )
        sprintSyncResults.errors++
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[${taskName}] Sprints sync completed! Created ${sprintSyncResults.created}, updated ${sprintSyncResults.updated}, errors ${sprintSyncResults.errors}, duration ${duration}ms`
    )

    return {
      taskName,
      success: true,
      duration,
      created: sprintSyncResults.created,
      updated: sprintSyncResults.updated,
      errors: sprintSyncResults.errors,
      message: `Created ${sprintSyncResults.created}, updated ${sprintSyncResults.updated}`,
      details: {
        totalBoards: allBoards.length,
        totalSprints: allSprints.length,
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
