const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const targetClinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c';
  
  try {
      let departments = await prisma.department.findMany({
          where: {
            OR: [
              { clinicId: targetClinicId },
              { clinicId: null }
            ] 
          },
          include: { parent: true }
      });
      console.log('Departments query result size:', departments.length);
      console.log('First 2 departments:', departments.slice(0,2).map(d => `${d.name} (clinicId: ${d.clinicId}, parentId: ${d.parentId})`));
      
      const doctors = await prisma.doctor.findMany({
          where: {
              OR: [
                { departments: { some: { clinicId: targetClinicId } } },
                { user: { clinics: { some: { clinicId: targetClinicId } } } }
              ]
          },
          include: { user: { include: { clinics: true } } }
      });
      console.log('Doctors query result size:', doctors.length);
      console.log('Doctors Details:', JSON.stringify(doctors.map(d=>({name: d.name, userClinics: d.user?.clinics})), null, 2));

  } catch(e) {
      console.error(e);
  } finally {
      process.exit(0);
  }
}

check();
