import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function repair() {
  const invoiceNo = 'INV-20260420-0001'
  console.log(`\n=== Repairing GL Breakdown for ${invoiceNo} ===`)

  // Target Accounts based on actual COA in DB that match the semantic names
  const coaPendaftaran = '4-1501' // Biaya Administrasi & Kartu
  const coaObat = '4-1301' // Penjualan Obat-obatan

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get the Journal Entry for the Invoice (Accrual)
    const journal = await tx.journalEntry.findFirst({
        where: { referenceNo: invoiceNo, entryType: 'SYSTEM' },
        include: { details: true }
    })

    if (!journal) throw new Error('Journal not found for invoice')

    // 2. Locate the Lumped Revenue Detail (currently credited to 4-1101)
    const lumpedDetail = journal.details.find(d => d.credit === 132500)
    if (!lumpedDetail) throw new Error('Lumped credit detail of 132500 not found')

    const pendaftaranCoa = await tx.chartOfAccount.findFirst({ where: { code: coaPendaftaran } })
    const obatCoa = await tx.chartOfAccount.findFirst({ where: { code: coaObat } })

    if (!pendaftaranCoa || !obatCoa) throw new Error('Target COA codes not found in DB')

    console.log(`🔄 Splitting ${lumpedDetail.id} into itemized breakdown...`)

    // 3. Delete the lumped detail
    await tx.journalDetail.delete({ where: { id: lumpedDetail.id } })

    // 4. Create itemized details
    await tx.journalDetail.createMany({
        data: [
            { 
                journalEntryId: journal.id, 
                coaId: pendaftaranCoa.id, 
                debit: 0, 
                credit: 50000, 
                description: `Pendapatan ${pendaftaranCoa.name} - Inv ${invoiceNo}` 
            },
            { 
                journalEntryId: journal.id, 
                coaId: obatCoa.id, 
                debit: 0, 
                credit: 82500, 
                description: `Pendapatan ${obatCoa.name} - Inv ${invoiceNo}` 
            }
        ]
    })

    return { journalId: journal.id, msg: 'Split completed' }
  })

  console.log('\n=== REPAIR COMPLETED ===')
  console.log(JSON.stringify(result, null, 2))
}

repair().catch(console.error).finally(() => prisma.$disconnect())
