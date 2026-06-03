import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing patient updatedAt...');
  
  // Get all patients
  const patients = await prisma.patient.findMany({
    include: {
      medicalRecords: {
        orderBy: { recordDate: 'desc' },
        take: 1,
        select: { recordDate: true }
      }
    }
  });

  let updatedCount = 0;
  for (const p of patients) {
    if (p.medicalRecords.length > 0) {
      const latestMRDate = p.medicalRecords[0].recordDate;
      // if it's different from the patient's current updatedAt, update it
      if (latestMRDate.getTime() !== p.updatedAt.getTime()) {
        await prisma.patient.update({
          where: { id: p.id },
          data: { updatedAt: latestMRDate }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully synced updatedAt for ${updatedCount} patients based on their latest Medical Record.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
