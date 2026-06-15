import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== Dashboard Logic ===");
  const totalRevenueAgg = await prisma.journalDetail.aggregate({
    where: { coa: { category: 'REVENUE' } },
    _sum: { debit: true, credit: true }
  });
  const totalExpenseAgg = await prisma.journalDetail.aggregate({
    where: { coa: { category: 'EXPENSE' } },
    _sum: { debit: true, credit: true }
  });

  const totalRevValue = (totalRevenueAgg._sum.credit || 0) - (totalRevenueAgg._sum.debit || 0);
  const totalExpValue = (totalExpenseAgg._sum.debit || 0) - (totalExpenseAgg._sum.credit || 0);
  console.log(`Dashboard Revenue: ${totalRevValue}`);
  console.log(`Dashboard Expense: ${totalExpValue}`);
  console.log(`Dashboard Profit:  ${totalRevValue - totalExpValue}`);


  console.log("\n=== P&L Logic ===");
  const accounts = await prisma.chartOfAccount.findMany({
    where: { category: { in: ['REVENUE', 'EXPENSE'] } }
  });

  const details = await prisma.journalDetail.findMany({
    where: {
      coaId: { in: accounts.map(a => a.id) },
    },
    select: { coaId: true, debit: true, credit: true }
  });

  const aggregateMap = new Map<string, { debit: number; credit: number }>();
  for (const d of details) {
    const sums = aggregateMap.get(d.coaId) || { debit: 0, credit: 0 };
    sums.debit += d.debit;
    sums.credit += d.credit;
    aggregateMap.set(d.coaId, sums);
  }

  const reportData = accounts.map((acc) => {
    const sums = aggregateMap.get(acc.id) || { debit: 0, credit: 0 };
    const totalDebit = sums.debit || 0;
    const totalCredit = sums.credit || 0;

    const balance = acc.category === 'REVENUE'
      ? (totalCredit - totalDebit)
      : (totalDebit - totalCredit);

    return { ...acc, balance };
  });

  const revenueItems = [];
  const doctorShareItems = [];
  const expenseItems = [];

  for (const item of reportData) {
    if (item.balance === 0) continue;

    let isContraRevenue = false;
    if (item.category === 'REVENUE' && item.code.startsWith('4-0')) isContraRevenue = true;
    if (item.category === 'REVENUE' && item.balance < 0) isContraRevenue = true;
    if (item.category === 'EXPENSE' && item.code.startsWith('6-1102')) isContraRevenue = true;

    if (isContraRevenue) {
      doctorShareItems.push({ ...item, balance: Math.abs(item.balance) });
    } else if (item.category === 'REVENUE' && item.balance > 0) {
      revenueItems.push(item);
    } else if (item.category === 'EXPENSE' && item.balance > 0) {
      expenseItems.push(item);
    }
  }

  const totalGrossRevenue = revenueItems.reduce((sum, i) => sum + i.balance, 0);
  const totalDoctorShare = doctorShareItems.reduce((sum, i) => sum + i.balance, 0);
  const netClinicRevenue = totalGrossRevenue - totalDoctorShare;
  const totalExpense = expenseItems.reduce((sum, i) => sum + i.balance, 0);
  const netProfit = netClinicRevenue - totalExpense;

  console.log(`P&L Gross Rev:    ${totalGrossRevenue}`);
  console.log(`P&L Doctor Share: ${totalDoctorShare}`);
  console.log(`P&L Net Clinic Rev:${netClinicRevenue}`);
  console.log(`P&L Expense:      ${totalExpense}`);
  console.log(`P&L Profit:       ${netProfit}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
