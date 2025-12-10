import {
  getJiraConfig,
  getJiraAuthHeaders,
} from "@/lib/jira-config"
import type { JiraIssueSearchResponse, JiraIssue } from "@/lib/jira-config"
import { prisma } from "@/lib/prisma"
import type { SyncTaskResult } from "./types"

const targetProjectIds = ["GGQPA", "GGAHTP"]

/**
 * Sync Jira Issues data
 * Gets all projects from jira_projects table and syncs Issues for each project
 */
export async function syncIssues(): Promise<SyncTaskResult> {
  const startTime = Date.now()
  const taskName = "Issues"

  console.log(`[${taskName}] Starting Issues data sync...`)

  try {
    const config = getJiraConfig()
    const headers = getJiraAuthHeaders()

    // Preload custom fields data cache
    console.log(`[${taskName}] Preloading custom fields data...`)
    const customFields = await prisma.jira_custom_fields.findMany({
      select: { id: true, key: true, name: true },
    })
    const customFieldsMap = new Map(
      customFields
        .filter((field) => field.key !== null)
        .map((field) => [field.key!, field])
    )
    console.log(`[${taskName}] Cached ${customFields.length} custom fields`)

    // Preload status data cache
    console.log(`[${taskName}] Preloading status data...`)
    const statuses = await prisma.jira_statuses.findMany({
      select: { id: true, source_id: true, name: true },
    })
    const statusesMap = new Map(
      statuses
        .filter((status) => status.source_id !== null)
        .map((status) => [status.source_id!, status])
    )
    console.log(`[${taskName}] Cached ${statuses.length} statuses`)

    // Get all projects from database
    const projects = await prisma.jira_projects
      .findMany({
        select: { id: true, key: true, name: true, source_id: true },
      })
      .then((projects) =>
        projects.filter(
          (project) => project.key && targetProjectIds.includes(project.key)
        )
      )

    if (projects.length === 0) {
      console.error(`[${taskName}] No projects found in database, please sync project data first`)
      return {
        taskName,
        success: false,
        duration: Date.now() - startTime,
        created: 0,
        updated: 0,
        errors: 1,
        message: "No projects found in database, please sync project data first",
      }
    }

    console.log(`[${taskName}] Found ${projects.length} projects, starting to sync Issues for each`)

    // Global sync results statistics
    const globalSyncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      totalIssues: 0,
    }

    // Sync Issues for each project
    for (let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
      const project = projects[projectIndex]

      console.log(
        `[${taskName}] [${projectIndex + 1}/${projects.length}] Starting to sync project: ${project.name} (${project.key})`
      )

      // Build JQL query for current project
      const jql = `project=${project.key}`

      // Paginate to get all Issues for current project
      const projectJiraIssues: JiraIssue[] = []
      const maxResults = 100
      let nextPageToken: string | undefined = undefined
      let hasMoreData = true

      while (hasMoreData) {
        const searchUrl = new URL(`${config.baseUrl}/rest/api/2/search/jql`)
        searchUrl.searchParams.set("jql", jql)
        searchUrl.searchParams.set("maxResults", maxResults.toString())
        if (nextPageToken) {
          searchUrl.searchParams.set("nextPageToken", nextPageToken)
        }
        searchUrl.searchParams.set("expand", "changelog")
        searchUrl.searchParams.set("fields", "*all")

        const jiraResponse = await fetch(searchUrl.toString(), {
          method: "GET",
          headers,
        })

        if (!jiraResponse.ok) {
          const errorText = await jiraResponse.text()
          console.error(
            `[${taskName}] Project ${project.key} Jira API error: ${jiraResponse.status} ${jiraResponse.statusText}`,
            errorText
          )
          break
        }

        const searchResult: JiraIssueSearchResponse = await jiraResponse.json()

        console.log(
          `[${taskName}] Project ${project.key} fetched ${searchResult.issues.length} Issues, isLast: ${searchResult.isLast}`
        )

        if (searchResult.issues.length === 0) {
          hasMoreData = false
        } else {
          projectJiraIssues.push(...searchResult.issues)

          if (searchResult.isLast) {
            hasMoreData = false
            nextPageToken = undefined
          } else if (searchResult.nextPageToken) {
            nextPageToken = searchResult.nextPageToken
          } else {
            hasMoreData = false
          }
        }
      }

      console.log(
        `[${taskName}] Project ${project.key} total ${projectJiraIssues.length} Issues fetched, starting database sync...`
      )

      // Sync current project's Issues to database
      const projectSyncResults = {
        created: 0,
        updated: 0,
        errors: 0,
      }

      for (let i = 0; i < projectJiraIssues.length; i++) {
        const jiraIssue = projectJiraIssues[i]

        // Output progress every 50 Issues
        if (i % 50 === 0 || i === projectJiraIssues.length - 1) {
          const percentage = Math.round(
            ((i + 1) / projectJiraIssues.length) * 100
          )
          console.log(
            `[${taskName}] Project ${project.key}: Syncing Issue ${i + 1}/${projectJiraIssues.length} (${percentage}%)`
          )
        }

        try {
          // Find existing Issue
          const existingIssue = await prisma.jira_issues.findFirst({
            where: { source_id: jiraIssue.id },
          })

          // Extract started_at and completed_at from changelog
          const { startedAt, completedAt } = extractStartedAndCompletedDates(
            jiraIssue.changelog
          )

          // Find or create related foreign key data
          const [
            projectData,
            issueType,
            status,
            priority,
            resolution,
            assignee,
            creator,
          ] = await Promise.all([
            findOrCreateProject(jiraIssue.fields.project),
            findOrCreateIssueType(
              jiraIssue.fields.issuetype,
              jiraIssue.fields.project.id
            ),
            findOrCreateStatus(jiraIssue.fields.status),
            jiraIssue.fields.priority
              ? findOrCreatePriority(jiraIssue.fields.priority)
              : null,
            jiraIssue.fields.resolution
              ? findOrCreateResolution(jiraIssue.fields.resolution)
              : null,
            jiraIssue.fields.assignee
              ? findUserByAccountId(jiraIssue.fields.assignee.accountId)
              : null,
            findUserByAccountId(jiraIssue.fields.creator.accountId),
          ])

          const issueData = {
            source_id: jiraIssue.id,
            key: jiraIssue.key,
            summary: jiraIssue.fields.summary,
            source_url: jiraIssue.self,
            project_id: projectData?.id || null,
            issue_type_id: issueType?.id || null,
            status_id: status?.id || null,
            priority_id: priority?.id || null,
            resolution_id: resolution?.id || null,
            user_id: assignee?.id || null,
            creator_id: creator?.id || null,
            parent_key: jiraIssue.fields.parent?.key || null,
            story_points:
              jiraIssue.fields.customfield_10036 ||
              jiraIssue.fields.customfield_10016 ||
              null,
            created_at: new Date(jiraIssue.fields.created),
            updated_at: new Date(jiraIssue.fields.updated),
            resolution_date: jiraIssue.fields.resolutiondate
              ? new Date(jiraIssue.fields.resolutiondate)
              : null,
            due_date: jiraIssue.fields.duedate
              ? new Date(jiraIssue.fields.duedate)
              : null,
            started_at: startedAt,
            completed_at: completedAt,
            synced_at: new Date(),
            row_updated_at: new Date(),
          }

          if (existingIssue) {
            await prisma.jira_issues.update({
              where: { id: existingIssue.id },
              data: issueData,
            })
            projectSyncResults.updated++
          } else {
            await prisma.jira_issues.create({
              data: {
                ...issueData,
                row_created_at: new Date(),
              },
            })
            projectSyncResults.created++
          }

          // Sync labels
          if (jiraIssue.fields.labels && jiraIssue.fields.labels.length > 0) {
            await syncIssueLabels(
              existingIssue?.id ||
                (await prisma.jira_issues.findFirst({
                  where: { source_id: jiraIssue.id },
                  select: { id: true },
                }))!.id,
              jiraIssue.fields.labels
            )
          }

          // Sync sprint relationship
          const issueRecord =
            existingIssue ||
            (await prisma.jira_issues.findFirst({
              where: { source_id: jiraIssue.id },
              select: { id: true },
            }))

          if (issueRecord && jiraIssue.fields.customfield_10020) {
            await syncIssueSprints(
              issueRecord.id,
              jiraIssue.fields.customfield_10020,
              jiraIssue.fields.customfield_10036 ||
                jiraIssue.fields.customfield_10016 ||
                null,
              projectData?.id || null
            )
          }

          // Sync custom field values
          if (issueRecord) {
            await syncIssueCustomFieldValues(
              issueRecord.id,
              jiraIssue.fields,
              customFieldsMap
            )
          }

          // Sync status change history
          if (issueRecord && jiraIssue.changelog) {
            await syncIssueStatusChanges(
              issueRecord.id,
              jiraIssue.changelog,
              statusesMap
            )
          }
        } catch (error) {
          console.error(
            `[${taskName}] Failed to sync Issue: ${jiraIssue.key} (${jiraIssue.id})`,
            error instanceof Error ? error.message : String(error)
          )
          projectSyncResults.errors++
        }
      }

      // Update global statistics
      globalSyncResults.created += projectSyncResults.created
      globalSyncResults.updated += projectSyncResults.updated
      globalSyncResults.errors += projectSyncResults.errors
      globalSyncResults.totalIssues += projectJiraIssues.length

      console.log(
        `[${taskName}] Project ${project.key} (${project.name}) sync completed! Created ${projectSyncResults.created}, updated ${projectSyncResults.updated}, errors ${projectSyncResults.errors}`
      )
    }

    const duration = Date.now() - startTime
    console.log(
      `[${taskName}] All projects Issues sync completed! Synced ${projects.length} projects, created ${globalSyncResults.created}, updated ${globalSyncResults.updated}, errors ${globalSyncResults.errors}, duration ${duration}ms`
    )

    return {
      taskName,
      success: true,
      duration,
      created: globalSyncResults.created,
      updated: globalSyncResults.updated,
      errors: globalSyncResults.errors,
      message: `Synced ${projects.length} projects, created ${globalSyncResults.created}, updated ${globalSyncResults.updated}`,
      details: {
        totalProjects: projects.length,
        totalIssues: globalSyncResults.totalIssues,
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

// Helper function: Extract started_at and completed_at dates from changelog
function extractStartedAndCompletedDates(changelog: JiraIssue["changelog"]): {
  startedAt: Date | null
  completedAt: Date | null
} {
  let startedAt: Date | null = null
  let completedAt: Date | null = null

  if (
    !changelog ||
    !changelog.histories ||
    !Array.isArray(changelog.histories)
  ) {
    return { startedAt, completedAt }
  }

  for (const history of changelog.histories) {
    if (!history.items || !Array.isArray(history.items) || !history.created) {
      continue
    }

    for (const item of history.items) {
      if (item.field === "status" && item.toString) {
        const changeDate = new Date(history.created)

        if (item.toString === "In Progress" && !startedAt) {
          startedAt = changeDate
        }

        if (item.toString === "Done") {
          completedAt = changeDate
        }
      }
    }
  }

  return { startedAt, completedAt }
}

// Helper function: Find or create Project
async function findOrCreateProject(projectData: {
  id: string
  key: string
  name: string
}) {
  let project = await prisma.jira_projects.findFirst({
    where: { source_id: projectData.id },
  })

  if (!project) {
    project = await prisma.jira_projects.create({
      data: {
        source_id: projectData.id,
        key: projectData.key,
        name: projectData.name,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }

  return project
}

// Helper function: Find or create Issue Type
async function findOrCreateIssueType(
  issueTypeData: {
    id: string
    name: string
    description?: string
    hierarchyLevel?: number
  },
  projectId: string
) {
  let issueType = await prisma.jira_issue_types.findFirst({
    where: { source_id: issueTypeData.id },
  })

  if (!issueType) {
    const project = await prisma.jira_projects.findFirst({
      where: { source_id: projectId },
      select: { id: true },
    })

    issueType = await prisma.jira_issue_types.create({
      data: {
        source_id: issueTypeData.id,
        name: issueTypeData.name,
        description: issueTypeData.description || null,
        hierarchy_level: issueTypeData.hierarchyLevel || null,
        project_id: project?.id || null,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }

  return issueType
}

// Helper function: Find or create Status
async function findOrCreateStatus(statusData: {
  id: string
  name: string
  description?: string
  statusCategory?: { name: string }
}) {
  let status = await prisma.jira_statuses.findFirst({
    where: { source_id: statusData.id },
  })

  if (!status) {
    status = await prisma.jira_statuses.create({
      data: {
        source_id: statusData.id,
        name: statusData.name,
        description: statusData.description || null,
        status_category: statusData.statusCategory?.name || null,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }

  return status
}

// Helper function: Find or create Priority
async function findOrCreatePriority(priorityData: {
  id: string
  name: string
  description?: string
}) {
  let priority = await prisma.jira_priorities.findFirst({
    where: { source_id: priorityData.id },
  })

  if (!priority) {
    priority = await prisma.jira_priorities.create({
      data: {
        source_id: priorityData.id,
        name: priorityData.name,
        description: priorityData.description || null,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }

  return priority
}

// Helper function: Find or create Resolution
async function findOrCreateResolution(resolutionData: {
  id: string
  name: string
  description?: string
}) {
  let resolution = await prisma.jira_resolutions.findFirst({
    where: { source_id: resolutionData.id },
  })

  if (!resolution) {
    resolution = await prisma.jira_resolutions.create({
      data: {
        source_id: resolutionData.id,
        name: resolutionData.name,
        description: resolutionData.description || null,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }

  return resolution
}

// Helper function: Find user by accountId
async function findUserByAccountId(accountId: string) {
  return await prisma.jira_users.findFirst({
    where: { account_id: accountId },
  })
}

// Helper function: Sync Issue Labels
async function syncIssueLabels(issueId: bigint, labels: string[]) {
  await prisma.jira_issue_labels.deleteMany({
    where: { issue_id: issueId },
  })

  for (const labelName of labels) {
    let label = await prisma.jira_labels.findFirst({
      where: { name: labelName },
    })

    if (!label) {
      label = await prisma.jira_labels.create({
        data: {
          name: labelName,
          row_created_at: new Date(),
          row_updated_at: new Date(),
        },
      })
    }

    await prisma.jira_issue_labels.create({
      data: {
        issue_id: issueId,
        label_id: label.id,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })
  }
}

// Helper function: Sync Issue-Sprint relationship
async function syncIssueSprints(
  issueId: bigint,
  sprintField: Array<string | { id: number | string }>,
  storyPoints: number | null,
  projectId: bigint | null
): Promise<void> {
  if (!sprintField || !Array.isArray(sprintField) || sprintField.length === 0) {
    return
  }

  await prisma.jira_issue_sprints.deleteMany({
    where: { issue_id: issueId },
  })

  for (const sprintInfo of sprintField) {
    let sprintId: string | null = null

    if (typeof sprintInfo === "string") {
      const idMatch = sprintInfo.match(/id=(\d+)/)
      if (idMatch) {
        sprintId = idMatch[1]
      }
    } else if (typeof sprintInfo === "object" && sprintInfo.id) {
      sprintId = sprintInfo.id.toString()
    }

    if (!sprintId) {
      continue
    }

    const sprint = await prisma.jira_sprints.findFirst({
      where: { source_id: sprintId },
    })

    if (!sprint) {
      continue
    }

    await prisma.jira_issue_sprints.create({
      data: {
        issue_id: issueId,
        sprint_id: sprint.id,
        project_id: projectId,
        planned: true,
        planned_points: storyPoints,
        row_created_at: new Date(),
        row_updated_at: new Date(),
      },
    })

    const existingPlannedIssue =
      await prisma.jira_sprints_planned_issues.findFirst({
        where: {
          sprint_id: sprint.id,
          issue_id: issueId,
        },
      })

    if (!existingPlannedIssue) {
      await prisma.jira_sprints_planned_issues.create({
        data: {
          sprint_id: sprint.id,
          issue_id: issueId,
          row_created_at: new Date(),
          row_updated_at: new Date(),
        },
      })
    }
  }
}

// Helper function: Sync Issue custom field values
async function syncIssueCustomFieldValues(
  issueId: bigint,
  fields: JiraIssue["fields"],
  customFieldsMap: Map<
    string,
    { id: bigint; key: string | null; name: string | null }
  >
): Promise<void> {
  await prisma.jira_issue_custom_field_values.deleteMany({
    where: { issue_id: issueId },
  })

  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (fieldKey.startsWith("customfield_") && fieldValue !== null) {
      const customField = customFieldsMap.get(fieldKey)
      if (customField) {
        let valueString: string

        if (typeof fieldValue === "object") {
          valueString = JSON.stringify(fieldValue)
        } else {
          valueString = String(fieldValue)
        }

        await prisma.jira_issue_custom_field_values.create({
          data: {
            issue_id: issueId,
            custom_field_id: customField.id,
            value: valueString,
            row_created_at: new Date(),
            row_updated_at: new Date(),
          },
        })
      }
    }
  }
}

// Helper function: Sync Issue status change history
async function syncIssueStatusChanges(
  issueId: bigint,
  changelog: JiraIssue["changelog"],
  statusesMap: Map<
    string,
    { id: bigint; source_id: string | null; name: string | null }
  >
): Promise<void> {
  await prisma.jira_issue_status_changes.deleteMany({
    where: { issue_id: issueId },
  })

  if (
    !changelog ||
    !changelog.histories ||
    !Array.isArray(changelog.histories)
  ) {
    return
  }

  for (const history of changelog.histories) {
    if (!history.items || !Array.isArray(history.items)) {
      continue
    }

    for (const item of history.items) {
      if (item.field === "status" && item.to) {
        const status = statusesMap.get(item.to)
        if (status) {
          await prisma.jira_issue_status_changes.create({
            data: {
              issue_id: issueId,
              status_id: status.id,
              status_change_date: new Date(history.created),
              row_created_at: new Date(),
              row_updated_at: new Date(),
            },
          })
        }
      }
    }
  }
}
