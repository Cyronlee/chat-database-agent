export interface AdminUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string | null
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  isAdmin?: boolean
}

export async function getUsers(): Promise<{ users: AdminUser[] }> {
  const response = await fetch("/api/admin/users")
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch users")
  }
  return response.json()
}

export async function createUser(
  payload: CreateUserPayload
): Promise<{ success: boolean; user: AdminUser }> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create user")
  }

  return response.json()
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete user")
  }

  return response.json()
}

