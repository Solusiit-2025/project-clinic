import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create clinics first
  console.log('Seeding clinics...')
  
  let mainClinic = await prisma.clinic.findFirst({ where: { isMain: true } })
  
  if (!mainClinic) {
    mainClinic = await prisma.clinic.create({
      data: {
        name: 'Klinik Yasfina Pusat',
        code: 'K001',
        address: 'Jl. Contoh No. 123, Jakarta',
        phone: '021-12345678',
        email: 'info@klinikterpadu.com',
        isMain: true,
        isActive: true,
      },
    })
    console.log(`✅ Main clinic created: ${mainClinic.name}`)
  } else {
    console.log(`ℹ️ Main clinic already exists: ${mainClinic.name}`)
  }

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
      const user = await prisma.user.create({
        data: { ...u, role: u.role as Role, password: hashedPassword, isActive: true }
      })
      console.log(`✅ User created: ${u.email} (${u.role})`)
      console.log(`   Password: ${u.password}`)
      
      // Link user to main clinic
      await prisma.userClinic.create({
        data: {
          userId: user.id,
          clinicId: mainClinic.id,
        },
      })
      console.log(`   ✅ Linked to clinic: ${mainClinic.name}`)
    } else {
      console.log(`ℹ️ User already exists: ${u.email}`)
      
      // Check if user is linked to clinic, if not link them
      const userClinic = await prisma.userClinic.findUnique({
        where: {
          userId_clinicId: {
            userId: existing.id,
            clinicId: mainClinic.id,
          },
        },
      })
      
      if (!userClinic) {
        await prisma.userClinic.create({
          data: {
            userId: existing.id,
            clinicId: mainClinic.id,
          },
        })
        console.log(`   ✅ Linked to clinic: ${mainClinic.name}`)
      }
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
