const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const count = await prisma.branchProductPrice.count({ where: { purchasePrice: { gt: 0 } } }); 
  console.log('BranchProductPrice purchasePrice > 0:', count); 
} 
run().finally(() => prisma.$disconnect());
