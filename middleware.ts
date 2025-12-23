import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const PUBLIC_PATHS = ["/login", "/api/auth"]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )
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
async function validateCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) return false

  return await bcrypt.compare(password, user.password)
}

/**
 * Validate a Basic Auth token by checking credentials against the database
 */
async function validateBasicAuthToken(token: string): Promise<boolean> {
  const credentials = parseBasicAuthToken(token)
  if (!credentials) return false

  return await validateCredentials(credentials.email, credentials.password)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get("auth_session")

  // For all protected routes, check session cookie
  if (!sessionCookie) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Redirect to login page for non-API routes
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate the Basic Auth token against the database
  const isValid = await validateBasicAuthToken(sessionCookie.value)
  if (!isValid) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }
    // Redirect to login page for non-API routes
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
