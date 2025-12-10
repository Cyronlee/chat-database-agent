/**
 * Jira API global configuration
 */
export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}

/**
 * Get Jira configuration
 */
export function getJiraConfig(): JiraConfig {
  const baseUrl =
    process.env.JIRA_BASE_URL || "https://thoughtworks.atlassian.net"
  const email = process.env.JIRA_EMAIL
  const apiToken = process.env.JIRA_API_TOKEN

  if (!email) {
    throw new Error("JIRA_EMAIL environment variable is required")
  }

  if (!apiToken) {
    throw new Error("JIRA_API_TOKEN environment variable is required")
  }

  return {
    baseUrl,
    email,
    apiToken,
  }
}

/**
 * Generate Jira API authentication headers
 */
export function getJiraAuthHeaders(): Record<string, string> {
  const config = getJiraConfig()
  const credentials = Buffer.from(
    `${config.email}:${config.apiToken}`
  ).toString("base64")

  return {
    Authorization: `Basic ${credentials}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

/**
 * Jira User interface
 */
export interface JiraUser {
  accountId: string
  accountType: string
  active: boolean
  avatarUrls: {
    "16x16": string
    "24x24": string
    "32x32": string
    "48x48": string
  }
  displayName: string
  emailAddress?: string // User email address
  key: string
  name: string
  self: string
}

/**
 * Jira Issue interface
 */
export interface JiraIssue {
  id: string
  key: string
  self: string
  changelog?: {
    startAt: number
    maxResults: number
    total: number
    histories: Array<{
      id: string
      author: {
        accountId: string
        displayName: string
        emailAddress?: string
      }
      created: string
      items: Array<{
        field: string
        fieldtype: string
        fieldId: string
        from?: string
        fromString?: string
        to?: string
        toString?: string
      }>
    }>
  }
  fields: {
    summary: string
    description?: string
    issuetype: {
      id: string
      name: string
      description?: string
      iconUrl?: string
      hierarchyLevel?: number
    }
    project: {
      id: string
      key: string
      name: string
    }
    status: {
      id: string
      name: string
      description?: string
      statusCategory?: {
        id: string
        name: string
        key: string
      }
    }
    priority?: {
      id: string
      name: string
      description?: string
    }
    resolution?: {
      id: string
      name: string
      description?: string
    }
    assignee?: {
      accountId: string
      displayName: string
      emailAddress?: string
    }
    creator: {
      accountId: string
      displayName: string
      emailAddress?: string
    }
    created: string // ISO 8601 format
    updated: string // ISO 8601 format
    resolutiondate?: string // ISO 8601 format
    duedate?: string // ISO 8601 format
    parent?: {
      key: string
    }
    customfield_10036?: number // Story Points
    customfield_10016?: number // Story Points estimate
    customfield_10020?: Array<string | { id: number | string }> // Sprint field
    labels?: string[]
    [key: string]: unknown // Allow dynamic custom fields
  }
}

/**
 * Jira Search Response interface
 */
export interface JiraIssueSearchResponse {
  issues: JiraIssue[]
  nextPageToken?: string
  isLast: boolean
}
