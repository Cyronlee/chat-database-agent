import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const SESSION_COOKIE_NAME = "auth_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const BCRYPT_SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export interface SessionUser {
  id: bigint
  email: string
  name: string
  isAdmin: boolean
}

/**
 * Create a Basic Auth token from email and password
 * Format: Basic base64(email:password)
 */
function createBasicAuthToken(email: string, password: string): string {
  const credentials = `${email}:${password}`
  const base64 = Buffer.from(credentials).toString("base64")
  return `Basic ${base64}`
}

/**
 * Parse a Basic Auth token and return email and password
 */
function parseBasicAuthToken(
  token: string
): { email: string; password: string } | null {
  if (!token.startsWith("Basic ")) {
    return null
  }

  try {
    const base64 = token.slice(6)
    const decoded = Buffer.from(base64, "base64").toString("utf-8")
    const colonIndex = decoded.indexOf(":")

    if (colonIndex === -1) {
      return null
    }

    const email = decoded.slice(0, colonIndex)
    const password = decoded.slice(colonIndex + 1)

    return { email, password }
  } catch {
    return null
  }
}

/**
 * Validate credentials against the database
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin,
  }
}

/**
 * Create a session by setting the Basic Auth token in a cookie
 */
export async function createSession(
  email: string,
  password: string
): Promise<string> {
  const token = createBasicAuthToken(email, password)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })

  return token
}

/**
 * Get the current session user from the cookie
 * Validates credentials on each request
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  const credentials = parseBasicAuthToken(token)
  if (!credentials) return null

  return await validateCredentials(credentials.email, credentials.password)
}

/**
 * Destroy the current session by deleting the cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Utility to check auth from request headers (for API routes)
 */
export async function getSessionFromRequest(): Promise<SessionUser | null> {
  return await getSession()
}

/**
 * Validate a Basic Auth token directly (for use in middleware)
 * Validates credentials against the database on each request
 */
export async function validateBasicAuthToken(
  token: string
): Promise<SessionUser | null> {
  const credentials = parseBasicAuthToken(token)
  if (!credentials) return null

  return await validateCredentials(credentials.email, credentials.password)
}
