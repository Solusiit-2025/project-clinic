const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCOA() {
  const coas = await prisma.chartOfAccount.findMany({
    where: {
      OR: [
        { code: { startsWith: '1-13' } },
        { code: { startsWith: '4-1' } },
        { name: { contains: 'Racik' } },
        { name: { contains: 'Tuslah' } }
      ]
    },
    orderBy: { code: 'asc' }
  });
  console.log(JSON.stringify(coas, null, 2));
  
  const systemAccounts = await prisma.systemAccount.findMany({
    include: { coa: true }
  });
  console.log('--- System Accounts ---');
  console.log(JSON.stringify(systemAccounts, null, 2));
  
  await prisma.$disconnect();
}

checkCOA();
