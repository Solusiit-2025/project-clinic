import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function revertChanges() {
    try {
        const invoiceNo = 'INV-20260614-0018';
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNo }
        });

        if (!invoice) {
            console.log("Invoice not found.");
            return;
        }

        // Add back to Invoice
        const obatService = await prisma.service.findFirst({
            where: { serviceName: { contains: 'Obat-obatan' } }
        });
        const tuslahService = await prisma.service.findFirst({
            where: { serviceName: { contains: 'Tuslah' } }
        });

        if (obatService) {
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    serviceId: obatService.id,
                    description: "nyeri perut (Racikan)",
                    quantity: 10,
                    price: 1300,
                    subtotal: 13000
                }
            });
        }

        if (tuslahService) {
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    serviceId: tuslahService.id,
                    description: "Biaya Racik Obat (Tuslah) - nyeri perut",
                    quantity: 1,
                    price: 10000,
                    subtotal: 10000
                }
            });
        }

        // Recalculate Total
        const allItems = await prisma.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
        const newTotal = allItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                subtotal: newTotal,
                total: newTotal,
                amountPaid: newTotal,
                personalAmount: newTotal
            }
        });

        // Add back to Prescription
        const prescription = await prisma.prescription.findFirst({
            where: { prescriptionNo: 'RX-172683-364' }
        });

        if (prescription) {
            await prisma.prescriptionItem.create({
                data: {
                    prescriptionId: prescription.id,
                    isRacikan: true,
                    racikanName: "nyeri perut",
                    quantity: 10,
                    dosage: "-",
                    frequency: "-",
                    duration: "-",
                    tuslahPrice: 10000,
                    instructions: "Racikan nyeri perut",
                }
            });
        }

        console.log(`Reverted Invoice Total to ${newTotal}`);
        console.log("Re-added Nyeri Perut Racikan to Pharmacy Prescription");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

revertChanges();
