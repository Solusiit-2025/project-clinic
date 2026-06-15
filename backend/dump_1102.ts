import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const coa1102 = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '2-1102' } }
  });

  const coaIds = coa1102.map(c => c.id);

  const items = await prisma.journalDetail.findMany({
    where: {
      coaId: { in: coaIds }
    },
    include: {
      journalEntry: true,
      coa: true
    },
    orderBy: {
      journalEntry: {
        date: 'asc'
      }
    }
  });

  let output = "=== Hutang Jasa Medik (2-1102) ===\n";
  let balance = 0;

  for (const item of items) {
    const netCredit = item.credit - item.debit;
    balance += netCredit;

    output += `[${item.journalEntry.date.toISOString().split('T')[0]}] ${item.coa.code} - ${item.journalEntry.description}\n`;
    output += `   Debit: ${item.debit} | Credit: ${item.credit} | Ref: ${item.journalEntry.referenceNo} | Balance After: ${balance}\n`;
  }

  output += `\n=== SALDO AKHIR: ${balance} ===\n`;
  fs.writeFileSync('liabilities_1102_dump.txt', output);
  console.log("Dump written to liabilities_1102_dump.txt");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
