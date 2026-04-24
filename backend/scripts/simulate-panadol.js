const { PrismaClient } = require('@prisma/client');
const { InventoryService } = require('../dist/services/inventory.service'); // Need to use compiled or mock
const prisma = new PrismaClient();

async function simulateDeduction() {
  const medicineId = '282fffa1-b73b-4221-9307-3b0bb2ac7425'; // Panadol 500mg
  const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // K001
  const qty = 10;

  console.log(`Simulating deduction for Medicine ${medicineId} in Clinic ${clinicId}...`);

  await prisma.$transaction(async (tx) => {
    // 1. Find Product
    const product = await tx.product.findFirst({
        where: { masterProduct: { medicineId }, clinicId }
    });

    if (!product) {
      console.log('Error: Product not found!');
      return;
    }
    console.log(`Found Product: ${product.productName} (ID: ${product.id}) with Qty: ${product.quantity}`);

    // 2. Simulate deductStock call (Checking fromReserved logic)
    // We'll just call the real service methods but log the state
    
    // Check batches
    const batches = await tx.inventoryBatch.findMany({
      where: { productId: product.id, branchId: clinicId, currentQty: { gt: 0 } }
    });
    console.log(`Found ${batches.length} eligible batches.`);
    batches.forEach(b => console.log(`- Batch ${b.batchNumber}: ${b.currentQty} available`));

    // Check InventoryStock records
    const stocks = await tx.inventoryStock.findMany({
      where: { productId: product.id, branchId: clinicId }
    });
    console.log(`Found ${stocks.length} InventoryStock records.`);
    stocks.forEach(s => console.log(`- ID: ${s.id}, BatchId: ${s.batchId}, OnHand: ${s.onHandQty}, Reserved: ${s.reservedQty}`));

  });

  await prisma.$disconnect();
}

simulateDeduction();
