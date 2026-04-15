const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIsolation(clinicId) {
  console.log(`\nTesting STRICT Isolation for Clinic ID: ${clinicId}`);
  
  const products = await prisma.productMaster.findMany({
    where: {
      products: {
        some: {
          clinicId: clinicId
        }
      }
    },
    include: {
      products: {
        where: { clinicId: clinicId },
        select: { clinicId: true, productName: true }
      }
    }
  });

  console.log(`Found ${products.length} products.`);
  products.forEach(p => {
    console.log(`- ${p.masterName} (Locally registered as: ${p.products[0]?.productName})`);
  });
}

async function main() {
  const BEKASI_ID = 'c546aafa-0ea1-45e1-b383-2ba8452322cd';
  const PUSAT_ID = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c';
  const RANDOM_ID = '00000000-0000-4000-a000-000000000000';

  await testIsolation(BEKASI_ID);
  await testIsolation(PUSAT_ID);
  await testIsolation(RANDOM_ID);
}

main().finally(() => prisma.$disconnect());
