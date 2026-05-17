import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPatientDefaults() {
  console.log('--- STARTING PATIENT TYPE DEFAULT SYNC ---');

  // Find all patients where patientType is null
  const patientsToFix = await prisma.patient.findMany({
    where: {
      OR: [
        { patientType: null },
        { patientType: '' }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });

  console.log(`Found ${patientsToFix.length} patients with no patientType defined.`);

  if (patientsToFix.length > 0) {
    const updateResult = await prisma.patient.updateMany({
      where: {
        OR: [
          { patientType: null },
          { patientType: '' }
        ]
      },
      data: {
        patientType: 'Poli Umum'
      }
    });

    console.log(`Successfully updated ${updateResult.count} patients to default 'Poli Umum'.`);
  } else {
    console.log('No patients needed updating.');
  }

  console.log('--- SYNC COMPLETED ---');
  process.exit(0);
}

syncPatientDefaults().catch(e => {
  console.error(e);
  process.exit(1);
});
