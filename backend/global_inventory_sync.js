const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function globalSync() {
  console.log('--- STARTING GLOBAL INVENTORY SYNCHRONIZATION ---');

  // 1. Fetch all products with their masters and related medicine
  const products = await prisma.product.findMany({
    include: {
      clinic: true,
      masterProduct: {
        include: {
          medicine: true
        }
      }
    }
  });

  console.log(`Analyzing ${products.length} products in the new catalog...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const prod of products) {
    const medicineId = prod.masterProduct.medicineId;
    if (!medicineId) {
      console.log(`[!] Skipped ${prod.productName}: ProductMaster ${prod.masterProductId} has no linked Medicine.`);
      skippedCount++;
      continue;
    }

    // Check if Inventory record exists
    const existingInv = await prisma.inventory.findFirst({
      where: {
        medicineId: medicineId,
        clinicId: prod.clinicId
      }
    });

    if (existingInv) {
      skippedCount++;
      continue; 
    }

    // Create missing Inventory
    try {
      // Ensure itemCode is unique by adding clinic suffix if needed
      const itemCode = `INV-${prod.productCode}`;
      
      await prisma.inventory.create({
        data: {
          itemCode: itemCode,
          itemName: prod.masterProduct.masterName,
          medicineId: medicineId,
          description: `Auto-synced from Product Catalog (${prod.productCode})`,
          category: 'medicine',
          unit: prod.usedUnit || prod.unit || 'tablet',
          quantity: prod.quantity,
          minimumStock: prod.minimumStock || 0,
          reorderQuantity: prod.reorderQuantity || 0,
          purchasePrice: prod.purchasePrice || 0,
          sellingPrice: prod.sellingPrice || 0,
          clinicId: prod.clinicId,
          isActive: true
        }
      });
      console.log(`[+] Created Inventory: ${prod.masterProduct.masterName} in ${prod.clinic.name}`);
      createdCount++;
    } catch (e) {
      console.error(`[X] Error creating inventory for ${prod.masterProduct.masterName} in ${prod.clinicId}:`, e.message);
    }
  }

  console.log('--- SYNC COMPLETE ---');
  console.log(`Summary: ${createdCount} created, ${skippedCount} skipped/checked.`);
}

globalSync()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
