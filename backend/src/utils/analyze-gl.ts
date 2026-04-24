import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function analyze() {
  // Find all journal entries related to the problematic invoice
  const entries = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { referenceNo: { contains: 'INV-20260420-0001' } },
        { referenceNo: { contains: 'PAY-680987' } },
        { referenceNo: { contains: 'PAY-706840' } },
      ]
    },
    include: { details: { include: { coa: true } } },
    orderBy: { createdAt: 'asc' }
  })

  console.log('\n=== JOURNAL ENTRIES FOR INV-20260420-0001 ===\n')
  let totalDebit = 0
  let totalCredit = 0

  for (const e of entries) {
    console.log(`--- JE ID: ${e.id}`)
    console.log(`    Ref: ${e.referenceNo} | Type: ${e.entryType}`)
    console.log(`    Created: ${e.createdAt.toISOString()}`)
    for (const d of e.details) {
      totalDebit += d.debit
      totalCredit += d.credit
      const dStr = d.debit > 0 ? `D: ${d.debit}` : `           C: ${d.credit}`
      console.log(`    [${d.coa.code}] ${d.coa.name.padEnd(40)} | ${dStr} | ${d.description}`)
    }
    console.log()
  }

  console.log(`\nTotal Debit : ${totalDebit}`)
  console.log(`Total Credit: ${totalCredit}`)
  console.log(`Balanced    : ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ YES' : '❌ NO (diff: ' + (totalDebit - totalCredit) + ')'}`)
}

analyze()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
