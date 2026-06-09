const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const count = await prisma.productMaster.count({ where: { purchasePrice: { gt: 0 } } }); 
  console.log('ProductMaster purchasePrice > 0:', count); 
} 
run().finally(() => prisma.$disconnect());
