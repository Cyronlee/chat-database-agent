"use client"

import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch, SwitchIndicator, SwitchWrapper } from "@/components/ui/switch"
import { SortableItem, SortableItemHandle } from "@/components/ui/sortable"
import { GripVerticalIcon, BarChart3Icon } from "lucide-react"
import type { ChartWidth } from "@/api-clients/dashboards"
import type { ChartConfigItem as ChartConfigItemType } from "./useChartConfigState"

interface ChartConfigItemProps {
  item: ChartConfigItemType
  onToggle: (chartId: string) => void
  onWidthChange: (chartId: string, width: ChartWidth) => void
}

export function ChartConfigItem({
  item,
  onToggle,
  onWidthChange,
}: ChartConfigItemProps) {
  const switchId = useId()

  return (
    <SortableItem
      value={item.chartId}
      className={`flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors ${
        item.selected ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <SortableItemHandle className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVerticalIcon className="size-4" />
      </SortableItemHandle>
      <Checkbox
        id={`chart-${item.chartId}`}
        checked={item.selected}
        onCheckedChange={() => onToggle(item.chartId)}
      />
      <label
        htmlFor={`chart-${item.chartId}`}
        className="flex flex-1 cursor-pointer items-center gap-2 min-w-0"
      >
        <BarChart3Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{item.chart.name}</span>
      </label>
      {item.selected && (
        <SwitchWrapper
          permanent
          className="inline-grid shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            id={switchId}
            size="sm"
            className="w-20 rounded-md"
            thumbClassName="rounded-sm"
            checked={item.width === "full"}
            onCheckedChange={(checked) => {
              onWidthChange(item.chartId, checked ? "full" : "half")
            }}
          />
          <SwitchIndicator
            state="off"
            className="w-1/2 text-xs text-muted-foreground peer-data-[state=checked]:text-foreground"
          >
            Full
          </SwitchIndicator>
          <SwitchIndicator
            state="on"
            className="w-1/2 text-xs text-muted-foreground peer-data-[state=unchecked]:text-foreground"
          >
            Half
          </SwitchIndicator>
        </SwitchWrapper>
      )}
    </SortableItem>
  )
}
