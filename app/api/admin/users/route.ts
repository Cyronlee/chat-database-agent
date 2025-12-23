import { NextResponse } from "next/server"
import { getSession, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function validateAdminAccess() {
  const session = await getSession()
  if (!session) {
    return { error: "Unauthorized", status: 401 }
  }

  if (!session.isAdmin) {
    return { error: "Forbidden: Admin access required", status: 403 }
  }

  return { session }
}

export async function GET() {
  const validation = await validateAdminAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const users = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      is_admin: true,
      row_created_at: true,
    },
    orderBy: {
      row_created_at: "desc",
    },
  })

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      createdAt: user.row_created_at?.toISOString() ?? null,
    })),
  })
}

export async function POST(req: Request) {
  const validation = await validateAdminAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { name, email, password, isAdmin } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    )
  }

  // Check if user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    )
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      is_admin: isAdmin ?? false,
    },
  })

  return NextResponse.json({
    success: true,
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      createdAt: user.row_created_at?.toISOString() ?? null,
    },
  })
}
