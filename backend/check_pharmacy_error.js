const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prescriptionId = 'b7e39610-aabf-428e-b82f-5b057b280e50';
  
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      items: {
        include: {
          medicine: {
            include: {
              productMaster: true
            }
          }
        }
      },
      medicalRecord: {
        include: { clinic: true }
      }
    }
  });

  if (!prescription) {
    console.log('Prescription not found');
    return;
  }

  const clinicId = prescription.medicalRecord.clinicId;
  const clinicName = prescription.medicalRecord.clinic?.name || 'Unknown';
  console.log(`PRESCRIPTION CLINIC: ${clinicName} (${clinicId})`);

  for (const item of prescription.items) {
    const med = item.medicine;
    console.log(`\nPrescribed Item: ${med?.medicineName || 'Unknown'}`);
    
    if (med?.productMaster) {
      const pm = med.productMaster;
      console.log(`- Linked to ProductMaster: ${pm.masterName} (${pm.id})`);
      
      // Check for local Product inventory
      const product = await prisma.product.findFirst({
        where: {
          masterProductId: pm.id,
          clinicId: clinicId
        }
      });
      
      if (product) {
        console.log(`- Local Product found: ${product.productName} (ID: ${product.id}, Qty: ${product.quantity})`);
      } else {
        console.log(`- NO Local Product FOUND in clinic ${clinicId}`);
        
        // Let's see if this ProductMaster exists in ANY other clinic
        const otherClinics = await prisma.product.findMany({
          where: { masterProductId: pm.id },
          include: { clinic: true }
        });
        console.log(`- Item exists in other clinics: ${otherClinics.map(oc => oc.clinic.name).join(', ') || 'NONE'}`);
      }
    } else if (med) {
        console.log(`- Medicine ${med.id} has NO ProductMaster link.`);
    } else {
        console.log(`- Item has no linked medicine.`);
    }
  }
}

main().finally(() => prisma.$disconnect());
