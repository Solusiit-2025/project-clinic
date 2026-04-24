const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCode() {
  const code = 'MSTR-MED-BR-K001-1-dddb';
  
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { productCode: code },
        { sku: code }
      ]
    },
    include: { masterProduct: true, clinic: true }
  });

  if (product) {
    console.log('--- Product Found ---');
    console.log(`ID: ${product.id}`);
    console.log(`Name: ${product.productName}`);
    console.log(`Code: ${product.productCode}`);
    console.log(`SKU: ${product.sku}`);
    console.log(`Branch: ${product.clinic?.name} (${product.clinic?.code})`);
    console.log(`Master: ${product.masterProduct?.masterName} (${product.masterProduct?.masterCode})`);
  } else {
    const master = await prisma.productMaster.findFirst({
      where: {
        OR: [
          { masterCode: code },
          { sku: code }
        ]
      }
    });

    if (master) {
      console.log('--- Product Master Found ---');
      console.log(`ID: ${master.id}`);
      console.log(`Name: ${master.masterName}`);
      console.log(`Code: ${master.masterCode}`);
      console.log(`SKU: ${master.sku}`);
    } else {
      console.log('Code not found in Product or ProductMaster');
    }
  }
  
  await prisma.$disconnect();
}

findCode();
