const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const p = await prisma.product.findFirst({
    include: { masterProduct: true }
  });
  console.log('Branch Product:', p.purchasePrice, p.sellingPrice);
  if (p.masterProduct) {
    console.log('Master Product:', p.masterProduct.purchasePrice, p.masterProduct.sellingPrice);
  }
} 
run().finally(() => prisma.$disconnect());
