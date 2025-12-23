"use client"

import { Sortable } from "@/components/ui/sortable"
import { BarChart3Icon } from "lucide-react"
import type { ChartWidth } from "@/api-clients/dashboards"
import type { ChartConfigItem as ChartConfigItemType } from "./useChartConfigState"
import { ChartConfigItem } from "./ChartConfigItem"

interface ChartConfigListProps {
  items: ChartConfigItemType[]
  onItemsReorder: (items: ChartConfigItemType[]) => void
  onToggle: (chartId: string) => void
  onWidthChange: (chartId: string, width: ChartWidth) => void
}

export function ChartConfigList({
  items,
  onItemsReorder,
  onToggle,
  onWidthChange,
}: ChartConfigListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <BarChart3Icon className="mb-2 size-8 opacity-50" />
        <p className="text-sm">No charts available</p>
        <p className="text-xs">Create charts in Data Studio to add them here</p>
      </div>
    )
  }

  return (
    <Sortable
      value={items}
      onValueChange={onItemsReorder}
      getItemValue={(item) => item.chartId}
      strategy="vertical"
      className="space-y-2 overflow-y-auto"
    >
      {items.map((item) => (
        <ChartConfigItem
          key={item.chartId}
          item={item}
          onToggle={onToggle}
          onWidthChange={onWidthChange}
        />
      ))}
    </Sortable>
  )
}
