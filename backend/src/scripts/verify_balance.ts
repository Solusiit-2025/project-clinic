import { prisma } from '../lib/prisma';

async function main() {
  const journal = await prisma.journalEntry.findFirst({
    where: { description: { contains: 'Pengakuan' }, referenceNo: 'INV-20260505-0002' },
    include: { details: true }
  });

  if (journal) {
    const totalDebit = journal.details.reduce((sum, d) => sum + d.debit, 0);
    const totalCredit = journal.details.reduce((sum, d) => sum + d.credit, 0);
    console.log(`Journal: ${journal.description}`);
    console.log(`Total Debit: ${totalDebit}`);
    console.log(`Total Credit: ${totalCredit}`);
    journal.details.forEach(d => {
      console.log(`  - COA ID: ${d.coaId}, Debit: ${d.debit}, Credit: ${d.credit}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
