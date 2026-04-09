import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting Multi-Clinic Migration Script ---')

  // 1. Create Default Clinic
  const mainClinic = await prisma.clinic.upsert({
    where: { code: 'K001' },
    update: {},
    create: {
      name: 'Klinik Utama Pusat',
      code: 'K001',
      address: 'Jl. Utama No. 1, Jakarta',
      phone: '021-12345678',
      email: 'pusat@klinik.id',
    },
  })
  console.log(`Clinic created: ${mainClinic.name} (${mainClinic.id})`)

  // 2. Link all existing Users to this clinic
  const users = await prisma.user.findMany()
  for (const user of users) {
    await prisma.userClinic.upsert({
      where: { userId_clinicId: { userId: user.id, clinicId: mainClinic.id } },
      update: {},
      create: { userId: user.id, clinicId: mainClinic.id },
    })
  }
  console.log(`Linked ${users.length} users to clinic.`)

  // 3. Update existing records with the new clinicId
  const tablesToUpdate = [
    'department',
    'registration',
    'appointment',
    'queueNumber',
    'medicalRecord',
    'inventory',
    'product',
    'asset',
    'invoice',
    'expense',
    'financialReport',
    'siteSetting',
    'service',
    'doctorSchedule',
  ]

  for (const table of tablesToUpdate) {
    const count = await (prisma as any)[table].updateMany({
      where: { clinicId: null },
      data: { clinicId: mainClinic.id },
    })
    console.log(`Updated ${count.count} records in ${table}.`)
  }

  console.log('--- Migration Script Finished Successfully ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
