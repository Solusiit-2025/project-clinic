const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.dentalLabWorkOrder.update({
    where: { workOrderNo: 'SPK-20260623-0002' },
    data: { status: 'SENT_TO_LAB' }
  });
  console.log('Updated to SENT_TO_LAB');
}
main().catch(console.error).finally(() => prisma.$disconnect());
