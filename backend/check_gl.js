const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const account = await prisma.chartOfAccount.findFirst({ where: { code: '1-1301-K001' } });
  if (!account) return console.log('Account not found');
  console.log("Found account:", account.name, account.code);
  
  const details = await prisma.journalDetail.findMany({ 
    where: { accountId: account.id }, 
    include: { journal: true } 
  });
  
  let totalDebit = 0;
  let totalCredit = 0;
  for (const d of details) {
    if (d.debit > 0) totalDebit += d.debit;
    if (d.credit > 0) totalCredit += d.credit;
  }
  
  console.log("Total Debit:", totalDebit);
  console.log("Total Credit:", totalCredit);
  console.log("Balance:", totalDebit - totalCredit);
}
check().finally(() => prisma.$disconnect());
