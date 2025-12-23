"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type {
  CustomChartConfig,
  TableData,
  CartesianChartConfig,
} from "./types"
import { isCartesianConfig, isPieConfig, isGroupByConfig } from "./types"
import {
  toShadcnChartConfig,
  preparePieChartData,
  CHART_COLORS,
  getChartData,
} from "./utils"
import { cn } from "@/lib/utils"

interface ChartRendererProps {
  data: TableData[]
  config: CustomChartConfig
  className?: string
}

function calculateYAxisMax(
  chartData: TableData[],
  seriesKeys: string[]
): number {
  let maxValue = 0
  for (const item of chartData) {
    for (const key of seriesKeys) {
      const value = Number(item[key]) || 0
      if (value > maxValue) {
        maxValue = value
      }
    }
  }
  // Add 10% padding to the max value for better visualization
  return Math.ceil(maxValue * 1.05)
}

function LineChartRenderer({
  data,
  config,
  shadcnConfig,
}: {
  data: TableData[]
  config: CartesianChartConfig
  shadcnConfig: Record<string, { label: string; color: string }>
}) {
  const { chartData, seriesKeys } = getChartData(data, config)
  const yAxisMax = calculateYAxisMax(chartData, seriesKeys)

  return (
    <ChartContainer config={shadcnConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.field}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) =>
            String(value).length > 10
              ? String(value).slice(0, 10) + "..."
              : String(value)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, yAxisMax]}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        {seriesKeys.map((key, index) => {
          const series = config.series.find((s) => s.field === key)
          const color =
            series?.color || CHART_COLORS[index % CHART_COLORS.length]
          return (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          )
        })}
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  )
}

function AreaChartRenderer({
  data,
  config,
  shadcnConfig,
}: {
  data: TableData[]
  config: CartesianChartConfig
  shadcnConfig: Record<string, { label: string; color: string }>
}) {
  const { chartData, seriesKeys } = getChartData(data, config)
  const yAxisMax = calculateYAxisMax(chartData, seriesKeys)

  return (
    <ChartContainer config={shadcnConfig} className="h-full w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.field}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) =>
            String(value).length > 10
              ? String(value).slice(0, 10) + "..."
              : String(value)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, yAxisMax]}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {seriesKeys.map((key, index) => {
          const series = config.series.find((s) => s.field === key)
          const color =
            series?.color || CHART_COLORS[index % CHART_COLORS.length]
          return (
            <Area
              key={key}
              dataKey={key}
              type="natural"
              fill={color}
              fillOpacity={0.4}
              stroke={color}
              stackId="a"
            />
          )
        })}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}

function BarChartRenderer({
  data,
  config,
  shadcnConfig,
}: {
  data: TableData[]
  config: CartesianChartConfig
  shadcnConfig: Record<string, { label: string; color: string }>
}) {
  const { chartData, seriesKeys } = getChartData(data, config)
  const isGrouped = isGroupByConfig(config)
  const yAxisMax = calculateYAxisMax(chartData, seriesKeys)

  return (
    <ChartContainer config={shadcnConfig} className="h-full w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.field}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) =>
            String(value).length > 10
              ? String(value).slice(0, 10) + "..."
              : String(value)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, yAxisMax]}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        {seriesKeys.map((key, index) => {
          const series = config.series.find((s) => s.field === key)
          const color =
            series?.color || CHART_COLORS[index % CHART_COLORS.length]
          return (
            <Bar
              key={key}
              dataKey={key}
              stackId={isGrouped ? undefined : "a"}
              fill={color}
              radius={
                isGrouped
                  ? [4, 4, 0, 0]
                  : index === 0
                  ? [0, 0, 4, 4]
                  : index === seriesKeys.length - 1
                  ? [4, 4, 0, 0]
                  : [0, 0, 0, 0]
              }
            />
          )
        })}
      </BarChart>
    </ChartContainer>
  )
}

function PieChartRenderer({
  data,
  config,
  shadcnConfig,
}: {
  data: TableData[]
  config: CustomChartConfig & { type: "pie" }
  shadcnConfig: Record<string, { label: string; color: string }>
}) {
  const pieData = preparePieChartData(data, config)
  const labelField = config.label.field

  return (
    <ChartContainer
      config={shadcnConfig}
      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square h-full max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={pieData}
          dataKey={config.value.field}
          label
          nameKey={labelField}
        />
      </PieChart>
    </ChartContainer>
  )
}

export function ChartRenderer({ data, config, className }: ChartRendererProps) {
  const shadcnConfig = toShadcnChartConfig(config, data)

  if (isCartesianConfig(config)) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {config.title && (
          <div className="px-4 pt-4">
            <h3 className="text-lg font-semibold">{config.title}</h3>
            {config.description && (
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            )}
          </div>
        )}
        <div className="flex-1 p-4 min-h-0">
          {config.type === "line" && (
            <LineChartRenderer
              data={data}
              config={config}
              shadcnConfig={shadcnConfig}
            />
          )}
          {config.type === "area" && (
            <AreaChartRenderer
              data={data}
              config={config}
              shadcnConfig={shadcnConfig}
            />
          )}
          {config.type === "bar" && (
            <BarChartRenderer
              data={data}
              config={config}
              shadcnConfig={shadcnConfig}
            />
          )}
        </div>
      </div>
    )
  }

  if (isPieConfig(config)) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {config.title && (
          <div className="px-4 pt-4 text-center">
            <h3 className="text-lg font-semibold">{config.title}</h3>
            {config.description && (
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            )}
          </div>
        )}
        <div className="flex-1 p-4 min-h-0">
          <PieChartRenderer
            data={data}
            config={config}
            shadcnConfig={shadcnConfig}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Unsupported chart type
    </div>
  )
}
