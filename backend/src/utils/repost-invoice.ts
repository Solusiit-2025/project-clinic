import { PrismaClient } from '@prisma/client'
// We replicate the logic from finance.controller.ts to ensure it uses the NEW support for Pay->Post
const prisma = new PrismaClient()

async function repost() {
    const invoiceNo = 'INV-20260420-0001'
    console.log(`\n=== Reposting Invoice ${invoiceNo} ===`)

    // 1. Reset state to allow posting
    await prisma.invoice.update({
        where: { invoiceNo },
        data: { isPosted: false }
    })
    console.log('✅ Reset isPosted to false')

    // 2. Resolve Clinic ID
    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNo },
        include: { items: true, payments: true }
    })
    if (!invoice) throw new Error('Invoice not found')
    const targetClinicId = invoice.clinicId
    
    // 3. Resolve AR Account from System Accounts
    const arSys = await prisma.systemAccount.findFirst({
        where: { key: 'ACCOUNTS_RECEIVABLE', OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
        include: { coa: true },
        orderBy: { clinicId: 'desc' }
    })
    const arAccount = arSys?.coa || await prisma.chartOfAccount.findFirst({ where: { code: '1-1201' } })
    if (!arAccount) throw new Error('AR Account not found')

    // 4. Create Accrual and Backfill Journals (Transaction)
    await prisma.$transaction(async (tx) => {
        // A. Accrual Entry
        await tx.journalEntry.create({
            data: {
                date: invoice.invoiceDate,
                description: `Pengakuan Piutang & Pendapatan - Inv #${invoice.invoiceNo}`,
                referenceNo: invoice.invoiceNo,
                entryType: 'SYSTEM',
                clinicId: (targetClinicId as any),
                details: {
                    create: [
                        { coaId: arAccount.id, debit: invoice.total, credit: 0, description: `Piutang Pelanggan - Invoice ${invoice.invoiceNo}` },
                        // For simplicity in this script, we map all to Consultation Revenue (4-1101) or similar if needed
                        // But let's try to be accurate
                        { coaId: (await tx.chartOfAccount.findFirst({ where: { code: '4-1101' } }))!.id, debit: 0, credit: invoice.total, description: `Pendapatan Jasa - Inv ${invoiceNo}` }
                    ]
                }
            }
        })
        console.log('✅ Accrual journal created (AR vs Revenue)')

        // B. Backfill Payment Journals
        for (const p of invoice.payments) {
            // Find Petty Cash COA as requested by user
            const pettyCashCoa = await tx.chartOfAccount.findFirst({ where: { code: '1-1101' } })
            if (!pettyCashCoa) throw new Error('Petty Cash COA not found')

            await tx.journalEntry.create({
                data: {
                    date: p.paymentDate,
                    description: `Pelunasan - Invoice #${invoiceNo}`,
                    referenceNo: p.paymentNo,
                    entryType: 'SYSTEM',
                    clinicId: (targetClinicId as any),
                    details: {
                        create: [
                            { coaId: pettyCashCoa.id, debit: p.amount, credit: 0, description: `Penerimaan CASH - Inv ${invoiceNo}` },
                            { coaId: arAccount.id, debit: 0, credit: p.amount, description: `Pengurangan Piutang - Inv ${invoiceNo}` }
                        ]
                    }
                }
            })
            console.log(`✅ Payment journal created for ${p.paymentNo} (Petty Cash vs AR)`)
        }

        // C. Mark as posted and paid
        await tx.invoice.update({
            where: { id: invoice.id },
            data: { isPosted: true, status: 'paid' }
        })
    })

    console.log('\n=== REPOSTING COMPLETED ===')
}

repost().catch(console.error).finally(() => prisma.$disconnect())
