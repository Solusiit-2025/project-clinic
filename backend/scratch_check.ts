import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pmCount = await prisma.productMaster.count();
  const pCount = await prisma.product.count();
  console.log(`Product Master count: ${pmCount}`);
  console.log(`Product count: ${pCount}`);
  
  const products = await prisma.product.findMany();
  console.log("Products: ", products.map(p => ({id: p.id, branch: p.clinicId})));
}

main().catch(console.error).finally(() => prisma.$disconnect());
