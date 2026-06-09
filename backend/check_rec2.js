const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function checkRec() { 
  const stock = await prisma.inventoryStock.findMany({ include: { product: true } }); 
  let totalStockVal = 0; 
  for (let s of stock) { 
    let qty = Number(s.onHandQty) || 0; 
    let cost = Number(s.unitCost) || 0; 
    totalStockVal += qty * cost; 
  } 
  const glDetails = await prisma.journalDetail.aggregate({ 
    where: { coa: { code: '1-1301-K001' } }, 
    _sum: { debit: true, credit: true } 
  }); 
  const glVal = Number(glDetails._sum.debit || 0) - Number(glDetails._sum.credit || 0); 
  console.log('Stock Value:', totalStockVal, 'GL Value:', glVal, 'Diff:', glVal - totalStockVal); 
} 
checkRec().catch(console.error).finally(() => prisma.$disconnect());
