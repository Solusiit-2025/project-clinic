const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const branchId = '46176c91-1355-4fb9-acfe-1a753e296fd5';
  
  const allStocks = await prisma.inventoryStock.findMany({
    where: { branchId, onHandQty: { gt: 0 } },
    include: { batch: true, product: true }
  });
  
  let exactTotal = 0;
  for (const s of allStocks) {
    const price = s.batch?.purchasePrice ?? s.product?.purchasePrice ?? 0;
    exactTotal += (s.onHandQty * price);
  }
  
  console.log("Exact total from InventoryStock:", exactTotal);
  
  const products = await prisma.product.findMany({
    where: { clinicId: branchId, quantity: { gt: 0 } }
  });
  
  let prodTotal = 0;
  for (const p of products) {
    prodTotal += (p.quantity * (p.purchasePrice || 0));
  }
  console.log("Total from Product table:", prodTotal);
  
  // also check GL
  const account = await prisma.chartOfAccount.findFirst({ where: { code: '1-1301-K001' } });
  if (account) {
    const details = await prisma.journalDetail.findMany({ where: { coaId: account.id } });
    let totalDebit = 0;
    let totalCredit = 0;
    for (const d of details) {
      if (d.debit) totalDebit += d.debit;
      if (d.credit) totalCredit += d.credit;
    }
    console.log("GL 1-1301-K001 Balance:", totalDebit - totalCredit);
  }
}
check().finally(() => prisma.$disconnect());
