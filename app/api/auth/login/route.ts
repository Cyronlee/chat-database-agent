import { NextResponse } from "next/server"
import { validateCredentials, createSession, isAuthEnabled } from "@/lib/auth"

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Auth is disabled" }, { status: 400 })
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  const user = await validateCredentials(email, password)

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }

  await createSession(user)

  return NextResponse.json({
    success: true,
    user: {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
    },
  })
}

