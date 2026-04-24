import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../src/services/inventory.service';

const prisma = new PrismaClient();

async function syncAllStocks() {
  console.log('--- STARTING GLOBAL STOCK SYNC ---');

  // Fetch all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      clinicId: true,
      productName: true
    }
  });

  console.log(`Found ${products.length} products to verify.`);

  let fixCount = 0;

  for (const p of products) {
    if (!p.clinicId) continue;

    // We use the InventoryService to sync
    // It aggregates onHandQty from InventoryStock and updates Product.quantity
    const oldQty = (await prisma.product.findUnique({ where: { id: p.id }, select: { quantity: true } }))?.quantity || 0;
    
    // Perform sync
    const newQty = await InventoryService.syncProductQuantity(prisma, p.id, p.clinicId);

    if (oldQty !== newQty) {
      console.log(`[FIXED] Product: ${p.productName} | Clinic ID: ${p.clinicId}`);
      console.log(`        Qty changed from ${oldQty} to ${newQty}`);
      fixCount++;
    }
  }

  console.log('\n--- SYNC COMPLETED ---');
  console.log(`Total Products Fixed: ${fixCount}`);
  
  process.exit(0);
}

syncAllStocks().catch(e => {
  console.error(e);
  process.exit(1);
});
