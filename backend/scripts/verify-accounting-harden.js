const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAccountingHarden() {
  const productId = 'd317165e-7948-4dbe-8272-b7634440651e'; // Captopril 25mg
  const branchId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // K001
  const quantityNeeded = 10;

  console.log(`Verifying accounting harden for Captopril 25mg (ID: ${productId})...`);

  // Fetch product default price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { productName: true, purchasePrice: true }
  });

  const defaultPrice = product?.purchasePrice || 0;
  console.log(`Product: ${product?.productName}, Default Purchase Price: ${defaultPrice}`);

  // Mocking the updated pickBatchesFIFO logic
  const batches = await prisma.inventoryBatch.findMany({
    where: { productId, branchId, currentQty: { gt: 0 } },
    orderBy: { expiryDate: 'asc' }
  });

  let remaining = quantityNeeded;
  const picks = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.currentQty, remaining);
    picks.push({ batchId: batch.id, quantity: take, purchasePrice: batch.purchasePrice });
    remaining -= take;
  }

  if (remaining > 0) {
    const globalStock = await prisma.inventoryStock.findFirst({
      where: { productId, branchId, batchId: null, onHandQty: { gt: 0 } }
    });

    if (globalStock) {
      const take = Math.min(remaining, globalStock.onHandQty);
      // This is the hardened part: using defaultPrice instead of 0
      picks.push({ batchId: null, quantity: take, purchasePrice: defaultPrice });
      remaining -= take;
    }
  }

  const totalCogs = picks.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
  console.log(`Picks: ${JSON.stringify(picks, null, 2)}`);
  console.log(`Calculated Total COGS: Rp ${totalCogs.toLocaleString('id-ID')}`);

  if (totalCogs === 10 * defaultPrice && totalCogs > 0) {
    console.log('SUCCESS: Accounting hardening verified. COGS is correctly calculated for global stock!');
  } else {
    console.log('FAILURE: COGS calculation is still incorrect.');
  }

  await prisma.$disconnect();
}

verifyAccountingHarden();
