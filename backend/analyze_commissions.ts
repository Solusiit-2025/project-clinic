import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const unpaidCommissions = await prisma.doctorCommission.findMany({
    where: { status: 'unpaid' },
    include: {
      invoice: true
    }
  });

  const totalUnpaid = unpaidCommissions.reduce((sum, c) => sum + c.amount, 0);
  console.log(`Total Unpaid di tabel DoctorCommission: ${totalUnpaid}`);
  console.log(`Jumlah Item: ${unpaidCommissions.length}`);

  // Find commissions that might not have a journal entry.
  // Generally, commissions from invoices should have a journal entry created at the time of the invoice.
  // Manual commissions (adjustments) might have been created without a journal entry? 
  // Wait, in previous log, we saw "Penyesuaian Jasa Medik Manual" entries.

  // Let's sum by type or source
  let invoiceSource = 0;
  let manualSource = 0;
  let noSource = 0;

  for (const c of unpaidCommissions) {
    if (c.invoiceId) {
      invoiceSource += c.amount;
    } else if (c.description && c.description.toLowerCase().includes('manual')) {
      manualSource += c.amount;
    } else {
      noSource += c.amount;
      console.log(`Commission with NO invoice and NO "manual" in desc: ID=${c.id}, Amount=${c.amount}, Desc="${c.description}"`);
    }
  }

  console.log(`From Invoices: ${invoiceSource}`);
  console.log(`From Manual/Adjustments: ${manualSource}`);
  console.log(`Other Sources: ${noSource}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
