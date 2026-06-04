const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const account = await prisma.chartOfAccount.findFirst({ where: { code: '1-1301-K001' } });
  
  const details = await prisma.journalDetail.findMany({ 
    where: { coaId: account.id }, 
    include: { journalEntry: true },
  });
  
  const productTotals = {};
  
  for (const d of details) {
    const desc = d.description || d.journalEntry.description;
    
    // Extract product name roughly
    let prod = 'Unknown';
    if (desc.includes('Penyesuaian Stok')) {
      const match = desc.match(/:\s*(.*?)\s*qty=/);
      if (match) prod = match[1];
    } else if (desc.includes('HPP Stok Keluar:')) {
      const match = desc.match(/HPP Stok Keluar:\s*(.*?)\s*\(/);
      if (match) prod = match[1];
    } else if (desc.includes('Penerimaan Pembelian:')) {
      prod = 'Purchase: ' + desc;
    }
    
    if (!productTotals[prod]) productTotals[prod] = { debit: 0, credit: 0 };
    productTotals[prod].debit += (d.debit || 0);
    productTotals[prod].credit += (d.credit || 0);
  }
  
  console.log("GL Balance by Product extracted from Description:");
  let glSum = 0;
  for (const [prod, totals] of Object.entries(productTotals)) {
    const net = totals.debit - totals.credit;
    console.log(`${prod}: Debit ${totals.debit}, Credit ${totals.credit}, Net: ${net}`);
    glSum += net;
  }
  console.log("Total GL Net:", glSum);
  
  console.log("\nActual Product Values in DB:");
  const products = await prisma.product.findMany({
    where: { clinicId: '46176c91-1355-4fb9-acfe-1a753e296fd5' }
  });
  
  let dbSum = 0;
  for (const p of products) {
    const val = (p.quantity || 0) * (p.purchasePrice || 0);
    if (val !== 0) {
      console.log(`${p.productName}: Qty ${p.quantity}, Price ${p.purchasePrice}, Value: ${val}`);
      dbSum += val;
    }
  }
  console.log("Total DB Value:", dbSum);
}
check().finally(() => prisma.$disconnect());
