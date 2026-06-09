const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const count = await prisma.asset.count(); 
  const activeCount = await prisma.asset.count({ where: { status: 'active' } }); 
  console.log('Asset count:', count, 'Active asset count:', activeCount); 
} 
run().finally(() => prisma.$disconnect());
