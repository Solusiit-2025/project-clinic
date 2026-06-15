import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    console.error("Clinic not found");
    return;
  }

  const coa1102 = await prisma.chartOfAccount.findFirst({
    where: { code: '2-1102' }
  });

  const coaEquity = await prisma.chartOfAccount.findFirst({
    where: { name: { contains: 'Modal' } }
  });

  const coaExpense = await prisma.chartOfAccount.findFirst({
    where: { name: { contains: 'Jasa Medik' } }
  });

  if (!coa1102) {
    console.error("2-1102 not found");
    return;
  }

  // Find a suitable debit account. 3-xxxx is Equity.
  const debitCoaId = coaEquity?.id || coaExpense?.id;

  if (!debitCoaId) {
    console.error("No suitable debit account found");
    return;
  }

  // Create adjustment journal
  const je = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      clinicId: clinic.id,
      description: 'Penyesuaian Saldo Awal Hutang Jasa Medik (Migrasi Data / Selisih)',
      referenceNo: `ADJ-SYNC-${Date.now().toString().slice(-6)}`,
      entryType: 'ADJUSTMENT',
      details: {
        create: [
          {
            coaId: debitCoaId,
            debit: 970000,
            credit: 0,
            description: 'Penyesuaian Saldo Awal Migrasi'
          },
          {
            coaId: coa1102.id,
            debit: 0,
            credit: 970000,
            description: 'Penyesuaian Saldo Awal Migrasi'
          }
        ]
      }
    }
  });

  console.log(`Journal Adjustment Created: ${je.referenceNo}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
