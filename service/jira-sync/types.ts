/**
 * Sync task result interface
 */
export interface SyncTaskResult {
  taskName: string
  success: boolean
  duration: number // milliseconds
  created: number
  updated: number
  errors: number
  message: string
  details?: Record<string, unknown>
}

/**
 * Overall sync result interface
 */
export interface SyncAllResult {
  success: boolean
  totalDuration: number
  startedAt: string
  completedAt: string
  tasks: SyncTaskResult[]
  summary: {
    totalCreated: number
    totalUpdated: number
    totalErrors: number
    successfulTasks: number
    failedTasks: number
  }
}
