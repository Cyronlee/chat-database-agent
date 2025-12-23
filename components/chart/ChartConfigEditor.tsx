"use client"

import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  CustomChartConfig,
  CartesianChartConfig,
  PieChartConfig,
  TableData,
} from "./types"
import { getDataFields, analyzeDataFields, CHART_COLORS } from "./utils"

interface ChartConfigEditorProps {
  data: TableData[]
  value: CustomChartConfig
  onChange: (config: CustomChartConfig) => void
}

export function ChartConfigEditor({
  data,
  value,
  onChange,
}: ChartConfigEditorProps) {
  const fields = getDataFields(data)
  const { numericFields, categoricalFields } = analyzeDataFields(data)

  const isGroupByMode = value.type !== "pie" && !!value.groupBy?.field

  const handleTypeChange = (type: CustomChartConfig["type"]) => {
    if (type === "pie") {
      const newConfig: PieChartConfig = {
        type: "pie",
        title: value.title,
        description: value.description,
        label: {
          field: categoricalFields[0] || fields[0] || "",
        },
        value: {
          field: numericFields[0] || fields[1] || fields[0] || "",
        },
        colors: data.slice(0, 5).map((_, index) => ({
          color: CHART_COLORS[index % CHART_COLORS.length],
        })),
      }
      onChange(newConfig)
    } else {
      const newConfig: CartesianChartConfig = {
        type,
        title: value.title,
        description: value.description,
        xAxis: {
          field: categoricalFields[0] || fields[0] || "",
          label: categoricalFields[0] || fields[0] || "",
        },
        series: [
          {
            field: numericFields[0] || fields[1] || fields[0] || "",
            label: numericFields[0] || fields[1] || fields[0] || "",
            color: CHART_COLORS[0],
          },
        ],
      }
      onChange(newConfig)
    }
  }

  const handleTitleChange = (title: string) => {
    onChange({ ...value, title })
  }

  const handleDescriptionChange = (description: string) => {
    onChange({ ...value, description })
  }

  // Toggle groupBy mode
  const handleGroupByToggle = (enabled: boolean) => {
    if (value.type === "pie") return
    
    if (enabled) {
      // Enable groupBy mode - find best fields for grouping
      const xField = categoricalFields[0] || fields[0] || ""
      const groupField = categoricalFields[1] || categoricalFields[0] || fields[1] || ""
      const valueField = numericFields[0] || fields[2] || ""
      
      onChange({
        ...value,
        xAxis: { field: xField, label: xField },
        groupBy: {
          field: groupField,
          valueField: valueField,
        },
        series: [], // Clear series in groupBy mode
      } as CartesianChartConfig)
    } else {
      // Disable groupBy mode - restore normal series mode
      const currentConfig = value as CartesianChartConfig
      const newConfig: CartesianChartConfig = {
        ...currentConfig,
        groupBy: undefined,
        series: [
          {
            field: numericFields[0] || fields[1] || fields[0] || "",
            label: numericFields[0] || fields[1] || fields[0] || "",
            color: CHART_COLORS[0],
          },
        ],
      }
      onChange(newConfig)
    }
  }

  // Cartesian chart specific handlers
  const handleXAxisFieldChange = (field: string) => {
    if (value.type === "pie") return
    onChange({
      ...value,
      xAxis: { ...value.xAxis, field, label: field },
    } as CartesianChartConfig)
  }

  // GroupBy specific handlers
  const handleGroupByFieldChange = (field: string) => {
    if (value.type === "pie" || !value.groupBy) return
    onChange({
      ...value,
      groupBy: { ...value.groupBy, field },
    } as CartesianChartConfig)
  }

  const handleGroupByValueFieldChange = (field: string) => {
    if (value.type === "pie" || !value.groupBy) return
    onChange({
      ...value,
      groupBy: { ...value.groupBy, valueField: field },
    } as CartesianChartConfig)
  }

  const handleSeriesFieldChange = (index: number, field: string) => {
    if (value.type === "pie") return
    const newSeries = [...value.series]
    newSeries[index] = { ...newSeries[index], field, label: field }
    onChange({ ...value, series: newSeries } as CartesianChartConfig)
  }

  const handleSeriesColorChange = (index: number, color: string) => {
    if (value.type === "pie") return
    const newSeries = [...value.series]
    newSeries[index] = { ...newSeries[index], color }
    onChange({ ...value, series: newSeries } as CartesianChartConfig)
  }

  const handleAddSeries = () => {
    if (value.type === "pie") return
    const usedFields = value.series.map((s) => s.field)
    const availableField = fields.find((f) => !usedFields.includes(f) && f !== value.xAxis.field)
    const newSeries = [
      ...value.series,
      {
        field: availableField || fields[0] || "",
        label: availableField || fields[0] || "",
        color: CHART_COLORS[value.series.length % CHART_COLORS.length],
      },
    ]
    onChange({ ...value, series: newSeries } as CartesianChartConfig)
  }

  const handleRemoveSeries = (index: number) => {
    if (value.type === "pie") return
    if (value.series.length <= 1) return
    const newSeries = value.series.filter((_, i) => i !== index)
    onChange({ ...value, series: newSeries } as CartesianChartConfig)
  }

  // Pie chart specific handlers
  const handleLabelFieldChange = (field: string) => {
    if (value.type !== "pie") return
    onChange({
      ...value,
      label: { field },
    } as PieChartConfig)
  }

  const handleValueFieldChange = (field: string) => {
    if (value.type !== "pie") return
    onChange({
      ...value,
      value: { field },
    } as PieChartConfig)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Chart Type</Label>
        <Select value={value.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="area">Area Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={value.title || ""}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Chart title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={value.description || ""}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Chart description"
        />
      </div>

      {value.type !== "pie" ? (
        <>
          {/* GroupBy Mode Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label>Group By Mode</Label>
              <p className="text-xs text-muted-foreground">
                Pivot data by a category field
              </p>
            </div>
            <Switch
              checked={isGroupByMode}
              onCheckedChange={handleGroupByToggle}
            />
          </div>

          <div className="space-y-2">
            <Label>X-Axis Field</Label>
            <Select value={value.xAxis.field} onValueChange={handleXAxisFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                    {categoricalFields.includes(field) && (
                      <span className="ml-2 text-xs text-muted-foreground">(category)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isGroupByMode ? (
            <>
              {/* GroupBy Configuration */}
              <div className="space-y-2">
                <Label>Group By Field (Series)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Each unique value becomes a separate line/bar
                </p>
                <Select
                  value={value.groupBy?.field || ""}
                  onValueChange={handleGroupByFieldChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields
                      .filter((f) => f !== value.xAxis.field)
                      .map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                          {categoricalFields.includes(field) && (
                            <span className="ml-2 text-xs text-muted-foreground">(category)</span>
                          )}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value Field</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  The numeric field to plot
                </p>
                <Select
                  value={value.groupBy?.valueField || ""}
                  onValueChange={handleGroupByValueFieldChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields
                      .filter((f) => f !== value.xAxis.field && f !== value.groupBy?.field)
                      .map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                          {numericFields.includes(field) && (
                            <span className="ml-2 text-xs text-muted-foreground">(numeric)</span>
                          )}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              {/* Normal Series Configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Series</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSeries}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Series
                  </Button>
                </div>
                <div className="space-y-3">
                  {value.series.map((series, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={series.field}
                          onValueChange={(field) => handleSeriesFieldChange(index, field)}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={series.color || CHART_COLORS[index % CHART_COLORS.length]}
                          onChange={(e) => handleSeriesColorChange(index, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSeries(index)}
                          disabled={value.series.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Label Field (Categories)</Label>
            <Select value={value.label.field} onValueChange={handleLabelFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value Field (Numbers)</Label>
            <Select value={value.value.field} onValueChange={handleValueFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}
