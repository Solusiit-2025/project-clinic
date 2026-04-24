import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function nuclearCleanup() {
    const invoiceNo = 'INV-20260420-0001'
    const paymentNo = 'PAY-706840-014'

    console.log(`\n=== ☢️ NUCLEAR CLEANUP OPERATION FOR ${invoiceNo} ===`)

    await prisma.$transaction(async (tx) => {
        // 1. DISCOVERY: Find ALL unique JournalEntry IDs associated with these strings
        console.log('🔍 Identifying all associated journals...')
        
        const detailsMatching = await tx.journalDetail.findMany({
            where: {
                OR: [
                    { description: { contains: invoiceNo } },
                    { description: { contains: paymentNo } },
                    { journalEntry: { referenceNo: invoiceNo } },
                    { journalEntry: { referenceNo: paymentNo } },
                    { journalEntry: { description: { contains: invoiceNo } } },
                    { journalEntry: { description: { contains: paymentNo } } }
                ]
            },
            select: { journalEntryId: true }
        })

        const journalIds = Array.from(new Set(detailsMatching.map(d => d.journalEntryId)))
        console.log(`🔎 Found ${journalIds.length} journals to purge.`)

        // 2. PURGE: Delete them all
        for (const id of journalIds) {
            console.log(`🗑️ Purging Journal: ${id}`)
            await tx.journalDetail.deleteMany({ where: { journalEntryId: id } })
            await tx.journalEntry.delete({ where: { id: id } })
        }

        // 3. FETCH DATA
        const invoice = await tx.invoice.findUnique({
            where: { invoiceNo },
            include: { clinic: true }
        })
        if (!invoice) throw new Error(`Invoice ${invoiceNo} not found in database`)
        const clinicId = invoice.clinicId

        // 4. RECREATE ACCRUAL (4-1501 & 4-1301)
        console.log('📝 Recreating Definitive Accrual Journal...')
        const arCoa = await tx.chartOfAccount.findFirst({ where: { code: '1-1201' } })
        const adminCoa = await tx.chartOfAccount.findFirst({ where: { code: '4-1501' } })
        const obatCoa = await tx.chartOfAccount.findFirst({ where: { code: '4-1301' } })

        if (!arCoa || !adminCoa || !obatCoa) throw new Error('COAs not found (1-1201, 4-1501, 4-1301)')

        await tx.journalEntry.create({
            data: {
                date: invoice.invoiceDate,
                description: `Pengakuan Piutang & Pendapatan - Inv #${invoiceNo}`,
                referenceNo: invoiceNo,
                entryType: 'SYSTEM',
                clinicId: (clinicId as any),
                details: {
                    create: [
                        { coaId: arCoa.id, debit: 132500, credit: 0, description: `Piutang Pelanggan - Invoice ${invoiceNo}` },
                        { coaId: adminCoa.id, debit: 0, credit: 50000, description: `Pendapatan Biaya Administrasi & Kartu - Inv ${invoiceNo}` },
                        { coaId: obatCoa.id, debit: 0, credit: 82500, description: `Pendapatan Penjualan Obat-obatan - Inv ${invoiceNo}` }
                    ]
                }
            }
        })

        // 5. RECREATE SETTLEMENT (1-1101)
        console.log('📝 Recreating Definitive Settlement Journal...')
        const pettyCashCoa = await tx.chartOfAccount.findFirst({ where: { code: '1-1101' } })
        if (!pettyCashCoa) throw new Error('Petty Cash COA not found (1-1101)')

        await tx.journalEntry.create({
            data: {
                date: new Date('2026-04-20T05:08:26.841Z'),
                description: `Pelunasan - Invoice #${invoiceNo}`,
                referenceNo: paymentNo,
                entryType: 'SYSTEM',
                clinicId: (clinicId as any),
                details: {
                    create: [
                        { coaId: pettyCashCoa.id, debit: 132500, credit: 0, description: `Penerimaan Pembayaran - Inv ${invoiceNo}` },
                        { coaId: arCoa.id, debit: 0, credit: 132500, description: `Pengurangan Piutang - Inv ${invoiceNo}` }
                    ]
                }
            }
        })

        // 6. UPDATE STATE
        await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'paid', isPosted: true }
        })
    }, {
        timeout: 60000 // 60 seconds of nuclear winter
    })

    console.log('\n=== ✅ NUCLEAR OPERATION COMPLETED ===')
}

nuclearCleanup().catch(console.error).finally(() => prisma.$disconnect())
