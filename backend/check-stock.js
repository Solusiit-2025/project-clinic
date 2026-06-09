const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const stocks = await prisma.inventoryStock.findMany({
    take: 5,
    include: { batch: true, product: true }
  });
  console.log(JSON.stringify(stocks, null, 2));
} 
run().finally(() => prisma.$disconnect());
