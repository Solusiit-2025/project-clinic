import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding COA Piutang B2B...')

  // 1. Create Piutang Corporate B2B (1-1202) under Piutang (1-1200)
  const coa = await prisma.chartOfAccount.upsert({
    where: { code: '1-1202' },
    update: {},
    create: {
      code: '1-1202',
      name: 'Piutang Corporate B2B',
      accountType: 'DETAIL',
      category: 'ASSET',
      isActive: true,
      // Parent is 1-1200 (Piutang)
    }
  })

  // get parent 1-1200 if exists
  const parent = await prisma.chartOfAccount.findUnique({ where: { code: '1-1200' } })
  if (parent) {
    await prisma.chartOfAccount.update({
      where: { code: '1-1202' },
      data: { parentId: parent.id }
    })
  }

  // 2. Add SystemAccount mapping for ACCOUNTS_RECEIVABLE_B2B
  const existingSys = await prisma.systemAccount.findFirst({
    where: { key: 'ACCOUNTS_RECEIVABLE_B2B', clinicId: null }
  })
  if (existingSys) {
    await prisma.systemAccount.update({
      where: { id: existingSys.id },
      data: { coaId: coa.id }
    })
  } else {
    await prisma.systemAccount.create({
      data: {
        key: 'ACCOUNTS_RECEIVABLE_B2B',
        name: 'Piutang Corporate B2B',
        coaId: coa.id
      }
    })
  }

  console.log('Done! 1-1202 Piutang Corporate B2B created and mapped to ACCOUNTS_RECEIVABLE_B2B.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
