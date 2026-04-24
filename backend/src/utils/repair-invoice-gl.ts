/**
 * DATA REPAIR SCRIPT - INV-20260420-0001
 * 
 * Masalah: Invoice ini memiliki total payment Rp 264.500 
 * padahal total invoice hanya Rp 132.500 (lebih bayar Rp 132.000).
 * 
 * Status invoice masih "unpaid" karena amountPaid = 264.500
 * Jurnal Piutang menjadi Credit > Debit, menyebabkan tampilan GL "double"
 * 
 * Opsi perbaikan:
 * 1. Hapus payment CASH PAY-680987-018 (dianggap input salah)
 * 2. Update amountPaid dan status invoice yang benar
 * 3. Hapus journal entry untuk payment yang dihapus
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function repairInvoice() {
  const INVOICE_NO = 'INV-20260420-0001'
  const DUPLICATE_PAYMENT_NO = 'PAY-680987-018' // CASH payment yang kelebihan

  console.log('🔧 DATA REPAIR: Starting repair for', INVOICE_NO, '\n')

  await prisma.$transaction(async (tx) => {
    // 1. Find invoice
    const invoice = await tx.invoice.findFirst({
      where: { invoiceNo: INVOICE_NO },
      include: { payments: true }
    })

    if (!invoice) throw new Error('Invoice not found')

    console.log(`📋 Invoice: ${invoice.invoiceNo}`)
    console.log(`   Total: Rp ${invoice.total}`)
    console.log(`   Amount Paid (before): Rp ${invoice.amountPaid}`)
    console.log(`   Status: ${invoice.status}`)
    console.log(`   Payments: ${invoice.payments.length}`)

    // 2. Find the duplicate cash payment
    const dupPayment = invoice.payments.find(p => p.paymentNo === DUPLICATE_PAYMENT_NO)
    if (!dupPayment) {
      console.log(`\n✅ Payment ${DUPLICATE_PAYMENT_NO} not found - may already be removed`)
      return
    }

    console.log(`\n🗑️  Removing duplicate payment: ${DUPLICATE_PAYMENT_NO}`)
    console.log(`   Method: ${dupPayment.paymentMethod.toUpperCase()}`)
    console.log(`   Amount: Rp ${dupPayment.amount}`)

    // 3. Delete the journal entry for this payment
    const paymentJE = await tx.journalEntry.findFirst({
      where: { referenceNo: DUPLICATE_PAYMENT_NO },
      include: { details: true }
    })

    if (paymentJE) {
      console.log(`\n🗑️  Deleting journal entry: ${paymentJE.id}`)
      for (const d of paymentJE.details) {
        console.log(`   D: ${d.debit} | C: ${d.credit} | ${d.description}`)
      }
      // Delete journal details first, then the entry
      await tx.journalDetail.deleteMany({ where: { journalEntryId: paymentJE.id } })
      await tx.journalEntry.delete({ where: { id: paymentJE.id } })
      console.log('   ✅ Journal entry deleted')
    } else {
      console.log(`\n⚠️  No journal entry found for ${DUPLICATE_PAYMENT_NO}`)
    }

    // 4. Delete the payment record
    await tx.payment.delete({ where: { id: dupPayment.id } })
    console.log(`\n✅ Payment ${DUPLICATE_PAYMENT_NO} deleted`)

    // 5. Recalculate and update invoice
    const remainingPayments = invoice.payments.filter(p => p.paymentNo !== DUPLICATE_PAYMENT_NO)
    const newAmountPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0)
    const newStatus = newAmountPaid >= invoice.total - 0.01 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'unpaid')

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newAmountPaid, status: newStatus }
    })

    console.log(`\n✅ Invoice updated:`)
    console.log(`   Amount Paid (after): Rp ${newAmountPaid}`)
    console.log(`   New Status: ${newStatus}`)
    console.log(`\n🎉 Repair complete! GL should now be balanced.`)
  })
}

repairInvoice()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
