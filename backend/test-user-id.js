const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://clinic:Amigos2010@77.37.44.232:5432/clinic_db' } } });
async function check() {
  const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  console.log(user.id);
}
check().catch(console.error).finally(() => prisma.$disconnect());
