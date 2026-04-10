
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Medicine Clinic Migration ---');
  
  // 1. Find the Main Clinic (K001)
  const mainClinic = await prisma.clinic.findUnique({ where: { code: 'K001' } });
  if (!mainClinic) {
    console.error('Main Clinic (K001) not found. Aborting.');
    return;
  }
  
  console.log(`Main Clinic found: ${mainClinic.name} (${mainClinic.id})`);

  // 2. Update all medicines with null clinicId
  const result = await prisma.medicine.updateMany({
    where: { clinicId: null },
    data: { clinicId: mainClinic.id }
  });

  console.log(`Successfully updated ${result.count} medicines to Main Clinic.`);
  console.log('--- Migration Complete ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
