import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function nuclearFix(invoiceNo: string) {
    console.log(`\n=== ☢️ NUCLEAR RE-SYNC: ${invoiceNo} ===`)
    
    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNo },
        include: { payments: true }
    })

    if (!invoice) {
        console.log(`❌ Invoice not found`)
        return
    }

    // Thorough search for journals
    // 1. Matches referenceNo exactly
    // 2. Or description contains the invoice number
    const journals = await prisma.journalEntry.findMany({
        where: {
            OR: [
                { referenceNo: { contains: invoiceNo } },
                { description: { contains: invoiceNo } }
            ]
        }
    })

    console.log(`🗑️ Deleting ${journals.length} suspect journal entries...`)
    for (const j of journals) {
        console.log(`Deleting Journal: ${j.id} - ${j.description}`)
        await prisma.journalDetail.deleteMany({ where: { journalEntryId: j.id } })
        await prisma.journalEntry.delete({ where: { id: j.id } })
    }

    // 2. Reset flags
    await prisma.invoice.update({
        where: { id: invoice.id },
        data: { isPosted: false }
    })

    console.log(`✅ Ready for fresh POST. Please click 'Post' in the UI for ${invoiceNo}.`)
}

const target = process.argv[2] || 'INV-20260420-0002'
nuclearFix(target).catch(console.error).finally(() => prisma.$disconnect())
