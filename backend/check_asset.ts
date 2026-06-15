import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const assets = await prisma.asset.findMany({
    where: {
      assetName: {
        in: ['Running Tex', 'Alat Laboratorium']
      }
    },
    include: {
      masterProduct: true
    }
  });

  console.log("=== DATA ASSET ===");
  assets.forEach(a => {
    console.log(`Asset: ${a.assetName}`);
    console.log(`- Asset Code: ${a.assetCode}`);
    console.log(`- Linked to Master Product: ${a.masterProductId ? 'YES' : 'NO'}`);
    if (a.masterProduct) {
      console.log(`  - Master Name: ${a.masterProduct.masterName}`);
      console.log(`  - Master Code: ${a.masterProduct.masterCode}`);
    }
    console.log('---------------------------');
  });

  const masterProducts = await prisma.productMaster.findMany({
    where: {
      masterName: {
        in: ['Running Tex', 'Alat Laboratorium']
      }
    }
  });

  console.log("\n=== DATA MASTER PRODUK ===");
  if (masterProducts.length === 0) {
    console.log("Tidak ditemukan satupun di ProductMaster dengan nama tersebut.");
  } else {
    masterProducts.forEach(m => {
      console.log(`Master Product: ${m.masterName}`);
      console.log(`- Master Code: ${m.masterCode}`);
      console.log('---------------------------');
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
