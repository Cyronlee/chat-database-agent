import { NextResponse } from "next/server"
import { getSession, isAuthEnabled } from "@/lib/auth"

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({
      authenticated: true,
      authEnabled: false,
      user: null,
    })
  }

  const session = await getSession()

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      authEnabled: true,
      user: null,
    })
  }

  return NextResponse.json({
    authenticated: true,
    authEnabled: true,
    user: {
      id: session.id.toString(),
      email: session.email,
      name: session.name,
    },
  })
}

