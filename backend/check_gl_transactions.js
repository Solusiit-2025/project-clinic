const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const account = await prisma.chartOfAccount.findFirst({ where: { code: '1-1301-K001' } });
  if (!account) return console.log('Account not found');
  
  const details = await prisma.journalDetail.findMany({ 
    where: { coaId: account.id }, 
    include: { journalEntry: true }
  });
  
  let openingBalDebit = 0;
  let purchasesDebit = 0;
  let usageCredit = 0;
  
  for (const d of details) {
    if (d.journalEntry.referenceNo.startsWith('OB-')) {
      openingBalDebit += d.debit || 0;
    } else if (d.journalEntry.referenceNo.startsWith('INV-')) {
      usageCredit += d.credit || 0;
      purchasesDebit += d.debit || 0;
    } else {
      if (d.debit) purchasesDebit += d.debit;
      if (d.credit) usageCredit += d.credit;
    }
    console.log(`[${d.journalEntry.date}] ${d.journalEntry.referenceNo}: Debit ${d.debit || 0} / Credit ${d.credit || 0} - ${d.description || d.journalEntry.description}`);
  }
  
  console.log('--- Summary ---');
  console.log('Opening Balance Debit:', openingBalDebit);
  console.log('Other Debits:', purchasesDebit);
  console.log('Credits (Usage/COGS):', usageCredit);
  console.log('Total Balance:', openingBalDebit + purchasesDebit - usageCredit);
}
check().finally(() => prisma.$disconnect());
