const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clinics = await prisma.clinic.findMany();
  console.log('CLINICS:', JSON.stringify(clinics, null, 2));

  const products = await prisma.product.findMany({
    include: {
      clinic: true,
      masterProduct: true
    }
  });
  console.log('PRODUCTS:', JSON.stringify(products.map(p => ({
    masterName: p.masterProduct.masterName,
    productName: p.productName,
    clinicId: p.clinicId,
    clinicName: p.clinic.name,
    isMain: p.clinic.isMain
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
