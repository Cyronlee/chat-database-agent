import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const SESSION_COOKIE_NAME = "auth_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const BCRYPT_SALT_ROUNDS = 10

export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true"
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString("base64url")
}

// Simple in-memory session store (for production, use Redis or database)
const sessionStore = new Map<
  string,
  { userId: bigint; email: string; name: string; expiresAt: number }
>()

export interface SessionUser {
  id: bigint
  email: string
  name: string
}

export async function createSession(user: {
  id: bigint
  email: string
  name: string
}): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000

  sessionStore.set(token, {
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt,
  })

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

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  const session = sessionStore.get(token)
  if (!session) return null

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token)
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    sessionStore.delete(token)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

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
  }
}

// Utility to check auth from request headers (for API routes)
export async function getSessionFromRequest(): Promise<SessionUser | null> {
  return await getSession()
}
