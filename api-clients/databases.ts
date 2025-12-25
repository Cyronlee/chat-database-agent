"use client"

import type { ExternalDatabase } from "@/stores/database-store"

export interface DatabaseInput {
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  sslEnabled: boolean
}

export interface DatabasesResponse {
  databases?: ExternalDatabase[]
  error?: string
}

export interface DatabaseResponse {
  database?: ExternalDatabase
  error?: string
}

export interface TestConnectionResponse {
  success: boolean
  message?: string
  error?: string
}

// SWR key generators
export function getDatabasesKey() {
  return "/api/databases"
}

export function getDatabaseKey(id: string) {
  return `/api/databases/${id}`
}

// Fetch functions
export async function getDatabases(): Promise<DatabasesResponse> {
  try {
    const response = await fetch("/api/databases")
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || "Failed to fetch databases" }
    }
    return data
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch databases",
    }
  }
}

export async function getDatabase(id: string): Promise<DatabaseResponse> {
  try {
    const response = await fetch(`/api/databases/${id}`)
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || "Failed to fetch database" }
    }
    return data
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch database",
    }
  }
}

export async function createDatabase(
  input: DatabaseInput
): Promise<DatabaseResponse> {
  try {
    const response = await fetch("/api/databases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || "Failed to create database" }
    }
    return data
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create database",
    }
  }
}

export async function updateDatabase(
  id: string,
  input: Partial<DatabaseInput>
): Promise<DatabaseResponse> {
  try {
    const response = await fetch(`/api/databases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || "Failed to update database" }
    }
    return data
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update database",
    }
  }
}

export async function deleteDatabase(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/databases/${id}`, {
      method: "DELETE",
    })
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || "Failed to delete database" }
    }
    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete database",
    }
  }
}

export async function testDatabaseConnection(
  input: DatabaseInput
): Promise<TestConnectionResponse> {
  try {
    const response = await fetch("/api/databases/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test connection",
    }
  }
}

export async function testExistingDatabaseConnection(
  id: string
): Promise<TestConnectionResponse> {
  try {
    const response = await fetch(`/api/databases/${id}/test`, {
      method: "POST",
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test connection",
    }
  }
}

