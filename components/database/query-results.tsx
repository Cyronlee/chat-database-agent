"use client"

import { useState, useMemo } from "react"
import { DataGrid, DataGridContainer } from "@/components/ui/data-grid"
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header"
import { DataGridTable } from "@/components/ui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

interface QueryResultsProps {
  columns: string[]
  rows: Record<string, unknown>[]
}

export function QueryResults({ columns, rows }: QueryResultsProps) {
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
    <DataGrid
      table={table}
      recordCount={rows.length}
      tableLayout={{ headerSticky: true, width: "auto" }}
    >
      <DataGridContainer className="h-full flex flex-col border-none">
        <ScrollArea className="flex-1 min-h-0">
          <DataGridTable />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>
    </DataGrid>
  )
}
