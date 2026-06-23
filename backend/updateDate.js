const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.dentalLabWorkOrder.update({
    where: { workOrderNo: 'SPK-20260623-0002' },
    data: { sentDate: new Date() }
  });
  console.log('Updated sentDate for Jasmine');
}
main().catch(console.error).finally(() => prisma.$disconnect());
