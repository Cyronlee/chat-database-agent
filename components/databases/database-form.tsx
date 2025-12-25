"use client"

import { useState, useEffect } from "react"
import { Loader2, Link2, Unlink, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { parseDatabaseUrl } from "@/lib/db-url-parser"
import type { DatabaseInput } from "@/api-clients/databases"

interface DatabaseFormProps {
  initialData?: Partial<DatabaseInput>
  onSubmit: (data: DatabaseInput) => Promise<void>
  onCancel: () => void
  onTestConnection?: (data: DatabaseInput) => Promise<boolean>
  isLoading?: boolean
  submitLabel?: string
}

export function DatabaseForm({
  initialData,
  onSubmit,
  onCancel,
  onTestConnection,
  isLoading = false,
  submitLabel = "Save",
}: DatabaseFormProps) {
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [connectionUrl, setConnectionUrl] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const [formData, setFormData] = useState<DatabaseInput>({
    name: initialData?.name || "",
    host: initialData?.host || "",
    port: initialData?.port || 5432,
    database: initialData?.database || "",
    username: initialData?.username || "",
    password: initialData?.password || "",
    sslEnabled: initialData?.sslEnabled || false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        host: initialData.host || "",
        port: initialData.port || 5432,
        database: initialData.database || "",
        username: initialData.username || "",
        password: initialData.password || "",
        sslEnabled: initialData.sslEnabled || false,
      })
    }
  }, [initialData])

  const handleUrlParse = () => {
    setUrlError(null)
    const parsed = parseDatabaseUrl(connectionUrl)
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        username: parsed.username,
        password: parsed.password,
        sslEnabled: parsed.sslEnabled,
      }))
      setShowUrlInput(false)
      setConnectionUrl("")
    } else {
      setUrlError("Invalid PostgreSQL URL format")
    }
  }

  const handleTestConnection = async () => {
    if (!onTestConnection) return
    setTestStatus("testing")
    const success = await onTestConnection(formData)
    setTestStatus(success ? "success" : "error")
    // Reset after 3 seconds
    setTimeout(() => setTestStatus("idle"), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const isFormValid =
    formData.name &&
    formData.host &&
    formData.port &&
    formData.database &&
    formData.username &&
    formData.password

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle for URL input */}
      <div className="flex items-center justify-between pb-2 border-b">
        <span className="text-sm text-muted-foreground">
          {showUrlInput ? "Paste connection URL" : "Manual configuration"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? (
            <>
              <Unlink className="h-4 w-4 mr-2" />
              Manual Input
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Use URL
            </>
          )}
        </Button>
      </div>

      {showUrlInput ? (
        <div className="space-y-2">
          <Label htmlFor="connectionUrl">PostgreSQL Connection URL</Label>
          <Textarea
            id="connectionUrl"
            value={connectionUrl}
            onChange={(e) => setConnectionUrl(e.target.value)}
            placeholder="postgresql://username:password@host:5432/database?sslmode=require"
            className="font-mono text-sm"
            rows={3}
          />
          {urlError && <p className="text-sm text-destructive">{urlError}</p>}
          <Button
            type="button"
            variant="secondary"
            onClick={handleUrlParse}
            disabled={!connectionUrl}
          >
            Parse URL
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="My Database"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, host: e.target.value }))
                }
                placeholder="localhost"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    port: parseInt(e.target.value) || 5432,
                  }))
                }
                placeholder="5432"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database Name</Label>
            <Input
              id="database"
              value={formData.database}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, database: e.target.value }))
              }
              placeholder="postgres"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="postgres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sslEnabled"
              checked={formData.sslEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, sslEnabled: checked }))
              }
            />
            <Label htmlFor="sslEnabled">Enable SSL</Label>
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        <div>
          {onTestConnection && !showUrlInput && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={!isFormValid || testStatus === "testing"}
            >
              {testStatus === "testing" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {testStatus === "success" && (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              )}
              {testStatus === "error" && (
                <XCircle className="h-4 w-4 mr-2 text-destructive" />
              )}
              {testStatus === "idle" && "Test Connection"}
              {testStatus === "testing" && "Testing..."}
              {testStatus === "success" && "Connected!"}
              {testStatus === "error" && "Failed"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isFormValid || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

