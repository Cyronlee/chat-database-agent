"use client"

import { useState } from "react"
import type { CustomChart } from "@/api-clients/custom-charts"
import type { ChartWidth, DashboardChartItem } from "@/api-clients/dashboards"

export interface ChartConfigItem {
  chartId: string
  chart: CustomChart
  width: ChartWidth
  selected: boolean
}

interface UseChartConfigStateOptions {
  charts: CustomChart[]
  initialChartItems: DashboardChartItem[]
}

export function useChartConfigState({
  charts,
  initialChartItems,
}: UseChartConfigStateOptions) {
  // Single source of truth: ordered array with all info
  const [items, setItems] = useState<ChartConfigItem[]>(() =>
    buildInitialItems(charts, initialChartItems)
  )

  // Reset state (useful when dialog opens)
  const resetState = (
    newCharts: CustomChart[],
    newInitialItems: DashboardChartItem[]
  ) => {
    setItems(buildInitialItems(newCharts, newInitialItems))
  }

  // Toggle selection
  const toggleSelection = (chartId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.chartId === chartId ? { ...item, selected: !item.selected } : item
      )
    )
  }

  // Change width
  const setWidth = (chartId: string, width: ChartWidth) => {
    setItems((prev) =>
      prev.map((item) => (item.chartId === chartId ? { ...item, width } : item))
    )
  }

  // Reorder items (for drag and drop)
  const reorderItems = (newItems: ChartConfigItem[]) => {
    setItems(newItems)
  }

  // Get selected items in order for saving
  const getSelectedItems = (): DashboardChartItem[] => {
    return items
      .filter((item) => item.selected)
      .map((item) => ({
        chartId: item.chartId,
        width: item.width,
      }))
  }

  // Computed values
  const selectedCount = items.filter((item) => item.selected).length

  return {
    items,
    resetState,
    toggleSelection,
    setWidth,
    reorderItems,
    getSelectedItems,
    selectedCount,
  }
}

// Helper to build initial items from charts and saved config
function buildInitialItems(
  charts: CustomChart[],
  initialChartItems: DashboardChartItem[]
): ChartConfigItem[] {
  const chartMap = new Map(charts.map((c) => [c.id, c]))
  const selectedIds = new Set(initialChartItems.map((item) => item.chartId))

  const result: ChartConfigItem[] = []

  // First: add selected charts in their saved order
  for (const savedItem of initialChartItems) {
    const chart = chartMap.get(savedItem.chartId)
    if (chart) {
      result.push({
        chartId: chart.id,
        chart,
        width: savedItem.width,
        selected: true,
      })
    }
  }

  // Then: add unselected charts
  for (const chart of charts) {
    if (!selectedIds.has(chart.id)) {
      result.push({
        chartId: chart.id,
        chart,
        width: "full",
        selected: false,
      })
    }
  }

  return result
}
