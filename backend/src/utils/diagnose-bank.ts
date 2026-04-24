import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function diagnose() {
  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNo: 'INV-20260420-0001' },
    include: {
      payments: true,
      bank: true  // bankId linked to invoice
    }
  })

  if (!invoice) return console.log('Invoice not found')

  console.log('\n=== INVOICE ===')
  console.log(`  invoiceNo : ${invoice.invoiceNo}`)
  console.log(`  bankId    : ${(invoice as any).bankId || '(null)'}`)
  console.log(`  bank.name : ${(invoice as any).bank?.name || '(none)'}`)
  console.log(`  bank.coaId: ${(invoice as any).bank?.coaId || '(none)'}`)

  console.log('\n=== PAYMENTS ===')
  for (const p of invoice.payments) {
    console.log(`  ${p.paymentNo} | method: ${p.paymentMethod} | amount: ${p.amount}`)
  }

  // Check system accounts
  console.log('\n=== SYSTEM ACCOUNTS ===')
  const sysAccounts = await prisma.systemAccount.findMany({
    where: { key: { in: ['CASH_ACCOUNT', 'BANK_ACCOUNT', 'PETTY_CASH', 'ACCOUNTS_RECEIVABLE'] } },
    include: { coa: true }
  })
  for (const s of sysAccounts) {
    console.log(`  ${s.key.padEnd(25)} → ${s.coa?.code} ${s.coa?.name}`)
  }

  // Check all banks
  console.log('\n=== BANKS (Master) ===')
  const banks = await prisma.bank.findMany({ include: { coa: true } })
  for (const b of banks) {
    const bAny = b as any
    console.log(`  ${b.id} | ${bAny.name} | COA: ${bAny.coa?.code} ${bAny.coa?.name || '(no COA)'}`)
  }
}

diagnose().catch(console.error).finally(() => prisma.$disconnect())
