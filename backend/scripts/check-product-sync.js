const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSync() {
  const products = await prisma.product.findMany({
    include: { masterProduct: true }
  });

  const discrepancies = products.filter(p => p.masterProduct && p.productName !== p.masterProduct.masterName);
  
  if (discrepancies.length > 0) {
    console.log(`Found ${discrepancies.length} products with name discrepancy.`);
    discrepancies.slice(0, 5).forEach(p => {
      console.log(`[${p.id}] Product: "${p.productName}" | Master: "${p.masterProduct.masterName}"`);
    });
  } else {
    console.log('All products are in sync with master names.');
  }
  
  await prisma.$disconnect();
}

checkSync();
