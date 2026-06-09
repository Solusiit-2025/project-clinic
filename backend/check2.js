const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const count = await prisma.inventoryStock.count({ where: { unitCost: { gt: 0 } } }); 
  console.log('unitCost > 0:', count); 
} 
run().finally(() => prisma.$disconnect());
