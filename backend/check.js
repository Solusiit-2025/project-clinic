const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.patient.findFirst({
    where: { name: { contains: 'Jasmine Veronica' } },
    include: { treatmentPlans: true }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
