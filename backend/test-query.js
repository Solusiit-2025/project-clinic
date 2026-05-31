const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } } });
async function check() {
  const d = new Date();
  const utcDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = utcDate.getUTCFullYear();
  const mm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utcDate.getUTCDate()).padStart(2, '0');
  const jakartaTodayStr = yyyy + '-' + mm + '-' + dd;
  const targetDate = new Date(jakartaTodayStr + 'T00:00:00+07:00');
  const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  console.log('Querying from', targetDate.toISOString(), 'to', nextDay.toISOString());

  const queues = await prisma.queueNumber.findMany({ 
    where: { 
      clinicId: '46176c91-1355-4fb9-acfe-1a753e296fd5',
      queueDate: { gte: targetDate, lt: nextDay }
    }
  });
  console.log('Found:', queues.length);
}
check().catch(console.error).finally(() => prisma.$disconnect());
