import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const unpaidCommissions = await prisma.doctorCommission.findMany({
    where: { status: 'unpaid' }
  });
  const totalUnpaid = unpaidCommissions.reduce((sum, c) => sum + c.amount, 0);

  const coa1102 = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '2-1102' } }
  });

  const items = await prisma.journalDetail.findMany({
    where: { coaId: { in: coa1102.map(c => c.id) } }
  });

  let ledgerBalance = 0;
  for (const item of items) {
    ledgerBalance += (item.credit - item.debit);
  }

  console.log(`Total Unpaid DoctorCommissions: ${totalUnpaid}`);
  console.log(`Ledger Balance 2-1102: ${ledgerBalance}`);
  console.log(`Difference (Unpaid - Ledger): ${totalUnpaid - ledgerBalance}`);
  
  // Also, let's fix the other 328 commissions that were part of PAY-622397!
  // Oh wait, did they stay 'paid' or did the user revert them somehow?
  // Let's check how many 'paid' commissions have paidAt = 2026-06-15
  const paidOn15 = await prisma.doctorCommission.findMany({
    where: {
      status: 'paid',
      paidAt: {
        gte: new Date('2026-06-15T00:00:00.000Z'),
        lte: new Date('2026-06-15T23:59:59.999Z')
      }
    }
  });

  console.log(`Paid on 2026-06-15: ${paidOn15.length} items, total: ${paidOn15.reduce((sum, c) => sum + c.amount, 0)}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
