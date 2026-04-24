import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function repair() {
  const invoiceNo = 'INV-20260420-0001'
  const paymentRef = 'PAY-706840-014'
  const targetCoaCode = '1-1101' // Petty Cash

  console.log(`\n=== Repairing Invoice ${invoiceNo} ===`)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch target COA ID
    const pettyCashCoa = await tx.chartOfAccount.findFirst({
      where: { code: targetCoaCode }
    })
    if (!pettyCashCoa) throw new Error(`COA ${targetCoaCode} not found`)
    console.log(`✅ Found Petty Cash COA: ${pettyCashCoa.id} (${pettyCashCoa.name})`)

    // 2. Fetch target Journal Entry Detail for the payment
    const paymentJournal = await tx.journalEntry.findFirst({
      where: { referenceNo: paymentRef },
      include: { details: true }
    })

    if (paymentJournal) {
      console.log(`✅ Found Journal Entry for ${paymentRef}`)
      // Find the detail that was previously recorded as Debit to some Bank
      const debitDetail = paymentJournal.details.find(d => d.debit > 0)
      if (debitDetail) {
        console.log(`🔄 Updating Debit detail from COA ID ${debitDetail.coaId} to ${pettyCashCoa.id}`)
        await tx.journalDetail.update({
          where: { id: debitDetail.id },
          data: { 
            coaId: pettyCashCoa.id,
            description: `Penerimaan CASH - Inv ${invoiceNo}` // Update description to reflect cash
          }
        })
      }
    } else {
      console.log(`⚠️ No journal entry found for ${paymentRef}, skipping GL update.`)
    }

    // 3. Update Invoice flags
    const updatedInvoice = await tx.invoice.update({
      where: { invoiceNo },
      data: {
        status: 'paid',
        isPosted: true,
        amountPaid: 132500
      }
    })
    console.log(`✅ Invoice status updated to PAID and POSTED.`)

    return updatedInvoice
  })

  console.log('\n=== REPAIR COMPLETED ===')
  console.log(JSON.stringify(result, null, 2))
}

repair().catch(console.error).finally(() => prisma.$disconnect())
