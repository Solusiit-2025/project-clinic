const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  const details = await prisma.journalDetail.findMany({ include: { coa: true } });
  
  let invalidCOA = [];
  let headerCOA = [];
  let missingCategory = [];
  let debitSum = 0;
  let creditSum = 0;

  for (let d of details) {
    debitSum += Number(d.debit);
    creditSum += Number(d.credit);

    if (!d.coa) {
      invalidCOA.push(d.id);
      continue;
    }

    if (d.coa.accountType !== 'DETAIL') {
      headerCOA.push({ id: d.id, coa: d.coa.code, type: d.coa.accountType });
    }

    const cat = d.coa.category;
    if (!['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(cat)) {
      missingCategory.push({ id: d.id, coa: d.coa.code, category: cat });
    }
  }

  console.log({
    debitSum, creditSum, diff: debitSum - creditSum,
    invalidCOA: invalidCOA.length,
    headerCOA: headerCOA.length,
    missingCategory: missingCategory.length
  });
}

checkDetails().catch(console.error).finally(() => prisma.$disconnect());
