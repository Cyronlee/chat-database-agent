"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, BarChart3, Trash2, User, Clock } from "lucide-react"
import { getCustomCharts, deleteCustomChart } from "@/api-clients/custom-charts"
import type { CustomChart } from "@/api-clients/custom-charts"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CustomChartsPage() {
  const router = useRouter()
  const [charts, setCharts] = useState<CustomChart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomChart | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const chartsResult = await getCustomCharts()

        if (chartsResult.error) {
          setError(chartsResult.error)
        } else {
          setCharts(chartsResult.charts)
        }
      } catch (err) {
        setError("Failed to fetch charts")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString()
  }

  const handleChartClick = (chart: CustomChart) => {
    router.push(`/data-studio?chartId=${chart.id}`)
  }

  const handleDeleteClick = (e: React.MouseEvent, chart: CustomChart) => {
    e.stopPropagation()
    setDeleteTarget(chart)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deleteCustomChart(deleteTarget.id)
      if (result.error) {
        setError(result.error)
      } else {
        setCharts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      }
    } catch (err) {
      setError("Failed to delete chart")
      console.error(err)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Custom Charts</h1>
      </div>

      {charts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No custom charts yet. Go to Data Studio to create one.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            {charts.map((chart) => (
              <div
                key={chart.id}
                onClick={() => handleChartClick(chart)}
                className="group relative flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{chart.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {chart.creator?.name ?? "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(chart.updatedAt)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDeleteClick(e, chart)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
