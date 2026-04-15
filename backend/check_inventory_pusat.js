const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const medicineName = 'Captopril 25mg';
  const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // Pusat

  const inventories = await prisma.inventory.findMany({
    where: {
      itemName: { contains: 'Captopril', mode: 'insensitive' },
      clinicId: clinicId
    },
    include: { medicine: true }
  });

  console.log('INVENTORIES in Pusat:', JSON.stringify(inventories, null, 2));

  const medicines = await prisma.medicine.findMany({
    where: { medicineName: { contains: 'Captopril', mode: 'insensitive' } }
  });
  console.log('MEDICINES:', JSON.stringify(medicines, null, 2));
}

main().finally(() => prisma.$disconnect());
