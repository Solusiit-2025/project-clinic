import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coa1101 = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '2-1101' } }
  });
  const coa1102 = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '2-1102' } }
  });

  const coaIds = [...coa1101.map(c => c.id), ...coa1102.map(c => c.id)];

  const items = await prisma.journalDetail.findMany({
    where: {
      coaId: { in: coaIds }
    },
    include: {
      journalEntry: true,
      coa: true
    },
    orderBy: {
      journalEntry: {
        date: 'asc'
      }
    }
  });

  console.log("=== Hutang Dagang (2-1101) & Hutang Jasa Medik (2-1102) ===");
  let balance1101 = 0;
  let balance1102 = 0;

  for (const item of items) {
    const is1101 = item.coa.code.startsWith('2-1101');
    const is1102 = item.coa.code.startsWith('2-1102');

    // For liabilities, normal balance is Credit
    // Balance = Credit - Debit
    const netCredit = item.credit - item.debit;
    
    if (is1101) balance1101 += netCredit;
    if (is1102) balance1102 += netCredit;

    console.log(`[${item.journalEntry.date.toISOString().split('T')[0]}] ${item.coa.code} - ${item.journalEntry.description}`);
    console.log(`   Debit: ${item.debit} | Credit: ${item.credit} | Ref: ${item.journalEntry.referenceNo}`);
    console.log(`   ID Detail: ${item.id} | Journal ID: ${item.journalEntry.id}`);
  }

  console.log("\n=== SALDO AKHIR ===");
  console.log(`2-1101 (Hutang Dagang): ${balance1101}`);
  console.log(`2-1102 (Hutang Jasa Medik): ${balance1102}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
