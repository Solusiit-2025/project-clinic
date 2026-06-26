import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetDateStr = '2026-06-26';
  const s = new Date(`${targetDateStr}T00:00:00+07:00`);
  const e = new Date(`${targetDateStr}T23:59:59+07:00`);

  console.log(`Checking data between ${s.toISOString()} and ${e.toISOString()}`);

  // 1. Invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'paid',
      invoiceDate: { gte: s, lte: e }
    },
    select: {
      id: true,
      invoiceNo: true,
      total: true,
      status: true,
      invoiceDate: true
    }
  });

  const invoiceTotal = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  console.log('--- INVOICES ---');
  console.log(`Count: ${invoices.length}`);
  console.log(`Total: ${invoiceTotal}`);
  invoices.forEach(inv => console.log(`  ${inv.invoiceNo} | ${inv.total} | ${inv.invoiceDate}`));

  // 2. Journal Details
  const journals = await prisma.journalDetail.findMany({
    where: {
      coa: { category: 'REVENUE' },
      journalEntry: { date: { gte: s, lte: e } }
    },
    include: {
      journalEntry: { select: { referenceNo: true, date: true, description: true } },
      coa: { select: { name: true, code: true } }
    }
  });

  const journalCredit = journals.reduce((sum, j) => sum + Number(j.credit || 0), 0);
  const journalDebit = journals.reduce((sum, j) => sum + Number(j.debit || 0), 0);
  const journalNet = journalCredit - journalDebit;
  
  console.log('\n--- JOURNAL (REVENUE) ---');
  console.log(`Count: ${journals.length}`);
  console.log(`Net Revenue: ${journalNet} (Credit: ${journalCredit}, Debit: ${journalDebit})`);
  journals.forEach(j => {
    console.log(`  ${j.journalEntry.referenceNo} | ${j.coa.name} | +${j.credit} -${j.debit} | ${j.journalEntry.date} | ${j.journalEntry.description}`);
  });

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
