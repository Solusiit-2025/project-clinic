const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const docs = await prisma.doctor.findMany({ select: { name: true, specialization: true } });
  console.log(docs);
}
main().finally(() => prisma.$disconnect());
