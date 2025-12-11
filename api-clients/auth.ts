export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthStatus {
  authenticated: boolean
  authEnabled: boolean
  user: AuthUser | null
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    return { success: false, error: data.error || "Login failed" }
  }

  return { success: true, user: data.user }
}

export async function logout(): Promise<{ success: boolean }> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  })

  return response.json()
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await fetch("/api/auth/me")
  return response.json()
}

