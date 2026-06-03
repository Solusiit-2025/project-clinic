const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const mr = await prisma.medicalRecord.findMany({ 
    where: { 
      patient: { medicalRecordNo: 'RM-2026-046177' } 
    }, 
    include: { secondaryIcd10s: true, patient: true } 
  }); 
  console.log(JSON.stringify(mr, null, 2)); 
} 

main().finally(() => prisma.$disconnect());
