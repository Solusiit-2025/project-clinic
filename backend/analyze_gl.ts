import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const account = await prisma.chartOfAccount.findFirst({
    where: { code: '1-1101-K001' }
  });

  if (!account) {
    console.log('Account not found');
    return;
  }

  console.log('Account:', account.code, account.name, 'Opening Balance:', account.openingBalance);

  const aggregates = await prisma.journalDetail.aggregate({
    where: { coaId: account.id },
    _sum: { debit: true, credit: true }
  });

  console.log('Total Debit:', aggregates._sum.debit);
  console.log('Total Credit:', aggregates._sum.credit);

  const transactions = await prisma.journalDetail.findMany({
    where: { coaId: account.id },
    include: { journalEntry: true },
    orderBy: { journalEntry: { date: 'asc' } }
  });

  let balance = account.openingBalance;
  console.log('\nTop 5 First Transactions:');
  for (let i = 0; i < Math.min(5, transactions.length); i++) {
    const t = transactions[i];
    balance += (t.debit - t.credit);
    console.log(t.journalEntry.date.toISOString().split('T')[0], '| D:', t.debit, '| C:', t.credit, '| Bal:', balance, '| Desc:', t.description || t.journalEntry.description);
  }

  console.log('\nTop 5 Largest Credits (Pengeluaran):');
  const largestCredits = [...transactions].sort((a, b) => b.credit - a.credit).slice(0, 5);
  for (const t of largestCredits) {
    console.log(t.journalEntry.date.toISOString().split('T')[0], '| C:', t.credit, '| Desc:', t.description || t.journalEntry.description);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
