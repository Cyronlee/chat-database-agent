import { getJiraConfig, getJiraAuthHeaders } from "@/lib/jira-config"
import { prisma } from "@/lib/prisma"
import type { SyncTaskResult } from "./types"

interface JiraField {
  id: string
  key?: string
  name: string
  custom: boolean
  clauseNames: string[]
  schema?: {
    type: string
    custom?: string
    customId?: number
    configuration?: unknown
  }
  description?: string
  searchable: boolean
  navigable: boolean
  orderable: boolean
}

/**
 * Sync Jira Custom Fields data
 * Only syncs fields with custom=true to jira_custom_fields table
 */
export async function syncCustomFields(): Promise<SyncTaskResult> {
  const startTime = Date.now()
  const taskName = "CustomFields"

  console.log(`[${taskName}] Starting Custom Fields data sync...`)

  try {
    const config = getJiraConfig()
    const headers = getJiraAuthHeaders()

    // Get all fields
    console.log(`[${taskName}] Fetching Fields data...`)

    const fieldsUrl = `${config.baseUrl}/rest/api/2/field`

    const fieldsResponse = await fetch(fieldsUrl, {
      method: "GET",
      headers,
    })

    if (!fieldsResponse.ok) {
      const errorText = await fieldsResponse.text()
      console.error(
        `[${taskName}] Failed to fetch Fields: ${fieldsResponse.status} ${fieldsResponse.statusText}`,
        errorText
      )
      return {
        taskName,
        success: false,
        duration: Date.now() - startTime,
        created: 0,
        updated: 0,
        errors: 1,
        message: `Failed to fetch Fields: ${fieldsResponse.status} ${fieldsResponse.statusText}`,
      }
    }

    const allFields: JiraField[] = await fieldsResponse.json()

    console.log(`[${taskName}] Fetched ${allFields.length} fields`)

    // Filter custom fields (custom=true)
    const customFields = allFields.filter((field) => field.custom === true)

    console.log(`[${taskName}] Filtered ${customFields.length} custom fields`)

    if (customFields.length === 0) {
      console.log(`[${taskName}] No custom fields found, sync completed`)
      return {
        taskName,
        success: true,
        duration: Date.now() - startTime,
        created: 0,
        updated: 0,
        errors: 0,
        message: "No custom fields found",
        details: {
          totalFields: allFields.length,
          customFields: 0,
        },
      }
    }

    // Sync Custom Fields to database
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
    }

    for (let i = 0; i < customFields.length; i++) {
      const field = customFields[i]

      // Output progress every 20 fields
      if (i % 20 === 0 || i === customFields.length - 1) {
        const percentage = Math.round(((i + 1) / customFields.length) * 100)
        console.log(
          `[${taskName}] Syncing Custom Field ${i + 1}/${customFields.length} (${percentage}%)`
        )
      }

      try {
        // Check if already exists
        const existingField = await prisma.jira_custom_fields.findFirst({
          where: {
            OR: [{ key: field.id }, { name: field.name }],
          },
        })

        const fieldData = {
          name: field.name,
          key: field.id,
          connection_id: null,
          row_updated_at: new Date(),
        }

        if (existingField) {
          await prisma.jira_custom_fields.update({
            where: { id: existingField.id },
            data: fieldData,
          })
          syncResults.updated++
        } else {
          await prisma.jira_custom_fields.create({
            data: {
              ...fieldData,
              row_created_at: new Date(),
            },
          })
          syncResults.created++
        }
      } catch (error) {
        console.error(
          `[${taskName}] Failed to sync Custom Field: ${field.name} (${field.id})`,
          error instanceof Error ? error.message : String(error)
        )
        syncResults.errors++
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[${taskName}] Custom Fields sync completed! Created ${syncResults.created}, updated ${syncResults.updated}, errors ${syncResults.errors}, duration ${duration}ms`
    )

    return {
      taskName,
      success: true,
      duration,
      created: syncResults.created,
      updated: syncResults.updated,
      errors: syncResults.errors,
      message: `Created ${syncResults.created}, updated ${syncResults.updated}`,
      details: {
        totalFields: allFields.length,
        customFields: customFields.length,
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
