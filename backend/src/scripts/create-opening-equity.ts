import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const mainClinic = await prisma.clinic.findFirst({ where: { isMain: true } })
  if (!mainClinic) {
    console.error('Main clinic not found')
    return
  }

  const equityAccount = await prisma.chartOfAccount.create({
    data: {
      code: '3999',
      name: 'Ekuitas Saldo Awal (Opening Balance Equity)',
      category: 'EQUITY',
      accountType: 'DETAIL',
      isActive: true,
      clinicId: mainClinic.id
    }
  })

  console.log(`✅ Created: ${equityAccount.name} (${equityAccount.code})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
