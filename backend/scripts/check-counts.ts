import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const pm = await prisma.productMaster.count();
  const p = await prisma.product.count();
  const med = await prisma.medicine.count();
  const asset = await prisma.asset.count();
  console.log('--- DATABASE COUNTS ---');
  console.log(`ProductMaster: ${pm}`);
  console.log(`Product: ${p}`);
  console.log(`Medicine: ${med}`);
  console.log(`Asset: ${asset}`);
  console.log('------------------------');
  await prisma.$disconnect();
}
check();
