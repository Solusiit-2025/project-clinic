const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } } });
async function check() {
  try {
    const qs = await prisma.queueNumber.findMany({
      where: { clinicId: '46176c91-1355-4fb9-acfe-1a753e296fd5' },
      take: 1,
      include: {
        patient: { select: { id: true, name: true, medicalRecordNo: true, gender: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        department: { select: { id: true, name: true } },
        registration: {
          include: {
            medicalRecord: {
              include: { vitals: { orderBy: { recordedAt: 'desc' }, take: 1 } }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    console.log('Success!', qs.length);
  } catch (e) {
    console.error('Error during query:', e.message);
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
