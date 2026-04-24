const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Starting Inventory Reservation Cleanup...');

  // 1. Get all active prescriptions that should have reserved stock
  const activePrescriptions = await prisma.prescription.findMany({
    where: {
      dispenseStatus: { in: ['preparing', 'ready'] }
    },
    include: {
      items: {
        include: {
          medicine: {
            include: {
              productMaster: {
                include: {
                  products: true
                }
              }
            }
          },
          components: {
             include: {
               medicine: {
                 include: {
                   productMaster: {
                     include: {
                       products: true
                     }
                   }
                 }
               }
             }
          }
        }
      },
      medicalRecord: true
    }
  });

  console.log(`Found ${activePrescriptions.length} active prescriptions in process.`);

  // 2. Calculate intended reservations per Product per Clinic
  const intendedReservations = new Map(); // Key: clinicId:productId, Value: quantity

  for (const rx of activePrescriptions) {
    const clinicId = rx.medicalRecord?.clinicId;
    if (!clinicId) continue;

    for (const item of rx.items) {
      if (item.isRacikan) {
         for (const comp of item.components) {
            const product = comp.medicine?.productMaster?.products.find(p => p.clinicId === clinicId);
            if (product) {
              const key = `${clinicId}:${product.id}`;
              const qty = (intendedReservations.get(key) || 0) + (comp.quantity * item.quantity);
              intendedReservations.set(key, qty);
            }
         }
      } else {
        const product = item.medicine?.productMaster?.products.find(p => p.clinicId === clinicId);
        if (product) {
          const key = `${clinicId}:${product.id}`;
          const qty = (intendedReservations.get(key) || 0) + item.quantity;
          intendedReservations.set(key, qty);
        }
      }
    }
  }

  // 3. Reset ALL reservedQty to 0 first (Safest way to clear phantoms)
  console.log('Resetting all reserved quantities to 0...');
  await prisma.inventoryStock.updateMany({
    data: { reservedQty: 0 }
  });

  // 4. Apply intended reservations
  console.log(`Applying ${intendedReservations.size} intended reservations...`);
  for (const [key, qty] of intendedReservations.entries()) {
    const [clinicId, productId] = key.split(':');
    
    // Find or create the global record (batchId: null)
    const stock = await prisma.inventoryStock.findFirst({
      where: { branchId: clinicId, productId: productId, batchId: null }
    });

    if (stock) {
      await prisma.inventoryStock.update({
        where: { id: stock.id },
        data: { reservedQty: qty }
      });
    } else {
      await prisma.inventoryStock.create({
        data: {
          branchId: clinicId,
          productId: productId,
          batchId: null,
          onHandQty: 0,
          reservedQty: qty
        }
      });
    }
  }

  console.log('Cleanup complete! Inventory stock reservations are now synchronized with active prescriptions.');
  await prisma.$disconnect();
}

cleanup();
