"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ChevronsUpDown, Database, Settings } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getDatabases, getDatabasesKey } from "@/api-clients/databases"
import { useDatabaseStore } from "@/stores/database-store"

export function DatabaseSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { data } = useSWR(getDatabasesKey(), getDatabases)
  const {
    selectedDatabaseId,
    setSelectedDatabase,
    setDatabases,
  } = useDatabaseStore()

  // Sync fetched databases to store
  useEffect(() => {
    if (data?.databases) {
      setDatabases(data.databases)
    }
  }, [data?.databases, setDatabases])

  const databases = data?.databases || []

  // Find the selected database
  const selectedDatabase = selectedDatabaseId
    ? databases.find((db) => db.id === selectedDatabaseId)
    : null

  const handleSelect = (id: string | null) => {
    setSelectedDatabase(id)
  }

  const handleManageDatabases = () => {
    router.push("/databases")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Database className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedDatabase?.name || "System Database"}
                </span>
                <span className="truncate text-xs">
                  {selectedDatabase
                    ? `${selectedDatabase.host}:${selectedDatabase.port}`
                    : "Default connection"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Databases
            </DropdownMenuLabel>

            {/* System Database */}
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <Database className="size-3.5 shrink-0" />
              </div>
              <div className="flex-1">
                <span className="font-medium">System Database</span>
                <span className="block text-xs text-muted-foreground">
                  Default connection
                </span>
              </div>
              {!selectedDatabaseId && (
                <span className="text-xs text-primary">Active</span>
              )}
            </DropdownMenuItem>

            {/* External Databases */}
            {databases.length > 0 && <DropdownMenuSeparator />}
            {databases.map((db) => (
              <DropdownMenuItem
                key={db.id}
                onClick={() => handleSelect(db.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Database className="size-3.5 shrink-0" />
                </div>
                <div className="flex-1">
                  <span className="font-medium">{db.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {db.host}:{db.port}
                  </span>
                </div>
                {selectedDatabaseId === db.id && (
                  <span className="text-xs text-primary">Active</span>
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Add Database */}
            <DropdownMenuItem
              onClick={handleManageDatabases}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Settings className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Manage Databases
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

