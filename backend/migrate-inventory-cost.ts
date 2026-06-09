import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting data migration for InventoryStock and InventoryMutation...');

  // 1. Migrate InventoryStock
  const stocks = await prisma.inventoryStock.findMany({
    include: {
      batch: true,
      product: true
    }
  });

  let stockUpdatedCount = 0;
  for (const stock of stocks) {
    const unitCost = stock.batch?.purchasePrice ?? stock.product?.purchasePrice ?? 0;
    const sellingPrice = stock.product?.sellingPrice ?? 0;

    await prisma.inventoryStock.update({
      where: { id: stock.id },
      data: {
        unitCost,
        sellingPrice
      }
    });
    stockUpdatedCount++;
  }
  console.log(`Migrated ${stockUpdatedCount} InventoryStock records.`);

  // 2. Migrate InventoryMutation
  const mutations = await prisma.inventoryMutation.findMany({
    include: {
      batch: true,
      product: true
    }
  });

  let mutationUpdatedCount = 0;
  for (const mut of mutations) {
    const unitCost = mut.batch?.purchasePrice ?? mut.product?.purchasePrice ?? 0;
    const sellingPrice = mut.product?.sellingPrice ?? 0;

    await prisma.inventoryMutation.update({
      where: { id: mut.id },
      data: {
        unitCost,
        sellingPrice
      }
    });
    mutationUpdatedCount++;
  }
  console.log(`Migrated ${mutationUpdatedCount} InventoryMutation records.`);

  console.log('Migration completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
