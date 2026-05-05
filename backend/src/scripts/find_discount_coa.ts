import { prisma } from '../lib/prisma';

async function main() {
  const coas = await prisma.chartOfAccount.findMany({
    where: {
      OR: [
        { name: { contains: 'Discount', mode: 'insensitive' } },
        { name: { contains: 'Potongan', mode: 'insensitive' } },
        { code: { startsWith: '4-110' } }
      ]
    }
  });
  console.log(JSON.stringify(coas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
