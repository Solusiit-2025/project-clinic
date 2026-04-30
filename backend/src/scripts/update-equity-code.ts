import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const account = await prisma.chartOfAccount.findFirst({
    where: { 
      OR: [
        { code: '3999' },
        { name: { contains: 'Opening Balance Equity' } }
      ]
    }
  })

  if (account) {
    await prisma.chartOfAccount.update({
      where: { id: account.id },
      data: { code: '3-10101' }
    })
    console.log(`✅ Account updated to code: 3-10101`)
  } else {
    // If not found, create it with the correct code
    const mainClinic = await prisma.clinic.findFirst({ where: { isMain: true } })
    if (mainClinic) {
      await prisma.chartOfAccount.create({
        data: {
          code: '3-10101',
          name: 'Ekuitas Saldo Awal (Opening Balance Equity)',
          category: 'EQUITY',
          accountType: 'DETAIL',
          isActive: true,
          clinicId: mainClinic.id
        }
      })
      console.log(`✅ Account created with code: 3-10101`)
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
