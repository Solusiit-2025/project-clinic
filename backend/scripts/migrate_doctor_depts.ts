const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration: Doctor -> Department (Many-to-Many)...');
  
  const doctors = await prisma.doctor.findMany({
    where: {
      departmentId: { not: null }
    }
  });

  console.log(`Found ${doctors.length} doctors with current department assignments.`);

  for (const doctor of doctors) {
    if (doctor.departmentId) {
      console.log(`Migrating Doctor ${doctor.name} to Department ID ${doctor.departmentId}...`);
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          departments: {
            connect: { id: doctor.departmentId }
          }
        }
      });
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
