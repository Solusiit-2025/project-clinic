import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function nuclearReset(invoiceNo: string) {
    console.log(`\n=== ☢️ NUCLEAR RESET: ${invoiceNo} ===`)
    
    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNo },
        include: { payments: true }
    })

    if (!invoice) {
        console.log(`❌ Invoice not found`)
        return
    }

    // 1. Wipe all payments (Returning to 0 paid state)
    console.log(`🗑️ Deleting ${invoice.payments.length} payment records...`)
    for (const p of invoice.payments) {
        // Also wipe any journals tied to these payments
        const journals = await prisma.journalEntry.findMany({
            where: { referenceNo: p.paymentNo }
        })
        for (const j of journals) {
            await prisma.journalDetail.deleteMany({ where: { journalEntryId: j.id } })
            await prisma.journalEntry.delete({ where: { id: j.id } })
        }
        await prisma.payment.delete({ where: { id: p.id } })
    }

    // 2. Wipe main accrual journal
    const mainJournals = await prisma.journalEntry.findMany({
        where: { referenceNo: invoice.invoiceNo }
    })
    console.log(`🗑️ Deleting ${mainJournals.length} main journal entries...`)
    for (const mj of mainJournals) {
        await prisma.journalDetail.deleteMany({ where: { journalEntryId: mj.id } })
        await prisma.journalEntry.delete({ where: { id: mj.id } })
    }

    // 3. Reset Invoice state
    console.log(`🔧 Resetting invoice totals and status...`)
    await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
            amountPaid: 0,
            status: 'unpaid',
            isPosted: false
        }
    })

    console.log(`✅ RESET COMPLETE. ${invoiceNo} is now UNPAID with 0 payments.`)
}

const target = process.argv[2] || 'INV-20260420-0002'
nuclearReset(target).catch(console.error).finally(() => prisma.$disconnect())
