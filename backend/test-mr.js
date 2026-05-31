const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } } });
async function check() {
  const qs = await prisma.queueNumber.findMany({ 
    where: { clinicId: '46176c91-1355-4fb9-acfe-1a753e296fd5', queueDate: { gte: new Date('2026-05-30T17:00:00Z') } },
    include: { registration: { include: { medicalRecord: true } } }
  });
  console.log(qs.map(q => ({ queueNo: q.queueNo, status: q.status, hasMR: !!q.registration.medicalRecord })));
}
check().catch(console.error).finally(() => prisma.$disconnect());
