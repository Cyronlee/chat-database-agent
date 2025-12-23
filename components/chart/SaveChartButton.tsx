"use client"

import { useState } from "react"
import { SaveIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createCustomChart } from "@/api-clients/custom-charts"
import type { CustomChartConfig } from "@/components/chart/types"

interface SaveChartButtonProps {
  sql: string
  chartConfig: CustomChartConfig
  disabled?: boolean
}

export function SaveChartButton({
  sql,
  chartConfig,
  disabled = false,
}: SaveChartButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [chartName, setChartName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!chartName.trim() || !sql.trim() || !chartConfig) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await createCustomChart(
        chartName.trim(),
        sql.trim(),
        chartConfig
      )
      if (result.error) {
        setError(result.error)
      } else {
        setIsDialogOpen(false)
        setChartName("")
        setError(null)
      }
    } catch (err) {
      setError("Failed to save chart")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenDialog = () => {
    setChartName("")
    setError(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setChartName("")
    setError(null)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleOpenDialog}
        className="size-7"
        title="Save Custom Chart"
        disabled={disabled}
      >
        <SaveIcon className="size-3.5" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Chart</DialogTitle>
            <DialogDescription>
              Enter a name for your custom chart. The current SQL query and
              chart configuration will be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="Enter custom chart name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && chartName.trim()) {
                  handleSave()
                }
              }}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!chartName.trim() || isSaving}
            >
              {isSaving ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
