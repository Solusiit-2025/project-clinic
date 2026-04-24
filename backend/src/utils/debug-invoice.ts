import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debugInvoice(invoiceNo: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNo },
        include: { 
            payments: true,
            items: {
                include: {
                    service: {
                        include: {
                            serviceCategory: true
                        }
                    }
                }
            }
        }
    })

    if (!invoice) {
        console.log(`❌ Invoice ${invoiceNo} not found.`)
        return
    }

    console.log(`\n=== 🔎 DEBUG INVOICE: ${invoiceNo} ===`)
    console.log(`Status: ${invoice.status}`)
    console.log(`Total: ${invoice.total}`)
    
    console.log(`\n--- 📦 Items (${invoice.items.length}) ---`)
    invoice.items.forEach((item, i) => {
        console.log(`${i+1}. ${item.description}`)
        console.log(`   - Service Name: ${item.service?.serviceName}`)
        console.log(`   - Category: ${item.service?.serviceCategory?.categoryName}`)
        console.log(`   - Subtotal: ${item.subtotal}`)
    })

    console.log(`\n--- 💳 Payments (${invoice.payments.length}) ---`)
    invoice.payments.forEach((p, i) => {
        console.log(`${i+1}. ${p.paymentNo}: Rp ${p.amount}`)
    })
}

const target = process.argv[2] || 'INV-20260420-0002'
debugInvoice(target).catch(console.error).finally(() => prisma.$disconnect())
