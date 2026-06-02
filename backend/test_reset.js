const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReset() {
  try {
    await prisma.$transaction(async (tx) => {
      // 2. Inventory & Stock
      await tx.directMedicinePurchaseItem.deleteMany({ where: {} });
      await tx.directMedicinePurchase.deleteMany({ where: {} });
    });
    console.log("Success");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testReset().finally(() => prisma.$disconnect());
