import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function cleanSlateRepair() {
    const invoiceNo = 'INV-20260420-0001'
    const paymentNo = 'PAY-706840-014'

    console.log(`\n=== 🧹 CLEAN SLATE OPERATION FOR ${invoiceNo} ===`)

    await prisma.$transaction(async (tx) => {
        // 1. HARD CLEANUP: Delete ALL journal entries related to this invoice or payment
        console.log('🗑️ Removing old journal entries...')
        const affectedJournals = await tx.journalEntry.findMany({
            where: {
                OR: [
                    { referenceNo: invoiceNo },
                    { referenceNo: paymentNo },
                    { description: { contains: invoiceNo } },
                    { description: { contains: paymentNo } },
                    { details: { some: { description: { contains: invoiceNo } } } },
                    { details: { some: { description: { contains: paymentNo } } } }
                ]
            }
        })
        
        for (const je of affectedJournals) {
            console.log(`   - Deleting Journal: ${je.id} (${je.referenceNo})`)
            await tx.journalDetail.deleteMany({ where: { journalEntryId: je.id } })
            await tx.journalEntry.delete({ where: { id: je.id } })
        }

        // 2. FETCH NECESSARY DATA
        const invoice = await tx.invoice.findUnique({
            where: { invoiceNo },
            include: { clinic: true }
        })
        if (!invoice) throw new Error(`Invoice ${invoiceNo} not found`)
        const clinicId = invoice.clinicId

        // 3. CREATE ACCRUAL RECOGNITION (INV JURNAL)
        console.log('📝 Creating Fresh Accrual Journal...')
        const arCoa = await tx.chartOfAccount.findFirst({ where: { code: '1-1201' } })
        const adminCoa = await tx.chartOfAccount.findFirst({ where: { code: '4-1501' } })
        const obatCoa = await tx.chartOfAccount.findFirst({ where: { code: '4-1301' } })

        if (!arCoa || !adminCoa || !obatCoa) throw new Error('Necessary COAs (1-1201, 4-1501, 4-1301) not found')

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
                        { coaId: adminCoa.id, debit: 0, credit: 50000, description: `Pendapatan Biaya Administrasi - Inv ${invoiceNo}` },
                        { coaId: obatCoa.id, debit: 0, credit: 82500, description: `Pendapatan Penjualan Obat - Inv ${invoiceNo}` }
                    ]
                }
            }
        })

        // 4. CREATE PAYMENT SETTLEMENT (PAY JURNAL)
        console.log('📝 Creating Fresh Payment Journal...')
        const pettyCashCoa = await tx.chartOfAccount.findFirst({ where: { code: '1-1101' } })
        if (!pettyCashCoa) throw new Error('Petty Cash COA (1-1101) not found')

        await tx.journalEntry.create({
            data: {
                date: new Date('2026-04-20T05:08:26.841Z'), // Match original payment date
                description: `Pelunasan - Invoice #${invoiceNo}`,
                referenceNo: paymentNo,
                entryType: 'SYSTEM',
                clinicId: (clinicId as any),
                details: {
                    create: [
                        { coaId: pettyCashCoa.id, debit: 132500, credit: 0, description: `Penerimaan CASH (Petty Cash) - Inv ${invoiceNo}` },
                        { coaId: arCoa.id, debit: 0, credit: 132500, description: `Pengurangan Piutang - Inv ${invoiceNo}` }
                    ]
                }
            }
        })

        // 5. UPDATE INVOICE STATE
        await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'paid', isPosted: true }
        })
    }, {
        timeout: 30000 // 30 seconds
    })

    console.log('\n=== ✅ CLEAN SLATE OPERATION COMPLETED ===')
}

cleanSlateRepair().catch(console.error).finally(() => prisma.$disconnect())
