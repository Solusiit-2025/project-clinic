import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncDepartments() {
  console.log('--- DEPARTMENT SYNC TOOL ---');

  // 1. Identify Template Clinic (K001 - Pusat)
  const templateClinic = await prisma.clinic.findFirst({
    where: { code: 'K001' },
  });

  if (!templateClinic) {
    console.error('Error: Clinic K001 (Template) not found.');
    process.exit(1);
  }

  console.log(`Found template clinic: ${templateClinic.name} (${templateClinic.code})`);

  // 2. Find Clinics with 0 departments
  const allClinics = await prisma.clinic.findMany();
  const clinicsToSync = [];

  for (const clinic of allClinics) {
    if (clinic.id === templateClinic.id) continue;

    const count = await prisma.department.count({
      where: { clinicId: clinic.id },
    });

    if (count === 0) {
      clinicsToSync.push(clinic);
    }
  }

  if (clinicsToSync.length === 0) {
    console.log('No clinics found with 0 departments. Nothing to sync.');
    return;
  }

  console.log(`Ready to sync departments to ${clinicsToSync.length} clinics:`, clinicsToSync.map(c => c.name));

  // 3. Fetch template departments ordered by level to preserve hierarchy
  const templateDepts = await prisma.department.findMany({
    where: { clinicId: templateClinic.id },
    orderBy: { level: 'asc' },
  });

  console.log(`Total departments to clone: ${templateDepts.length}`);

  // 4. Perform Cloning per Clinic
  for (const targetClinic of clinicsToSync) {
    console.log(`\nProcessing clinic: ${targetClinic.name}...`);
    const idMap = new Map<string, string>(); // Maps OLD ID -> NEW ID

    for (const dept of templateDepts) {
      const newDept = await prisma.department.create({
        data: {
          name: dept.name,
          description: dept.description,
          isActive: dept.isActive,
          sortOrder: dept.sortOrder,
          level: dept.level,
          clinicId: targetClinic.id,
          parentId: dept.parentId ? idMap.get(dept.parentId) : null,
        },
      });
      idMap.set(dept.id, newDept.id);
    }
    console.log(`Done! Created ${templateDepts.length} departments for ${targetClinic.name}.`);
  }

  console.log('\n--- ALL SYNC TASKS COMPLETED SUCCESSFULLY ---');
}

syncDepartments()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
