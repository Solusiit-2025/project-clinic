const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function checkOverall() { 
  const accounts = await prisma.chartOfAccount.findMany(); 
  
  // Check Opening Balance 
  let totalAssetOB = 0; 
  let totalLiabEquityOB = 0; 
  for (let acc of accounts) { 
    if (acc.category === 'ASSET' || acc.category === 'EXPENSE') { 
      totalAssetOB += acc.openingBalance; 
    } else { 
      totalLiabEquityOB += acc.openingBalance; 
    } 
  } 
  console.log(`Opening Balance -> Asset+Expense: ${totalAssetOB}, Liab+Eq+Rev: ${totalLiabEquityOB}, Diff: ${totalAssetOB - totalLiabEquityOB}`); 
} 
checkOverall().catch(console.error).finally(() => prisma.$disconnect());
