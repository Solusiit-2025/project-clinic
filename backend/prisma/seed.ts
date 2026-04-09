import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const users = [
    {
      email: 'superadmin@clinic.com',
      username: 'superadmin',
      password: 'superadmin123',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
    },
    {
      email: 'admin@clinic.com',
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'ADMIN',
    },
    {
      email: 'dr.fauzi@clinic.com',
      username: 'drfauzi',
      password: 'doctor123',
      name: 'dr. Ahmad Fauzi',
      role: 'DOCTOR',
    }
  ]

  console.log('Seeding master users...')

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 10)
      await prisma.user.create({
        data: { ...u, role: u.role as Role, password: hashedPassword, isActive: true }
      })
      console.log(`✅ User created: ${u.email} (${u.role})`)
      console.log(`   Password: ${u.password}`)
    } else {
      console.log(`ℹ️ User already exists: ${u.email}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
