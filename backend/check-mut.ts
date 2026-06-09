import { prisma } from './src/lib/prisma';

async function main() {
  const stocks = await prisma.inventoryStock.findMany({
    where: { 
      productId: 'fc1c9fa6-6906-4cc1-84fe-bc5117178486',
      branchId: '46176c91-1355-4fb9-acfe-1a753e296fd5'
    }
  });

  console.log(JSON.stringify(stocks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
