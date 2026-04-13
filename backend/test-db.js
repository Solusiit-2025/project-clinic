const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const depts = await prisma.department.findMany();
  console.log('Departments:', depts);

  const docs = await prisma.doctor.findMany({ include: { departments: true }});
  console.log('Doctors:', docs);

  const clinics = await prisma.clinic.findMany();
  console.log('Clinics:', clinics);
  
  process.exit(0);
}

check();
