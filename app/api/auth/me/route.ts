import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id.toString(),
      email: session.email,
      name: session.name,
      isAdmin: session.isAdmin,
    },
  })
}
