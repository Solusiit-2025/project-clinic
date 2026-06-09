const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function s() { 
  console.log(await prisma.inventoryStock.findMany({ select: { id: true, quantity: true, unitCost: true, sellingPrice: true } })); 
} 
s().catch(console.error).finally(()=>prisma.$disconnect());
