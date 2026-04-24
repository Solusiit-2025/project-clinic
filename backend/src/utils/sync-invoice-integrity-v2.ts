import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function syncAllInvoices() {
    console.log(`\n=== 🔄 STARTING GLOBAL INVOICE INTEGRITY SYNC ===`)
    
    const invoices = await prisma.invoice.findMany({
        include: { payments: true }
    })

    let fixedCount = 0
    for (const inv of invoices) {
        const actualPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0)
        let targetStatus = 'unpaid'
        
        if (actualPaid >= (Number(inv.total) - 0.01)) {
            targetStatus = 'paid'
        } else if (actualPaid > 0) {
            targetStatus = 'partial'
        }

        if (inv.amountPaid !== actualPaid || inv.status !== targetStatus) {
            console.log(`🔧 Fixing ${inv.invoiceNo}:`)
            console.log(`   - AmountPaid: ${inv.amountPaid} -> ${actualPaid}`)
            console.log(`   - Status: ${inv.status} -> ${targetStatus}`)
            
            await prisma.invoice.update({
                where: { id: inv.id },
                data: {
                    amountPaid: actualPaid,
                    status: targetStatus
                }
            })
            fixedCount++
        }
    }

    console.log(`\n✅ SYNC COMPLETE. Fixed ${fixedCount} invoices.`)
}

syncAllInvoices()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
