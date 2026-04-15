const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCaptopril() {
  const medicineName = 'Captopril 25mg';
  const masterName = 'Captopril 25mg';

  // 1. Find ProductMaster
  const pm = await prisma.productMaster.findFirst({
    where: { masterName: masterName },
    include: { medicine: true }
  });

  if (!pm || !pm.medicineId) {
    console.log('Captopril ProductMaster or Medicine link not found');
    return;
  }

  console.log(`Found ProductMaster: ${pm.masterName} (${pm.id}), Medicine ID: ${pm.medicineId}`);

  // 2. Find all Product records for this master
  const products = await prisma.product.findMany({
    where: { masterProductId: pm.id },
    include: { clinic: true }
  });

  console.log(`Found ${products.length} product instances across clinics.`);

  for (const prod of products) {
    console.log(`\nProcessing clinic: ${prod.clinic.name} (${prod.clinicId})`);

    // 3. Check if Inventory already exists for this medicine in this clinic
    const existingInv = await prisma.inventory.findFirst({
      where: {
        medicineId: pm.medicineId,
        clinicId: prod.clinicId
      }
    });

    if (existingInv) {
      console.log(`- Inventory already exists: ${existingInv.itemName} (ID: ${existingInv.id})`);
      continue;
    }

    // 4. Create missing Inventory record
    const itemCode = `INV-${prod.productCode}`;
    const newInv = await prisma.inventory.create({
      data: {
        itemCode: itemCode,
        itemName: pm.masterName,
        medicineId: pm.medicineId,
        description: `Synced from Product ${prod.productCode}`,
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

    console.log(`- Created Inventory record: ${newInv.itemName} (ID: ${newInv.id}) with Qty: ${newInv.quantity}`);
  }
}

syncCaptopril()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
