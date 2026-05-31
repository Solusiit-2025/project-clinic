const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } } });
async function check() {
  const users = await prisma.user.findMany({ 
    where: { role: 'SUPER_ADMIN' }
  });
  console.log(users.map(u => u.email));
}
check().catch(console.error).finally(() => prisma.$disconnect());
