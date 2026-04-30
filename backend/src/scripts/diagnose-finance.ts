import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function diagnose() {
  console.log('--- DIAGNOSTIC START ---')
  
  // 1. Cari akun Hutang Supplier (2-1101)
  const accounts = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '2-1101' } }
  })
  
  console.log('Accounts found:', accounts.map(a => ({ id: a.id, code: a.code, name: a.name, type: a.accountType, clinicId: a.clinicId })))

  for (const acc of accounts) {
    // 2. Hitung total transaksi di JournalDetail
    const agg = await prisma.journalDetail.aggregate({
      where: { coaId: acc.id },
      _sum: { debit: true, credit: true }
    })
    
    console.log(`\nAccount: ${acc.code} - ${acc.name}`)
    console.log(`Opening Balance: ${acc.openingBalance}`)
    console.log(`Total Debit (Movement): ${agg._sum.debit || 0}`)
    console.log(`Total Credit (Movement): ${agg._sum.credit || 0}`)
    
    // 3. Cari transaksi terbaru
    const latest = await prisma.journalDetail.findFirst({
      where: { coaId: acc.id },
      include: { journalEntry: true },
      orderBy: { journalEntry: { date: 'desc' } }
    })
    
    if (latest) {
      console.log(`Latest Transaction: ${latest.journalEntry.description} | Date: ${latest.journalEntry.date} | ClinicId: ${latest.journalEntry.clinicId}`)
    } else {
      console.log('No transactions found for this account.')
    }
  }

  console.log('\n--- DIAGNOSTIC END ---')
}

diagnose()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
