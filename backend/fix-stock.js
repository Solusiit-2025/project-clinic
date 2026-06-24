const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const updated = await prisma.inventoryStock.updateMany({ where: { reservedQty: { lt: 0 } }, data: { reservedQty: 0 } });
  console.log('Fixed:', updated.count);
}
fix().finally(() => prisma.$disconnect());
