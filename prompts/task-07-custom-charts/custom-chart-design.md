# Custom Charts

## Overview

This document introduces the usage of two core chart components:

- **ChartConfigEditor**: Chart configuration editor for interactive editing of chart settings
- **ChartRenderer**: Chart renderer that renders different types of charts based on data and configuration

## Basic Usage

Here's a basic usage example of these two components:

```tsx
import { useState } from "react"
import { ChartConfig, ChartRenderer } from "@/components/charts"
import { ChartConfigEditor } from "@/components/charts/ChartConfigEditor"

// Sample data and initial configuration
const data = [
  { month: "Jan", sales: 120, profit: 20 },
  { month: "Feb", sales: 160, profit: 30 },
  { month: "Mar", sales: 140, profit: 25 },
]

const initialConfig: ChartConfig = {
  type: "line",
  title: "Sales and Profit Trends",
  xAxis: {
    field: "month",
    label: "Month",
  },
  series: [
    { field: "sales", label: "Sales", color: "#3b82f6" },
    { field: "profit", label: "Profit", color: "#10b981" },
  ],
}

function ChartExample() {
  const [config, setConfig] = useState<ChartConfig>(initialConfig)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart Configuration Editor */}
      <ChartConfigEditor data={data} value={config} onChange={setConfig} />

      {/* Chart Rendering Area */}
      <div className="border rounded-md p-4 bg-white">
        <ChartRenderer data={data} config={config} />
      </div>
    </div>
  )
}
```

## ChartConfigEditor Component

### Props

```tsx
interface ChartConfigEditorProps {
  data: TableData[] // Data to be displayed
  value: ChartConfig // Current chart configuration
  onChange: (config: ChartConfig) => void // Configuration change callback
}
```

### Chart Configuration Types

```tsx
// Base chart configuration
interface BaseChartConfig {
  type: "line" | "area" | "bar" | "pie" // Chart type
  title?: string // Chart title
  description?: string // Chart description
}

// Cartesian chart configuration (line, area, bar charts)
interface CartesianChartConfig extends BaseChartConfig {
  type: "line" | "area" | "bar"
  xAxis: {
    field: string // Data field for X-axis
    label?: string // X-axis label
  }
  series: {
    field: string // Data field for series
    label?: string // Series label
    color?: string // Series color
  }[]
}

// Pie chart configuration
interface PieChartConfig extends BaseChartConfig {
  type: "pie"
  label: {
    field: string // Data field for category labels
  }
  value: {
    field: string // Data field for values
  }
  colors?: {
    color: string // Color value
    name?: string // Corresponding category name
  }[]
}

type ChartConfig = CartesianChartConfig | PieChartConfig
```

## ChartRenderer Component

### Props

```tsx
interface ChartRendererProps {
  data: TableData[] // Data to be rendered
  config: ChartConfig // Chart configuration
  width?: number // Optional width
  height?: number // Optional height
  className?: string // Optional custom style class
}
```
