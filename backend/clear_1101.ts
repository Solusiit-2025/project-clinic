import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    console.error("Clinic not found");
    return;
  }

  // Find 2-1101-K001
  const coa1101 = await prisma.chartOfAccount.findFirst({
    where: { code: '2-1101-K001' }
  });

  if (!coa1101) {
    console.error("2-1101-K001 not found");
    return;
  }

  // Find Equity account (Modal)
  const coaEquity = await prisma.chartOfAccount.findFirst({
    where: { name: { contains: 'Modal' } }
  });

  if (!coaEquity) {
    console.error("Equity account not found");
    return;
  }

  // Create adjustment journal to clear the 158500 balance
  // Since it's a liability (Credit normal balance), to reduce it we must Debit it.
  const je = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      clinicId: clinic.id,
      description: 'Penghapusan Saldo Sisa Hutang Dagang (Reset Data Testing)',
      referenceNo: `ADJ-RESET-${Date.now().toString().slice(-6)}`,
      entryType: 'ADJUSTMENT',
      details: {
        create: [
          {
            coaId: coa1101.id,
            debit: 158500,
            credit: 0,
            description: 'Penghapusan sisa hutang dagang'
          },
          {
            coaId: coaEquity.id,
            debit: 0,
            credit: 158500,
            description: 'Penghapusan sisa hutang dagang'
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
