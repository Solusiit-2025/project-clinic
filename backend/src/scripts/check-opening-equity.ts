import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const equityAccount = await prisma.chartOfAccount.findFirst({
    where: {
      OR: [
        { name: { contains: 'Opening Balance Equity', mode: 'insensitive' } },
        { name: { contains: 'Saldo Awal', mode: 'insensitive' } },
        { code: '3999' }
      ]
    }
  })

  if (equityAccount) {
    console.log(`Found: ${equityAccount.name} (${equityAccount.code}) - ID: ${equityAccount.id}`)
  } else {
    console.log('NOT_FOUND')
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
