const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function findHeader() {
  const d = await prisma.journalDetail.findMany({
    where: { coa: { accountType: 'HEADER' } },
    include: { coa: true, journalEntry: true }
  });
  console.log(JSON.stringify(d, null, 2));
}
findHeader().catch(console.error).finally(()=>prisma.$disconnect());
