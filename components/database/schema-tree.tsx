"use client"

import { useMemo } from "react"
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { Database, Table2, Columns3, Loader2 } from "lucide-react"
import type { TableSchema } from "@/app/api/database/schema/route"

interface TreeItemData {
  id: string
  name: string
  type: "root" | "table" | "column"
  columnType?: string
  children?: string[]
}

const indent = 20

interface SchemaTreeProps {
  schema: TableSchema[]
  isLoading?: boolean
}

export function SchemaTree({ schema, isLoading = false }: SchemaTreeProps) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10 overflow-hidden">
              <span className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                {data.type === "root" ? (
                  <Database className="text-muted-foreground pointer-events-none size-4 shrink-0" />
                ) : data.type === "table" ? (
                  <Table2 className="text-muted-foreground pointer-events-none size-4 shrink-0" />
                ) : (
                  <Columns3 className="text-muted-foreground pointer-events-none size-4 shrink-0" />
                )}
                <span className="truncate">{data.name}</span>
                {data.type === "column" && data.columnType && (
                  <span className="text-xs text-muted-foreground shrink-0">
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
