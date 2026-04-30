import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'nurse@yasfina.com'
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.log(`User with email ${email} not found.`)
    return
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  })

  const isPasswordMatch = await bcrypt.compare('nurse123', user.password)
  console.log('Password "nurse123" match:', isPasswordMatch)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
