const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const accounts = await prisma.chartOfAccount.findMany({ 
    where: { 
      category: 'EXPENSE',
      accountType: 'DETAIL'
    } 
  });
  console.log(accounts.map(a => `${a.code} - ${a.name}`).join('\n'));
}
check().finally(() => prisma.$disconnect());
