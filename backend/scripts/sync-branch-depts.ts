import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncDepartments() {
  console.log('--- PREMIUM DEPARTMENT FORCE SYNC TOOL ---');

  // 1. Identify Template Clinic (K001 - Pusat)
  const templateClinic = await prisma.clinic.findFirst({
    where: { code: 'K001' },
  });

  if (!templateClinic) {
    console.error('Error: Clinic K001 (Template) not found.');
    process.exit(1);
  }

  console.log(`Master Template: ${templateClinic.name} (${templateClinic.code})`);

  // 2. Find all other clinics to sync
  const otherClinics = await prisma.clinic.findMany({
    where: {
      NOT: { id: templateClinic.id }
    }
  });

  if (otherClinics.length === 0) {
    console.log('No other clinics found. Nothing to sync.');
    return;
  }

  console.log(`Syncing premium structure to ${otherClinics.length} branches...`);

  // 3. Fetch template departments ordered by level to preserve hierarchy
  const templateDepts = await prisma.department.findMany({
    where: { clinicId: templateClinic.id },
    orderBy: { level: 'asc' },
  });

  console.log(`Total departments to clone: ${templateDepts.length}`);

  // 4. Perform Sync per Clinic (Delete and Re-clone)
  for (const targetClinic of otherClinics) {
    console.log(`\n🔄 Processing branch: ${targetClinic.name} (${targetClinic.code})...`);
    
    // Clear existing depts for this branch to ensure clean hierarchical structure
    await prisma.department.deleteMany({
      where: { clinicId: targetClinic.id }
    });
    console.log(`   - Cleared existing departments.`);

    const idMap = new Map<string, string>(); // Maps TEMPLATE ID -> NEW BRANCH ID

    for (const dept of templateDepts) {
      const newDept = await prisma.department.create({
        data: {
          name: dept.name,
          description: dept.description,
          isActive: dept.isActive,
          sortOrder: dept.sortOrder,
          level: dept.level,
          clinicId: targetClinic.id,
          // If the template dept had a parent, find the equivalent new ID in the branch
          parentId: dept.parentId ? idMap.get(dept.parentId) : null,
        },
      });
      idMap.set(dept.id, newDept.id);
    }
    console.log(`   ✅ Success! Created ${templateDepts.length} departments for ${targetClinic.name}.`);
  }

  console.log('\n--- ALL BRANCHES ARE NOW SYNCHRONIZED WITH PREMIUM STRUCTURE ---');
}

syncDepartments()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
