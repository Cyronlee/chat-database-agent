import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAdminAccess()
  if ("error" in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    )
  }

  const { id } = await params
  const userId = BigInt(id)

  // Prevent admin from deleting themselves
  if (validation.session.id === userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    )
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await prisma.users.delete({
    where: { id: userId },
  })

  return NextResponse.json({ success: true })
}
