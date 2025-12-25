"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DatabaseList } from "@/components/databases/database-list"
import { DatabaseForm } from "@/components/databases/database-form"
import {
  getDatabases,
  getDatabasesKey,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  testDatabaseConnection,
  testExistingDatabaseConnection,
} from "@/api-clients/databases"
import type { DatabaseInput } from "@/api-clients/databases"
import type { ExternalDatabase } from "@/stores/database-store"
import { toast } from "sonner"

export default function DatabasesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingDatabase, setEditingDatabase] = useState<ExternalDatabase | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR(getDatabasesKey(), getDatabases)

  const databases = data?.databases || []

  const handleCreate = async (input: DatabaseInput) => {
    setIsSubmitting(true)
    const result = await createDatabase(input)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Database connection created")
      setIsCreateDialogOpen(false)
      mutate(getDatabasesKey())
    }
  }

  const handleUpdate = async (input: DatabaseInput) => {
    if (!editingDatabase) return

    setIsSubmitting(true)
    const result = await updateDatabase(editingDatabase.id, input)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Database connection updated")
      setEditingDatabase(null)
      mutate(getDatabasesKey())
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteDatabase(id)
    setDeletingId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Database connection deleted")
      mutate(getDatabasesKey())
    }
  }

  const handleTestConnection = async (input: DatabaseInput): Promise<boolean> => {
    const result = await testDatabaseConnection(input)
    if (result.success) {
      toast.success("Connection successful")
      return true
    } else {
      toast.error(result.error || "Connection failed")
      return false
    }
  }

  const handleTestExistingConnection = async (id: string): Promise<boolean> => {
    const result = await testExistingDatabaseConnection(id)
    if (result.success) {
      toast.success("Connection successful")
      return true
    } else {
      toast.error(result.error || "Connection failed")
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Failed to load databases</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Database Connections</h1>
          <p className="text-muted-foreground">
            Manage your external database connections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Database
        </Button>
      </div>

      <div className="border rounded-lg">
        <DatabaseList
          databases={databases}
          onEdit={setEditingDatabase}
          onDelete={handleDelete}
          onTestConnection={handleTestExistingConnection}
          isDeleting={deletingId || undefined}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Database Connection</DialogTitle>
            <DialogDescription>
              Add a new PostgreSQL database connection. You can paste a connection URL
              or enter the details manually.
            </DialogDescription>
          </DialogHeader>
          <DatabaseForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            onTestConnection={handleTestConnection}
            isLoading={isSubmitting}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingDatabase}
        onOpenChange={(open) => !open && setEditingDatabase(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Database Connection</DialogTitle>
            <DialogDescription>
              Update the database connection settings.
            </DialogDescription>
          </DialogHeader>
          {editingDatabase && (
            <DatabaseForm
              initialData={{
                name: editingDatabase.name,
                host: editingDatabase.host,
                port: editingDatabase.port,
                database: editingDatabase.database,
                username: "",
                password: "",
                sslEnabled: editingDatabase.sslEnabled,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingDatabase(null)}
              onTestConnection={handleTestConnection}
              isLoading={isSubmitting}
              submitLabel="Update"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

