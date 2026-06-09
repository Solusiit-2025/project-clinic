const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function checkRec() { 
  const stock = await prisma.inventoryStock.findMany({ include: { product: true } }); 
  let totalStockVal = 0; 
  for (let s of stock) { 
    totalStockVal += s.quantity * (s.unitCost || 0); 
  } 
  const glDetails = await prisma.journalDetail.aggregate({ 
    where: { coa: { code: '1-1301-K001' } }, 
    _sum: { debit: true, credit: true } 
  }); 
  const glVal = (glDetails._sum.debit || 0) - (glDetails._sum.credit || 0); 
  console.log('Stock Value:', totalStockVal, 'GL Value:', glVal, 'Diff:', glVal - totalStockVal); 
} 
checkRec().catch(console.error).finally(() => prisma.$disconnect());
