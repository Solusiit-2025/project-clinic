const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncNames() {
  console.log('Starting product name synchronization...');
  
  const products = await prisma.product.findMany({
    include: { masterProduct: true }
  });

  let updatedCount = 0;
  for (const product of products) {
    if (product.masterProduct && product.productName !== product.masterProduct.masterName) {
      console.log(`Syncing "${product.productName}" -> "${product.masterProduct.masterName}"`);
      await prisma.product.update({
        where: { id: product.id },
        data: { productName: product.masterProduct.masterName }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully synchronized ${updatedCount} products.`);
  await prisma.$disconnect();
}

syncNames().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
