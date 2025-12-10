添加一个`/database`页面，用户可以查看表结构，用户可以输入 SQL 查询语句，点击`Execute`按钮，执行查询语句，并显示查询结果

- 在页面左侧显示表结构，用户可以点击表名，展开表结构
- 在页面右侧分为上下两部分
  - 上半部分为输入框，用户可以输入 SQL 查询语句，点击`Execute`按钮，执行查询语句，并显示查询结果
  - 下半部分为查询结果，显示为 Table 样式
- 添加两个后端 api 来支持这两个功能

## 表结构组件 UI 参考

```tsx
"use client"

import React from "react"
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"

interface Item {
  name: string
  children?: string[]
}

const items: Record<string, Item> = {
  crm: {
    name: "CRM",
    children: ["leads", "accounts", "activities", "support"],
  },
  leads: {
    name: "Leads",
    children: ["new-lead", "contacted-lead", "qualified-lead"],
  },
  "new-lead": { name: "New Lead" },
  "contacted-lead": { name: "Contacted Lead" },
  "qualified-lead": { name: "Qualified Lead" },
}

const indent = 20

export default function Component() {
  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["leads", "accounts", "activities"],
    },
    indent,
    rootItemId: "crm",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId].children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })

  return (
    <div className="self-start lg:w-[225px]">
      <Tree
        className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
        indent={indent}
        tree={tree}
      >
        {tree.getItems().map((item) => {
          return (
            <TreeItem key={item.getId()} item={item}>
              <TreeItemLabel className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10">
                <span className="flex items-center gap-2">
                  {item.isFolder() ? (
                    item.isExpanded() ? (
                      <FolderOpenIcon className="text-muted-foreground pointer-events-none size-4" />
                    ) : (
                      <FolderIcon className="text-muted-foreground pointer-events-none size-4" />
                    )
                  ) : (
                    <FileIcon className="text-muted-foreground pointer-events-none size-4" />
                  )}
                  {item.getItemName()}
                </span>
              </TreeItemLabel>
            </TreeItem>
          )
        })}
      </Tree>
    </div>
  )
}
```

## 查询结果组件 UI 参考

```tsx
import { useMemo, useState } from "react"
import { DataGrid, DataGridContainer } from "@/components/ui/data-grid"
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header"
import { DataGridTable } from "@/components/ui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

interface IData {
  id: string
  name: string
  availability: "online" | "away" | "busy" | "offline"
  avatar?: string // 保留字段但不再使用
  status: "active" | "inactive"
  flag: string
  email: string
  company: string
  role: string
  joined: string
  location: string
  balance: number
}

const demoData: IData[] = []

export default function DataGridDemo() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: true },
  ])

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: "company",
        header: ({ column }) => (
          <DataGridColumnHeader title="Company" column={column} />
        ),
        cell: (info) => <span>{info.getValue() as string}</span>,
        size: 150,
        enableSorting: true,
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataGridColumnHeader title="Occupation" column={column} />
        ),
        cell: (info) => <span>{info.getValue() as string}</span>,
        size: 125,
        enableSorting: true,
      },
      {
        accessorKey: "balance",
        header: ({ column }) => (
          <DataGridColumnHeader title="Dividend" column={column} />
        ),
        cell: (info) => <span>${(info.getValue() as number).toFixed(2)}</span>,
        size: 120,
        meta: {
          cellClassName: "font-semibold",
        },
        enableSorting: true,
      },
    ],
    []
  )

  const table = useReactTable({
    columns,
    data: demoData,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  })

  return (
    <DataGrid table={table} recordCount={demoData.length}>
      <div className="w-full space-y-2.5">
        <DataGridContainer>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
      </div>
    </DataGrid>
  )
}
```
