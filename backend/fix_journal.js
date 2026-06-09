const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fixJ() {
  await prisma.journalDetail.update({
    where: { id: '86872560-a62e-422d-ae7a-5e99c19af030' },
    data: { coaId: '878b4c6e-a778-4f86-9c30-9af8701f2201' }
  });
  console.log('Fixed');
}
fixJ().catch(console.error).finally(()=>prisma.$disconnect());
