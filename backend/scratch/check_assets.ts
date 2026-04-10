
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany({
    include: { clinic: true }
  });
  console.log('Total Assets:', assets.length);
  const distribution = assets.reduce((acc: any, curr) => {
    acc[curr.clinic?.name || 'Unknown'] = (acc[curr.clinic?.name || 'Unknown'] || 0) + 1;
    return acc;
  }, {});
  console.log('Distribution:', JSON.stringify(distribution, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
