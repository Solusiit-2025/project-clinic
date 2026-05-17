import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncBatchAndStockQuantities() {
  console.log('--- STARTING INVENTORY BATCH & STOCK QUANTITY INTEGRITY SYNC ---');
  console.log('Connected Database Target: VPS Database (77.37.44.232)\n');

  // 1. Fetch all InventoryStock records that are linked to a batch
  const stocks = await prisma.inventoryStock.findMany({
    where: {
      batchId: { not: null }
    },
    include: {
      product: {
        select: {
          productName: true,
          productCode: true
        }
      },
      batch: true
    }
  });

  console.log(`Analyzing ${stocks.length} active batch-linked stock records...`);

  let discrepancyCount = 0;

  for (const stock of stocks) {
    if (!stock.batch) continue;

    const stockQty = stock.onHandQty;
    const batchQty = stock.batch.currentQty;

    // If there is a discrepancy between stock on hand and batch qty
    if (stockQty !== batchQty) {
      console.log(`\n[DISCREPANCY FOUND] Product: ${stock.product.productName} (${stock.product.productCode})`);
      console.log(`   Branch ID : ${stock.branchId}`);
      console.log(`   Batch No  : ${stock.batch.batchNumber}`);
      console.log(`   Stock Qty : ${stockQty} (onHandQty)`);
      console.log(`   Batch Qty : ${batchQty} (currentQty)`);

      // We align the Batch currentQty to match the primary Stock onHandQty
      await prisma.inventoryBatch.update({
        where: { id: stock.batch.id },
        data: { currentQty: stockQty }
      });

      console.log(`   >> SUCCESS: Aligned Batch currentQty to match Stock onHandQty (${stockQty})`);
      discrepancyCount++;
    }
  }

  console.log('\n--- VERIFYING PRODUCT SUM QUANTITY SYNC ---');
  // 2. Fetch all products to ensure their aggregated sum matches the Product.quantity field
  const products = await prisma.product.findMany({
    select: {
      id: true,
      clinicId: true,
      productName: true,
      quantity: true
    }
  });

  let productFixCount = 0;

  for (const p of products) {
    if (!p.clinicId) continue;

    // Calculate sum of onHandQty in InventoryStock for this product and branch
    const stockSum = await prisma.inventoryStock.aggregate({
      where: {
        productId: p.id,
        branchId: p.clinicId
      },
      _sum: {
        onHandQty: true
      }
    });

    const calculatedSum = stockSum._sum.onHandQty || 0;

    if (p.quantity !== calculatedSum) {
      console.log(`\n[PRODUCT QTY MISMATCH] Product: ${p.productName}`);
      console.log(`   Current Product Qty : ${p.quantity}`);
      console.log(`   Calculated Sum Qty  : ${calculatedSum}`);

      await prisma.product.update({
        where: { id: p.id },
        data: { quantity: calculatedSum }
      });

      console.log(`   >> SUCCESS: Synced Product quantity field to ${calculatedSum}`);
      productFixCount++;
    }
  }

  console.log('\n--- SYNC PROCESS COMPLETE ---');
  console.log(`Total Batch Discrepancies Aligned : ${discrepancyCount}`);
  console.log(`Total Product Quantities Resynced : ${productFixCount}`);
  
  process.exit(0);
}

syncBatchAndStockQuantities().catch(e => {
  console.error('Error during synchronization:', e);
  process.exit(1);
});
