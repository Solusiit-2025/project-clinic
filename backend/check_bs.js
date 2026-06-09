const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalanceSheet() {
  const plAccounts = await prisma.chartOfAccount.findMany({
    where: { accountType: 'DETAIL', category: { in: ['REVENUE', 'EXPENSE'] } }
  });

  const aggregatesPL = await prisma.journalDetail.groupBy({
    by: ['coaId'],
    _sum: { debit: true, credit: true }
  });

  const aggregatePLMap = new Map(aggregatesPL.map(a => [a.coaId, a._sum]));

  const plResult = plAccounts.map((acc) => {
    const sums = aggregatePLMap.get(acc.id) || { debit: 0, credit: 0 };
    const totalDebit = sums.debit || 0;
    const totalCredit = sums.credit || 0;
    if (acc.category === 'REVENUE') {
      return (Number(totalCredit) - Number(totalDebit));
    } else {
      return -(Number(totalDebit) - Number(totalCredit));
    }
  });

  const currentYearEarnings = plResult.reduce((sum, val) => sum + val, 0);

  const bsAccounts = await prisma.chartOfAccount.findMany({
    where: { accountType: 'DETAIL', category: { in: ['ASSET', 'LIABILITY', 'EQUITY'] } }
  });

  const aggregatesBS = await prisma.journalDetail.groupBy({
    by: ['coaId'],
    _sum: { debit: true, credit: true }
  });

  const aggregateBSMap = new Map(aggregatesBS.map(a => [a.coaId, a._sum]));

  const balances = bsAccounts.map((acc) => {
    const sums = aggregateBSMap.get(acc.id) || { debit: 0, credit: 0 };
    const totalDebit = Number(sums.debit) || 0;
    const totalCredit = Number(sums.credit) || 0;
    const net = totalDebit - totalCredit;
    
    let balance = 0;
    if (acc.category === 'ASSET') {
      balance = Number(acc.openingBalance) + net;
    } else {
      balance = Number(acc.openingBalance) + (totalCredit - totalDebit);
    }
    return { category: acc.category, balance };
  });

  const assets = balances.filter(b => b.category === 'ASSET');
  const liabilities = balances.filter(b => b.category === 'LIABILITY');
  const equities = balances.filter(b => b.category === 'EQUITY');

  const totalAssets = assets.reduce((sum, i) => sum + i.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, i) => sum + i.balance, 0);
  const totalEquityOnly = equities.reduce((sum, i) => sum + i.balance, 0);

  console.log({
    totalAssets,
    totalLiabilities,
    totalEquityOnly,
    currentYearEarnings,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquityOnly + currentYearEarnings,
    diff: totalAssets - (totalLiabilities + totalEquityOnly + currentYearEarnings)
  });
}

checkBalanceSheet().catch(console.error).finally(() => prisma.$disconnect());
