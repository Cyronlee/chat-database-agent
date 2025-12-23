import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Check if admin user already exists
  const existingAdmin = await prisma.users.findUnique({
    where: { email: "admin@example.com" },
  })

  if (existingAdmin) {
    console.log("Admin user already exists, skipping...")
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash("123456", 10)

  // Create admin user
  const admin = await prisma.users.create({
    data: {
      name: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      is_admin: true,
    },
  })

  console.log("Created admin user:", {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    is_admin: admin.is_admin,
  })

  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("Error during seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

