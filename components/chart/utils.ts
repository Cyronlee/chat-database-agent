import type {
  CustomChartConfig,
  TableData,
  CartesianChartConfig,
} from "./types"
import { isGroupByConfig } from "./types"

// Default chart colors using CSS variables
export const CHART_COLORS = [
  "#F8B4B4",
  "#FACA15",
  "#84E1BC",
  "#A4CAFE",
  "#B4C6FC",
  "#CABFFD",
  "#F98080",
  "#E3A008",
  "#31C48D",
  "#76A9FA",
  "#8DA2FB",
  "#AC94FA",
  "#F05252",
  "#C27803",
  "#0E9F6E",
  "#3F83F8",
  "#6875F5",
  "#9061F9",
  "#E02424",
  "#9F580A",
  "#057A55",
  "#1C64F2",
  "#5850EC",
  "#7E3AF2",
  "#C81E1E",
  "#8E4B10",
  "#046C4E",
  "#1A56DB",
  "#5145CD",
  "#6C2BD9",
]

// Detect if a value is numeric
function isNumericValue(value: unknown): boolean {
  if (typeof value === "number") return true
  if (typeof value === "string") {
    const num = parseFloat(value)
    return !isNaN(num) && isFinite(num)
  }
  return false
}

// Analyze data fields to determine which are numeric and which are categorical
export function analyzeDataFields(data: TableData[]): {
  numericFields: string[]
  categoricalFields: string[]
} {
  if (!data.length) {
    return { numericFields: [], categoricalFields: [] }
  }

  const firstRow = data[0]
  const fields = Object.keys(firstRow)

  const numericFields: string[] = []
  const categoricalFields: string[] = []

  for (const field of fields) {
    // Check a sample of values to determine field type
    const sampleSize = Math.min(data.length, 10)
    let numericCount = 0

    for (let i = 0; i < sampleSize; i++) {
      if (isNumericValue(data[i][field])) {
        numericCount++
      }
    }

    // If more than 70% of samples are numeric, consider it a numeric field
    if (numericCount / sampleSize > 0.7) {
      numericFields.push(field)
    } else {
      categoricalFields.push(field)
    }
  }

  return { numericFields, categoricalFields }
}

// Auto-generate chart configuration from data
export function autoInitChartConfig(data: TableData[]): CustomChartConfig {
  const { numericFields, categoricalFields } = analyzeDataFields(data)

  // If we have both categorical and numeric fields, create a bar chart
  if (categoricalFields.length > 0 && numericFields.length > 0) {
    const xAxisField = categoricalFields[0]
    const seriesFields = numericFields.slice(0, 3) // Limit to 3 series

    return {
      type: "bar",
      title: "Auto-generated Chart",
      xAxis: {
        field: xAxisField,
        label: xAxisField,
      },
      series: seriesFields.map((field, index) => ({
        field,
        label: field,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    }
  }

  // If we only have numeric fields, use the first as category and rest as values
  if (numericFields.length >= 2) {
    const xAxisField = numericFields[0]
    const seriesFields = numericFields.slice(1, 4) // Limit to 3 series

    return {
      type: "line",
      title: "Auto-generated Chart",
      xAxis: {
        field: xAxisField,
        label: xAxisField,
      },
      series: seriesFields.map((field, index) => ({
        field,
        label: field,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    }
  }

  // If we have categorical data, create a pie chart
  if (categoricalFields.length >= 1 && numericFields.length >= 1) {
    return {
      type: "pie",
      title: "Auto-generated Chart",
      label: {
        field: categoricalFields[0],
      },
      value: {
        field: numericFields[0],
      },
      colors: data.slice(0, 5).map((_, index) => ({
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    }
  }

  // Default fallback - create an empty bar chart config
  const fields = Object.keys(data[0] || {})
  return {
    type: "bar",
    title: "Chart",
    xAxis: {
      field: fields[0] || "",
      label: fields[0] || "",
    },
    series: fields.slice(1, 2).map((field, index) => ({
      field,
      label: field,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })),
  }
}

// Get available fields from data
export function getDataFields(data: TableData[]): string[] {
  if (!data.length) return []
  return Object.keys(data[0])
}

// Pivot data for groupBy mode
// Transforms: [{x: "Sprint1", group: "Alice", value: 5}, {x: "Sprint1", group: "Bob", value: 3}]
// To: [{x: "Sprint1", Alice: 5, Bob: 3}]
export function pivotDataForGroupBy(
  data: TableData[],
  xAxisField: string,
  groupByField: string,
  valueField: string
): { pivotedData: TableData[]; groupValues: string[] } {
  // Get unique x-axis values and group values
  const xValues = [...new Set(data.map((d) => String(d[xAxisField])))]
  const groupValues = [...new Set(data.map((d) => String(d[groupByField])))]

  // Create pivoted data
  const pivotedData: TableData[] = xValues.map((xValue) => {
    const row: TableData = { [xAxisField]: xValue }

    for (const groupValue of groupValues) {
      const matchingRow = data.find(
        (d) =>
          String(d[xAxisField]) === xValue &&
          String(d[groupByField]) === groupValue
      )
      row[groupValue] = matchingRow ? matchingRow[valueField] : 0
    }

    return row
  })

  return { pivotedData, groupValues }
}

// Convert custom chart config to shadcn/ui chart config format
export function toShadcnChartConfig(
  config: CustomChartConfig,
  data: TableData[]
): Record<string, { label: string; color: string }> {
  const result: Record<string, { label: string; color: string }> = {}

  if (config.type === "pie") {
    // For pie charts, create config entries for each data item
    const labelField = config.label.field
    data.forEach((item, index) => {
      const name = String(item[labelField] || `item-${index}`)
      const colorConfig = config.colors?.[index]
      result[name] = {
        label: name,
        color: colorConfig?.color || CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    // Also add the value field
    result[config.value.field] = {
      label: config.value.field,
      color: CHART_COLORS[0],
    }
  } else if (isGroupByConfig(config)) {
    // For groupBy mode, create config entries for each group value
    const { groupValues } = pivotDataForGroupBy(
      data,
      config.xAxis.field,
      config.groupBy.field,
      config.groupBy.valueField
    )
    groupValues.forEach((groupValue, index) => {
      result[groupValue] = {
        label: groupValue,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
  } else {
    // For cartesian charts, create config entries for each series
    config.series.forEach((series, index) => {
      result[series.field] = {
        label: series.label || series.field,
        color: series.color || CHART_COLORS[index % CHART_COLORS.length],
      }
    })
  }

  return result
}

// Prepare pie chart data with fill colors
export function preparePieChartData(
  data: TableData[],
  config: CustomChartConfig
): TableData[] {
  if (config.type !== "pie") return data

  const labelField = config.label.field
  return data.map((item, index) => {
    const name = String(item[labelField] || `item-${index}`)
    return {
      ...item,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }
  })
}

// Get chart data based on config (handles groupBy transformation)
export function getChartData(
  data: TableData[],
  config: CartesianChartConfig
): { chartData: TableData[]; seriesKeys: string[] } {
  if (isGroupByConfig(config)) {
    const { pivotedData, groupValues } = pivotDataForGroupBy(
      data,
      config.xAxis.field,
      config.groupBy.field,
      config.groupBy.valueField
    )
    return { chartData: pivotedData, seriesKeys: groupValues }
  }

  return {
    chartData: data,
    seriesKeys: config.series.map((s) => s.field),
  }
}
