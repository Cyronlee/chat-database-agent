"use client"

import { useState } from "react"
import {
  Database,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ExternalDatabase } from "@/stores/database-store"

interface DatabaseListProps {
  databases: ExternalDatabase[]
  onEdit: (database: ExternalDatabase) => void
  onDelete: (id: string) => Promise<void>
  onTestConnection: (id: string) => Promise<boolean>
  isDeleting?: string
}

export function DatabaseList({
  databases,
  onEdit,
  onDelete,
  onTestConnection,
  isDeleting,
}: DatabaseListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [databaseToDelete, setDatabaseToDelete] = useState<ExternalDatabase | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const handleDeleteClick = (database: ExternalDatabase) => {
    setDatabaseToDelete(database)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (databaseToDelete) {
      await onDelete(databaseToDelete.id)
    }
    setDeleteDialogOpen(false)
    setDatabaseToDelete(null)
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    const success = await onTestConnection(id)
    setTestResults((prev) => ({ ...prev, [id]: success }))
    setTestingId(null)
    // Clear result after 3 seconds
    setTimeout(() => {
      setTestResults((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, 3000)
  }

  if (databases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No databases configured</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first database connection to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y">
        {databases.map((db) => (
          <div
            key={db.id}
            className="flex items-center justify-between py-4 px-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{db.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {db.host}:{db.port}/{db.database}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Test status indicator */}
              {testingId === db.id && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {testResults[db.id] === true && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {testResults[db.id] === false && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection(db.id)}
                disabled={testingId === db.id}
              >
                Test
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(db)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(db)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{databaseToDelete?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === databaseToDelete?.id}
            >
              {isDeleting === databaseToDelete?.id && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

