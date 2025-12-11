"use client"

import { useState } from "react"
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertCircle,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { SyncAllResult, SyncTaskResult } from "@/service/jira-sync"

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

function TaskResultItem({ task }: { task: SyncTaskResult }) {
  return (
    <div className="rounded-lg border bg-background/50 p-4 transition-all hover:bg-background/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {task.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">{task.taskName}</span>
          <Badge variant={task.success ? "success" : "destructive"}>
            {task.success ? "Success" : "Failed"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatDuration(task.duration)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium">{task.created}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Updated:</span>
          <span className="font-medium">{task.updated}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Errors:</span>
          <span className="font-medium">{task.errors}</span>
        </div>
      </div>

      {task.message && (
        <p className="mt-2 text-sm text-muted-foreground">{task.message}</p>
      )}

      {task.details && (
        <div className="mt-2 rounded bg-muted/50 p-2 text-xs font-mono">
          {JSON.stringify(task.details, null, 2)}
        </div>
      )}
    </div>
  )
}

export default function JiraSyncPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SyncAllResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/jira-sync", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SyncAllResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const successRate = result
    ? (result.summary.successfulTasks / result.tasks.length) * 100
    : 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jira Data Sync</h1>
            <p className="text-sm text-muted-foreground">
              Synchronize users, projects, custom fields, sprints, and issues from Jira
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={isLoading}
            size="lg"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Sync
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Sync Failed</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Database className="h-16 w-16 text-muted-foreground/30" />
              <RefreshCw className="absolute -right-2 -top-2 h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="mt-4 text-lg font-medium">Syncing Jira Data...</p>
            <p className="text-sm text-muted-foreground">
              This may take several minutes depending on data volume
            </p>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Created</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{result.summary.totalCreated}</p>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Updated</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{result.summary.totalUpdated}</p>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-red-500/10 to-red-500/5 p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Errors</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{result.summary.totalErrors}</p>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-4">
                <div className="flex items-center gap-2 text-violet-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Duration</span>
                </div>
                <p className="mt-2 text-3xl font-bold">
                  {formatDuration(result.totalDuration)}
                </p>
              </div>
            </div>

            {/* Overall Status */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {result.success ? "All Tasks Completed Successfully" : "Some Tasks Failed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.summary.successfulTasks} of {result.tasks.length} tasks completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">
                    {new Date(result.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{successRate.toFixed(0)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
            </div>

            <Separator />

            {/* Task Details */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Task Details</h2>
              <div className="space-y-3">
                {result.tasks.map((task, index) => (
                  <TaskResultItem key={index} task={task} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">Ready to Sync</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Click the &quot;Start Sync&quot; button to begin synchronizing data from Jira.
              This will sync users, projects, custom fields, sprints, and issues.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

