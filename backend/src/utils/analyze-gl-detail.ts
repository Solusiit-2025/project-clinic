import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function analyze() {
  // Find invoice and all its payments
  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNo: 'INV-20260420-0001' },
    include: { payments: true, items: true }
  })

  if (!invoice) {
    console.log('Invoice tidak ditemukan!')
    return
  }

  console.log('\n=== INVOICE STATUS ===')
  console.log(`Invoice No : ${invoice.invoiceNo}`)
  console.log(`Total      : ${invoice.total}`)
  console.log(`Amount Paid: ${invoice.amountPaid}`)
  console.log(`Status     : ${invoice.status}`)
  console.log(`Is Posted  : ${invoice.isPosted}`)
  
  console.log('\n=== PAYMENTS ===')
  let totalPayments = 0
  for (const p of invoice.payments) {
    totalPayments += p.amount
    console.log(`  ${p.paymentNo} | ${p.paymentMethod.toUpperCase()} | Rp ${p.amount} | ${p.paymentDate.toISOString()}`)
  }
  console.log(`  TOTAL PAYMENTS: Rp ${totalPayments}`)
  console.log(`  INVOICE TOTAL : Rp ${invoice.total}`)
  console.log(`  DIFFERENCE    : Rp ${totalPayments - invoice.total} ${totalPayments > invoice.total ? '⚠️ LEBIH BAYAR!' : '✅ OK'}`)

  console.log('\n=== JOURNAL ENTRY BALANCE CHECK ===')
  const allJE = await prisma.journalEntry.findMany({
    where: { referenceNo: { in: [invoice.invoiceNo, ...invoice.payments.map(p => p.paymentNo)] } },
    include: { details: true }
  })

  const accountMap = new Map<string, { debit: number; credit: number; name: string }>()
  
  for (const je of allJE) {
    for (const d of je.details) {
      const coa = await prisma.chartOfAccount.findUnique({ where: { id: d.coaId } })
      const key = d.coaId
      const existing = accountMap.get(key) || { debit: 0, credit: 0, name: coa?.name || d.coaId }
      existing.debit += d.debit
      existing.credit += d.credit
      accountMap.set(key, existing)
    }
  }

  console.log('\n  Running Ledger per Account:')
  let grandDebit = 0, grandCredit = 0
  for (const [, v] of accountMap) {
    const net = v.debit - v.credit
    grandDebit += v.debit
    grandCredit += v.credit
    console.log(`  ${v.name.padEnd(40)} | D: ${v.debit.toFixed(0).padStart(8)} | C: ${v.credit.toFixed(0).padStart(8)} | Net: ${net.toFixed(0)}`)
  }
  console.log(`\n  GRAND TOTAL: D=${grandDebit} | C=${grandCredit} | ${Math.abs(grandDebit - grandCredit) < 0.01 ? '✅ BALANCED' : '❌ UNBALANCED'}`)
}

analyze()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
