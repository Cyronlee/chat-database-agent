"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2Icon, LayoutDashboardIcon } from "lucide-react"
import type { CustomChart } from "@/api-clients/custom-charts"
import type { DashboardChartItem } from "@/api-clients/dashboards"
import { useChartConfigState } from "./useChartConfigState"
import { ChartConfigList } from "./ChartConfigList"

// Stable default values to prevent infinite re-renders
const DEFAULT_CHART_ITEMS: DashboardChartItem[] = []

interface DashboardChartConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  charts: CustomChart[]
  initialName?: string
  initialChartItems?: DashboardChartItem[]
  onSave: (name: string, chartItems: DashboardChartItem[]) => Promise<void>
  title?: string
}

export function DashboardChartConfigDialog({
  open,
  onOpenChange,
  charts,
  initialName = "",
  initialChartItems = DEFAULT_CHART_ITEMS,
  onSave,
  title = "Create Dashboard",
}: DashboardChartConfigDialogProps) {
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Use the custom hook for chart config state management
  const {
    items,
    resetState,
    toggleSelection,
    setWidth,
    reorderItems,
    getSelectedItems,
  } = useChartConfigState({
    charts,
    initialChartItems,
  })

  // Track if dialog was previously open to detect open transitions
  const wasOpenRef = useRef(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setName(initialName)
      resetState(charts, initialChartItems)
    }
    wasOpenRef.current = open
  }, [open, initialName, charts, initialChartItems, resetState])

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      const selectedItems = getSelectedItems()
      await onSave(name.trim(), selectedItems)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboardIcon className="size-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 py-4 gap-4">
          <div className="space-y-2 shrink-0">
            <Label htmlFor="dashboard-name">Dashboard Name</Label>
            <Input
              id="dashboard-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter dashboard name"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="shrink-0">
              <Label>Charts</Label>
              <p className="text-xs text-muted-foreground">
                Select and reorder charts. Use the width buttons to set half or
                full width.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <ChartConfigList
                items={items}
                onItemsReorder={reorderItems}
                onToggle={toggleSelection}
                onWidthChange={setWidth}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || charts.length === 0}
          >
            {isSaving && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
