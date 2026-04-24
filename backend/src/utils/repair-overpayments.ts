import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function repairInvoice(invoiceNo: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNo },
        include: { payments: { orderBy: { paymentDate: 'asc' } } }
    })

    if (!invoice) {
        console.log(`❌ Invoice ${invoiceNo} not found.`)
        return
    }

    console.log(`\n=== 🔧 REPAIRING INVOICE: ${invoiceNo} ===`)
    console.log(`Current State: Total=${invoice.total}, AmountPaid=${invoice.amountPaid}, Status=${invoice.status}`)

    if (invoice.payments.length > 1 && invoice.total === 110000 && invoice.amountPaid === 220000) {
        console.log(`⚠️ Overpayment detected. Retaining first payment, deleting others...`)
        
        // Keep the first payment, delete subsequent ones
        const [first, ...duplicates] = invoice.payments
        for (const dup of duplicates) {
            console.log(`🗑️ Deleting duplicate payment: ${dup.paymentNo} (Rp ${dup.amount})`)
            await prisma.payment.delete({ where: { id: dup.id } })
        }

        // Correct the invoice state
        const updated = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                amountPaid: first.amount,
                status: first.amount >= (Number(invoice.total) - 0.01) ? 'paid' : 'partial'
            }
        })
        console.log(`✅ Invoice Repaired! New State: AmountPaid=${updated.amountPaid}, Status=${updated.status}`)
        
        // ALSO: Clean up any duplicate journals that might have been created by previous buggy runs
        const matchRefs = duplicates.map(d => d.paymentNo)
        const journalCleanup = await prisma.journalEntry.findMany({
            where: { referenceNo: { in: matchRefs } }
        })
        for (const je of journalCleanup) {
            console.log(`🗑️ Cleaning up orphaned journal for duplicate payment: ${je.referenceNo}`)
            await prisma.journalDetail.deleteMany({ where: { journalEntryId: je.id } })
            await prisma.journalEntry.delete({ where: { id: je.id } })
        }
    } else {
        console.log(`ℹ️ No automatic repair needed for this specific state.`)
    }
}

const target = process.argv[2] || 'INV-20260420-0002'
repairInvoice(target).catch(console.error).finally(() => prisma.$disconnect())
