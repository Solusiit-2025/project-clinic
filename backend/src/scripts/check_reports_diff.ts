import { prisma } from '../lib/prisma';

async function main() {
  const code = '1-1101-K001';
  const targetDate = new Date('2026-05-05T23:59:59+07:00');
  
  const acc = await prisma.chartOfAccount.findFirst({ where: { code } });
  if (!acc) return console.log('Account not found');

  console.log(`Account: ${acc.name} (${acc.code})`);
  console.log(`Opening Balance: ${acc.openingBalance}`);
  console.log(`Clinic ID: ${acc.clinicId}`);

  // Trial Balance Logic Simulation
  const tbAgg = await prisma.journalDetail.aggregate({
    where: {
      coaId: acc.id,
      journalEntry: { date: { lte: targetDate } }
    },
    _sum: { debit: true, credit: true }
  });
  const tbDebit = tbAgg._sum.debit || 0;
  const tbCredit = tbAgg._sum.credit || 0;
  console.log(`TB Simulation (Consolidated): Debit: ${tbDebit}, Credit: ${tbCredit}, Net: ${acc.openingBalance + tbDebit - tbCredit}`);

  // Balance Sheet Logic Simulation (Assume a specific clinic context)
  const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // Pusat
  const bsAgg = await prisma.journalDetail.aggregate({
    where: {
      coaId: acc.id,
      journalEntry: { 
        date: { lte: targetDate },
        clinicId: clinicId
      }
    },
    _sum: { debit: true, credit: true }
  });
  const bsDebit = bsAgg._sum.debit || 0;
  const bsCredit = bsAgg._sum.credit || 0;
  console.log(`BS Simulation (Clinic ${clinicId}): Debit: ${bsDebit}, Credit: ${bsCredit}, Net: ${acc.openingBalance + bsDebit - bsCredit}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
