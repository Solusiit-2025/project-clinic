import { prisma } from '../lib/prisma';

async function main() {
  const parent = await prisma.chartOfAccount.findUnique({
    where: { id: 'fa4cb4a6-fba2-46d9-bb23-e7d6f890685f' }
  });
  console.log(JSON.stringify(parent, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
