const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const corporateInvoices = await prisma.corporateInvoice.count();
  const directPurchases = await prisma.directMedicinePurchase.count();
  const cashTransfers = await prisma.cashTransfer.count();
  const doctorCommissions = await prisma.doctorCommission.count();
  console.log({
    corporateInvoices,
    directPurchases,
    cashTransfers,
    doctorCommissions
  });
}

check().finally(() => prisma.$disconnect());
