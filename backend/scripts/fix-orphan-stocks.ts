import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanStocks() {
  console.log('--- Fixing Orphan Stocks (Batchless Stock) ---');

  // 1. Find InventoryStock records with no batchId but with quantity
  const orphanStocks = await prisma.inventoryStock.findMany({
    where: {
      batchId: null,
      onHandQty: { gt: 0 }
    },
    include: {
      product: true
    }
  });

  console.log(`Found ${orphanStocks.length} orphan records.`);

  for (const stock of orphanStocks) {
    console.log(`\nProcessing: ${stock.product.productName} (Clinic: ${stock.branchId})`);
    
    // 2. Create a virtual batch for this stock
    // We use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Create the batch
      const newBatch = await tx.inventoryBatch.create({
        data: {
          productId: stock.productId,
          branchId: stock.branchId,
          batchNumber: 'INITIAL-STOCK',
          initialQty: stock.onHandQty,
          currentQty: stock.onHandQty,
          purchasePrice: stock.product.purchasePrice || 0,
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Default 2 years expiry
        }
      });

      console.log(` - Created new batch: ${newBatch.batchNumber} (ID: ${newBatch.id})`);

      // Update the InventoryStock record to point to this batch
      await tx.inventoryStock.update({
        where: { id: stock.id },
        data: { batchId: newBatch.id }
      });

      console.log(` - Updated inventory stock record to link to new batch.`);
    });
  }

  console.log('\n--- Fix Completed ---');
  process.exit(0);
}

fixOrphanStocks().catch(e => {
  console.error(e);
  process.exit(1);
});
