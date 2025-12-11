import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const BCRYPT_SALT_ROUNDS = 10

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

async function createUser(name: string, email: string, password: string) {
  const hashedPassword = await hashPassword(password)

  const user = await prisma.users.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      row_updated_at: new Date(),
    },
    create: {
      name,
      email,
      password: hashedPassword,
    },
  })

  console.log(`User created/updated: ${user.email} (ID: ${user.id})`)
  return user
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length < 3) {
  console.log("Usage: npx tsx scripts/create-user.ts <name> <email> <password>")
  console.log(
    "Example: npx tsx scripts/create-user.ts 'John Doe' john@example.com password123"
  )
  process.exit(1)
}

const [name, email, password] = args

createUser(name, email, password)
  .then(() => {
    console.log("Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error creating user:", error)
    process.exit(1)
  })
