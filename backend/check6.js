const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const count = await prisma.inventoryBatch.count({ where: { purchasePrice: { gt: 0 } } }); 
  console.log('InventoryBatch purchasePrice > 0:', count); 
} 
run().finally(() => prisma.$disconnect());
