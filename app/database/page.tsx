"use client"

import { useState, useEffect, useMemo } from "react"
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { Database, Table2, Columns3, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DataGrid, DataGridContainer } from "@/components/ui/data-grid"
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header"
import { DataGridTable } from "@/components/ui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import type { TableSchema } from "@/app/api/database/schema/route"

interface TreeItemData {
  id: string
  name: string
  type: "root" | "table" | "column"
  columnType?: string
  children?: string[]
}

const indent = 20

function SchemaTree({
  schema,
  onTableClick,
}: {
  schema: TableSchema[]
  onTableClick?: (tableName: string) => void
}) {
  const items = useMemo(() => {
    const itemsMap: Record<string, TreeItemData> = {
      root: {
        id: "root",
        name: "Database Schema",
        type: "root",
        children: schema.map((t) => `table-${t.name}`),
      },
    }

    schema.forEach((table) => {
      const tableId = `table-${table.name}`
      itemsMap[tableId] = {
        id: tableId,
        name: table.name,
        type: "table",
        children: table.columns.map((c) => `column-${table.name}-${c.name}`),
      }

      table.columns.forEach((column) => {
        const columnId = `column-${table.name}-${column.name}`
        itemsMap[columnId] = {
          id: columnId,
          name: column.name,
          type: "column",
          columnType: column.type,
        }
      })
    })

    return itemsMap
  }, [schema])

  const tree = useTree<TreeItemData>({
    initialState: {
      expandedItems: [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })

  const handleItemClick = (item: TreeItemData) => {
    if (item.type === "table" && onTableClick) {
      onTableClick(item.name)
    }
  }

  return (
    <Tree
      className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
      indent={indent}
      tree={tree}
    >
      {tree.getItems().map((item) => {
        const data = item.getItemData()
        return (
          <TreeItem
            key={item.getId()}
            item={item}
            onClick={() => handleItemClick(data)}
          >
            <TreeItemLabel className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10">
              <span className="flex items-center gap-2">
                {data.type === "root" ? (
                  <Database className="text-muted-foreground pointer-events-none size-4" />
                ) : data.type === "table" ? (
                  <Table2 className="text-muted-foreground pointer-events-none size-4" />
                ) : (
                  <Columns3 className="text-muted-foreground pointer-events-none size-4" />
                )}
                <span>{data.name}</span>
                {data.type === "column" && data.columnType && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({data.columnType})
                  </span>
                )}
              </span>
            </TreeItemLabel>
          </TreeItem>
        )
      })}
    </Tree>
  )
}

function QueryResults({
  columns,
  rows,
}: {
  columns: string[]
  rows: Record<string, unknown>[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col,
        header: ({ column }) => (
          <DataGridColumnHeader title={col} column={column} />
        ),
        cell: (info) => {
          const value = info.getValue()
          if (value === null)
            return <span className="text-muted-foreground italic">null</span>
          if (typeof value === "object") return JSON.stringify(value)
          return String(value)
        },
        size: 150,
        enableSorting: true,
      })),
    [columns]
  )

  const table = useReactTable({
    columns: columnDefs,
    data: rows,
    getRowId: (_, index) => String(index),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  })

  return (
    <DataGrid table={table} recordCount={rows.length}>
      <DataGridContainer>
        <ScrollArea className="h-full">
          <DataGridTable />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>
    </DataGrid>
  )
}

export default function DatabasePage() {
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [sql, setSql] = useState("SELECT * FROM jira_projects LIMIT 10")
  const [isLoading, setIsLoading] = useState(false)
  const [isSchemaLoading, setIsSchemaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  } | null>(null)

  // Fetch schema on mount
  useEffect(() => {
    async function fetchSchema() {
      try {
        const response = await fetch("/api/database/schema")
        const data = await response.json()
        if (data.error) {
          setError(data.error)
        } else {
          setSchema(data.schema)
        }
      } catch (err) {
        setError("Failed to fetch schema")
        console.error(err)
      } finally {
        setIsSchemaLoading(false)
      }
    }
    fetchSchema()
  }, [])

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setQueryResult(null)
      } else {
        setQueryResult(data)
      }
    } catch (err) {
      setError("Failed to execute query")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTableClick = (tableName: string) => {
    setSql(`SELECT * FROM ${tableName} LIMIT 100`)
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left sidebar - Schema Tree */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
        <div className="flex h-full flex-col">
          <div className="p-4 border-b shrink-0">
            <h2 className="font-semibold text-sm">Tables</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isSchemaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SchemaTree schema={schema} onTableClick={handleTableClick} />
              )}
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right side - Query Input and Results */}
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          {/* Query Input */}
          <ResizablePanel defaultSize={30} minSize={15}>
            <div className="flex h-full flex-col p-4">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="Enter your SQL query..."
                className="font-mono text-sm flex-1 resize-none"
              />
              <div className="flex items-center justify-between mt-3 shrink-0">
                <Button
                  onClick={handleExecute}
                  disabled={isLoading || !sql.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
                {queryResult && (
                  <span className="text-sm text-muted-foreground">
                    {queryResult.rowCount} row
                    {queryResult.rowCount !== 1 ? "s" : ""} returned
                  </span>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Query Results */}
          <ResizablePanel defaultSize={70} minSize={20}>
            <div className="h-full p-4 overflow-hidden">
              {error ? (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive text-sm">
                  {error}
                </div>
              ) : queryResult ? (
                <div className="h-full">
                  <QueryResults
                    columns={queryResult.columns}
                    rows={queryResult.rows}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Execute a query to see results
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
