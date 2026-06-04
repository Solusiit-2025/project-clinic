import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patientId = '01eb037d-0572-4c7b-8cac-609df04b54ef';
  const doctorProfileId = '0904e5a0-2d3c-4384-8ce5-a0940691846d';

  try {
    const hasAccess = await prisma.patient.findFirst({
        where: {
          id: patientId,
          OR: [
            { medicalRecords: { some: { doctorId: doctorProfileId } } },
            { queueNumbers: { some: { doctorId: doctorProfileId } } },
            { registrations: { some: { doctorId: doctorProfileId } } },
            { appointments: { some: { doctorId: doctorProfileId } } }
          ]
        }
      });
      
      console.log('hasAccess result:', hasAccess ? 'TRUE' : 'FALSE');
  } catch (e) {
      console.error('Error during query:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
