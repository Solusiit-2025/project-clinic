
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Medicine Synchronization to Branches ---');

  // 1. Find the Main Clinic (K001)
  const mainClinic = await prisma.clinic.findUnique({ where: { code: 'K001' } });
  if (!mainClinic) {
    console.error('Main Clinic (K001) not found.');
    return;
  }

  // 2. Find all other clinics
  const otherClinics = await prisma.clinic.findMany({
    where: { id: { not: mainClinic.id } }
  });
  console.log(`Found ${otherClinics.length} other branches to sync.`);

  // 3. Find all medicines in the Main Clinic, including their master products and branch inventory
  const mainMedicines = await prisma.medicine.findMany({
    where: { clinicId: mainClinic.id },
    include: {
      productMaster: {
        include: {
          products: {
            where: { clinicId: mainClinic.id }
          }
        }
      }
    }
  });
  console.log(`Found ${mainMedicines.length} medicines in Main Clinic.`);

  // 4. Ensure "Medicine" category exists
  let category = await prisma.productCategory.findUnique({ where: { categoryName: 'Medicine' } });
  if (!category) {
    category = await prisma.productCategory.create({
      data: { categoryName: 'Medicine', description: 'Kategori otomatis untuk obat-obatan' }
    });
  }

  // 5. Sync to each clinic
  for (const clinic of otherClinics) {
    console.log(`\nSyncing to branch: ${clinic.name} (${clinic.code})...`);
    let addedCount = 0;
    let skippedCount = 0;

    for (const med of mainMedicines) {
      // Check if this medicine (by name) already exists in target clinic
      const existing = await prisma.medicine.findFirst({
        where: { medicineName: med.medicineName, clinicId: clinic.id }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Create Medicine for branch
      const newMed = await prisma.medicine.create({
        data: {
          medicineName: med.medicineName,
          genericName: med.genericName,
          description: med.description,
          dosageForm: med.dosageForm,
          strength: med.strength,
          manufacturer: med.manufacturer,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          image: med.image,
          isActive: med.isActive,
          clinicId: clinic.id
        }
      });

      // Fetch source product data (Inventory) from Main Clinic if available
      const sourceProduct = med.productMaster?.products?.[0];

      // Create ProductMaster for this medicine in Branch
      const master = await prisma.productMaster.create({
        data: {
          masterCode: `MED-${Math.random().toString(36).substring(7).toUpperCase()}`,
          masterName: newMed.medicineName,
          description: newMed.description,
          categoryId: category.id,
          medicineId: newMed.id,
          isActive: newMed.isActive
        }
      });

      // Create initial Inventory Product for Branch
      await prisma.product.create({
        data: {
          clinicId: clinic.id,
          masterProductId: master.id,
          productName: newMed.medicineName,
          productCode: `PRD-${clinic.code}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          sku: `SKU-${clinic.code}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          description: newMed.description,
          unit: sourceProduct?.unit || newMed.dosageForm || 'Pcs',
          purchaseUnit: sourceProduct?.purchaseUnit || 'Box',
          storageUnit: sourceProduct?.storageUnit || newMed.dosageForm || 'Pcs',
          usedUnit: sourceProduct?.usedUnit || newMed.dosageForm || 'Pcs',
          quantity: 0, // Everyone starts with 0 stock
          minimumStock: sourceProduct?.minimumStock || 10,
          reorderQuantity: sourceProduct?.reorderQuantity || 50,
          purchasePrice: sourceProduct?.purchasePrice || 0,
          sellingPrice: sourceProduct?.sellingPrice || 0,
          isActive: true
        }
      });

      addedCount++;
    }
    console.log(`Done. Added: ${addedCount}, Skipped: ${skippedCount}`);
  }

  console.log('\n--- Synchronization Complete ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
