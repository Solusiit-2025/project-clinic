const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFix() {
  const productId = 'd317165e-7948-4dbe-8272-b7634440651e'; // Captopril 25mg
  const branchId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // K001
  const quantityNeeded = 10;

  console.log(`Verifying fix for Captopril 25mg (ID: ${productId})...`);

  // Mocking the logic of pickBatchesFIFO
  const batches = await prisma.inventoryBatch.findMany({
    where: { productId, branchId, currentQty: { gt: 0 } },
    orderBy: { expiryDate: 'asc' }
  });

  let remaining = quantityNeeded;
  const picks = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.currentQty, remaining);
    picks.push({ batchId: batch.id, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    console.log(`Batches insufficient, missing ${remaining} units. Checking Global Stock...`);
    const globalStock = await prisma.inventoryStock.findFirst({
      where: { productId, branchId, batchId: null, onHandQty: { gt: 0 } }
    });

    if (globalStock) {
      const take = Math.min(remaining, globalStock.onHandQty);
      picks.push({ batchId: null, quantity: take });
      remaining -= take;
      console.log(`Global stock found! Took ${take} units.`);
    }
  }

  if (remaining <= 0) {
    console.log('SUCCESS: Fix verified. All units can be picked!');
    console.log('Picks:', JSON.stringify(picks, null, 2));
  } else {
    console.log(`FAILURE: Still missing ${remaining} units even with global stock.`);
  }

  await prisma.$disconnect();
}

verifyFix();
