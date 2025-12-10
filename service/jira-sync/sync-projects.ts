import { getJiraConfig, getJiraAuthHeaders } from "@/lib/jira-config"
import { prisma } from "@/lib/prisma"
import type { SyncTaskResult } from "./types"

interface JiraProject {
  id: string
  key: string
  name: string
  style: string
  simplified: boolean
  insight?: {
    totalIssueCount: number
    lastIssueUpdateTime: string
  }
  projectCategory?: {
    id: string
    name: string
    description: string
  }
  avatarUrls: {
    "16x16": string
    "24x24": string
    "32x32": string
    "48x48": string
  }
}

interface JiraBoard {
  id: number
  name: string
  type: string
  self: string
  location?: {
    projectId: number
    projectKey: string
    projectName: string
  }
  projectId?: string
  projectKey?: string
  projectName?: string
}

/**
 * Sync Jira Projects and related Boards data
 * Only syncs projects with categoryId=10003
 */
export async function syncProjects(): Promise<SyncTaskResult> {
  const startTime = Date.now()
  const taskName = "Projects"

  console.log(`[${taskName}] Starting Projects data sync...`)

  try {
    const config = getJiraConfig()
    const headers = getJiraAuthHeaders()

    // Get projects with categoryId=10003
    const allProjects: JiraProject[] = []
    let startAt = 0
    const maxResults = 1000
    let hasMoreProjects = true

    console.log(`[${taskName}] Fetching Projects data (categoryId=10003)...`)

    while (hasMoreProjects) {
      const projectsUrl = new URL(
        `${config.baseUrl}/rest/api/2/project/search`
      )
      projectsUrl.searchParams.set("categoryId", "10003")
      projectsUrl.searchParams.set("startAt", startAt.toString())
      projectsUrl.searchParams.set("maxResults", maxResults.toString())

      const projectsResponse = await fetch(projectsUrl.toString(), {
        method: "GET",
        headers,
      })

      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text()
        console.error(
          `[${taskName}] Failed to fetch Projects: ${projectsResponse.status} ${projectsResponse.statusText}`,
          errorText
        )
        return {
          taskName,
          success: false,
          duration: Date.now() - startTime,
          created: 0,
          updated: 0,
          errors: 1,
          message: `Failed to fetch Projects: ${projectsResponse.status} ${projectsResponse.statusText}`,
        }
      }

      const projectsResult = await projectsResponse.json()

      console.log(
        `[${taskName}] Fetched ${projectsResult.values.length} Projects, total: ${projectsResult.total}`
      )

      if (projectsResult.values.length === 0) {
        hasMoreProjects = false
      } else {
        allProjects.push(...projectsResult.values)
        startAt += maxResults

        if (projectsResult.isLast || startAt >= projectsResult.total) {
          hasMoreProjects = false
        }
      }
    }

    console.log(`[${taskName}] Total ${allProjects.length} Projects fetched`)

    // Sync Projects to database
    const projectSyncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    }

    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i]

      // Output progress every 10 Projects
      if (i % 10 === 0 || i === allProjects.length - 1) {
        const percentage = Math.round(((i + 1) / allProjects.length) * 100)
        console.log(
          `[${taskName}] Syncing Project ${i + 1}/${allProjects.length} (${percentage}%)`
        )
      }

      try {
        const existingProject = await prisma.jira_projects.findFirst({
          where: { source_id: project.id },
        })

        const projectData = {
          source_id: project.id,
          name: project.name,
          key: project.key,
          project_type_key: project.style,
          private: false,
          total_issue_count: project.insight?.totalIssueCount || null,
          last_issue_update_time: project.insight?.lastIssueUpdateTime
            ? new Date(project.insight.lastIssueUpdateTime)
            : null,
          api_accessible: true,
          allowlisted: true,
          row_updated_at: new Date(),
        }

        if (existingProject) {
          await prisma.jira_projects.update({
            where: { id: existingProject.id },
            data: projectData,
          })
          projectSyncResults.updated++
        } else {
          await prisma.jira_projects.create({
            data: {
              ...projectData,
              row_created_at: new Date(),
            },
          })
          projectSyncResults.created++
        }
      } catch (error) {
        console.error(
          `[${taskName}] Failed to sync Project: ${project.name} (${project.id})`,
          error instanceof Error ? error.message : String(error)
        )
        projectSyncResults.errors++
      }
    }

    console.log(
      `[${taskName}] Projects sync completed: Created ${projectSyncResults.created}, updated ${projectSyncResults.updated}, errors ${projectSyncResults.errors}`
    )

    // Get boards related to these projects
    console.log(`[${taskName}] Starting to fetch Boards data for Projects...`)

    const allBoards: JiraBoard[] = []

    for (
      let projectIndex = 0;
      projectIndex < allProjects.length;
      projectIndex++
    ) {
      const project = allProjects[projectIndex]

      try {
        let boardStartAt = 0
        const boardMaxResults = 1000
        let hasMoreBoards = true

        while (hasMoreBoards) {
          const boardsUrl = new URL(`${config.baseUrl}/rest/agile/1.0/board`)
          boardsUrl.searchParams.set("startAt", boardStartAt.toString())
          boardsUrl.searchParams.set("maxResults", boardMaxResults.toString())
          boardsUrl.searchParams.set("projectKeyOrId", project.key)

          const boardsResponse = await fetch(boardsUrl.toString(), {
            method: "GET",
            headers,
          })

          if (!boardsResponse.ok) {
            const errorText = await boardsResponse.text()
            console.error(
              `[${taskName}] Failed to fetch Boards for Project ${project.key}: ${boardsResponse.status}`,
              errorText
            )
            break
          }

          const boardsResult = await boardsResponse.json()

          if (boardsResult.values.length === 0) {
            hasMoreBoards = false
          } else {
            const boardsWithProject = boardsResult.values.map(
              (board: JiraBoard) => ({
                ...board,
                projectId: project.id,
                projectKey: project.key,
                projectName: project.name,
              })
            )

            allBoards.push(...boardsWithProject)
            boardStartAt += boardMaxResults

            if (
              boardsResult.values.length < boardMaxResults ||
              boardsResult.isLast ||
              boardStartAt >= boardsResult.total
            ) {
              hasMoreBoards = false
            }
          }
        }
      } catch (error) {
        console.error(
          `[${taskName}] Error processing Project ${project.key}`,
          error instanceof Error ? error.message : String(error)
        )
      }

      // Show overall progress
      if (projectIndex % 10 === 0 || projectIndex === allProjects.length - 1) {
        const projectProgress = Math.round(
          ((projectIndex + 1) / allProjects.length) * 100
        )
        console.log(
          `[${taskName}] Project processing progress: ${projectIndex + 1}/${allProjects.length} (${projectProgress}%)`
        )
      }
    }

    console.log(`[${taskName}] Total ${allBoards.length} related Boards fetched`)

    // Sync Boards to database
    const boardSyncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    }

    for (let i = 0; i < allBoards.length; i++) {
      const board = allBoards[i]

      // Output progress every 10 Boards
      if (i % 10 === 0 || i === allBoards.length - 1) {
        const percentage = Math.round(((i + 1) / allBoards.length) * 100)
        console.log(
          `[${taskName}] Syncing Board ${i + 1}/${allBoards.length} (${percentage}%)`
        )
      }

      try {
        const existingBoard = await prisma.jira_boards.findFirst({
          where: { source_id: board.id.toString() },
        })

        const boardData = {
          source_id: board.id.toString(),
          name: board.name,
          board_type: board.type,
          api_accessible: true,
          supports_sprints: board.type === "scrum",
          row_updated_at: new Date(),
        }

        if (existingBoard) {
          await prisma.jira_boards.update({
            where: { id: existingBoard.id },
            data: boardData,
          })
          boardSyncResults.updated++
        } else {
          await prisma.jira_boards.create({
            data: {
              ...boardData,
              row_created_at: new Date(),
            },
          })
          boardSyncResults.created++
        }
      } catch (error) {
        console.error(
          `[${taskName}] Failed to sync Board: ${board.name} (${board.id})`,
          error instanceof Error ? error.message : String(error)
        )
        boardSyncResults.errors++
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[${taskName}] Projects and Boards sync completed! Duration ${duration}ms`
    )

    return {
      taskName,
      success: true,
      duration,
      created: projectSyncResults.created + boardSyncResults.created,
      updated: projectSyncResults.updated + boardSyncResults.updated,
      errors: projectSyncResults.errors + boardSyncResults.errors,
      message: `Projects: Created ${projectSyncResults.created}, updated ${projectSyncResults.updated}; Boards: Created ${boardSyncResults.created}, updated ${boardSyncResults.updated}`,
      details: {
        totalProjects: allProjects.length,
        totalBoards: allBoards.length,
        projectResults: projectSyncResults,
        boardResults: boardSyncResults,
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
