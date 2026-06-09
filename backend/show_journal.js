const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function showJournal() {
  const je = await prisma.journalEntry.findUnique({
    where: { id: '85da5755-1ce4-4e73-9e29-54696d588e65' },
    include: { details: { include: { coa: true } } }
  });
  console.log(JSON.stringify(je, null, 2));
}
showJournal().catch(console.error).finally(()=>prisma.$disconnect());
