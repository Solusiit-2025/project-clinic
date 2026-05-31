const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ 
  datasources: { 
    db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } 
  } 
});

async function check() {
  const queues = await prisma.queueNumber.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 5, 
    include: { patient: { select: { name: true } } } 
  });
  console.log(JSON.stringify(queues, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
