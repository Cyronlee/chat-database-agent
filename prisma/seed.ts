import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Check if admin user already exists
  let admin = await prisma.users.findUnique({
    where: { email: "admin@example.com" },
  })

  if (admin) {
    console.log("Admin user already exists, skipping user creation...")
  } else {
    // Hash the password
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Create admin user
    admin = await prisma.users.create({
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
  }

  // Add Northwind database connection
  const existingNorthwind = await prisma.external_databases.findFirst({
    where: { name: "Northwind" },
  })

  if (existingNorthwind) {
    console.log("Northwind database already exists, skipping...")
  } else {
    const northwindDb = await prisma.external_databases.create({
      data: {
        name: "Northwind",
        host: "localhost",
        port: 5434,
        database: "northwind",
        username: "postgres",
        password: "postgres",
        ssl_enabled: false,
        created_by: admin.id,
      },
    })

    console.log("Created Northwind database connection:", {
      id: northwindDb.id,
      name: northwindDb.name,
      host: northwindDb.host,
      port: northwindDb.port,
      database: northwindDb.database,
    })
  }

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

