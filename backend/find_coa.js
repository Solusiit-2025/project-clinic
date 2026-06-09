const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const coas = await prisma.chartOfAccount.findMany({
    where: { accountType: 'DETAIL', OR: [{ category: 'EQUITY' }, { name: { contains: 'selisih' } }, { name: { contains: 'penyesuaian' } }] }
  });
  console.log(JSON.stringify(coas, null, 2));
}
fix().catch(console.error).finally(()=>prisma.$disconnect());
