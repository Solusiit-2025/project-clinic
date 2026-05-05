import { prisma } from '../lib/prisma';

async function main() {
  const code = '1-1101-K001';
  const acc = await prisma.chartOfAccount.findFirst({ where: { code } });
  if (!acc) return;

  const entries = await prisma.journalDetail.findMany({
    where: {
      coaId: acc.id,
      NOT: { journalEntry: { clinicId: 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c' } }
    },
    include: { journalEntry: true }
  });

  console.log(`Found ${entries.length} entries for ${acc.name} outside Pusat clinic:`);
  entries.forEach(e => {
    console.log(`- Date: ${e.journalEntry.date}, Desc: ${e.journalEntry.description}, ClinicId: ${e.journalEntry.clinicId}, Debit: ${e.debit}, Credit: ${e.credit}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
