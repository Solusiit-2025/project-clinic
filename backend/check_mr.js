const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const mr = await prisma.medicalRecord.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      labOrders: { include: { results: true } },
      services: true
    }
  });
  console.log(JSON.stringify(mr, null, 2));
}
check().finally(() => prisma.$disconnect());
