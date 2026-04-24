import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding Default System Accounts Mapping Keys ---')

  const defaults = [
    { key: 'ACCOUNTS_RECEIVABLE', name: 'Piutang Usaha (AR)' },
    { key: 'SALES_REVENUE', name: 'Pendapatan Jasa/Produk' },
    { key: 'CASH_ACCOUNT', name: 'Kas Utama / Teller' },
    { key: 'TAX_PAYABLE', name: 'Hutang Pajak (PPN)' },
    { key: 'INVENTORY_ACCOUNT', name: 'Persediaan Obat & BHP' },
    { key: 'RETAINED_EARNINGS', name: 'Laba Ditahan (Equity Transition)' },
  ]

  for (const item of defaults) {
    const existing = await prisma.systemAccount.findFirst({
      where: { key: item.key }
    })

    if (!existing) {
      // Find a likely candidate for COA if possible
      let coa = await prisma.chartOfAccount.findFirst({
        where: {
          OR: [
            { code: { startsWith: item.key === 'ACCOUNTS_RECEIVABLE' ? '1-101' : '4-1' } },
            { name: { contains: item.key.split('_')[0], mode: 'insensitive' } }
          ],
          accountType: 'DETAIL'
        }
      })

      // Fallback to ANY detail account if no match (must satisfy FK)
      if (!coa) {
          coa = await prisma.chartOfAccount.findFirst({ where: { accountType: 'DETAIL' } })
      }

      if (coa) {
          await prisma.systemAccount.create({
            data: {
              key: item.key,
              name: item.name,
              coaId: coa.id,
            }
          })
          console.log(`[NEW] Key ${item.key} created mapping to ${coa.code}.`)
      } else {
          console.log(`[ERROR] Key ${item.key} could not be created: No DETAIL COA found in DB.`)
      }
    } else {
      console.log(`[SKIP] Key ${item.key} already exists.`)
    }
  }

  console.log('--- Seeding Completed ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
