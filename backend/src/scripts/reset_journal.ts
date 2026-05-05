import { prisma } from '../lib/prisma';

async function main() {
  const invoiceNo = 'INV-20260505-0002';
  
  // 1. Find the bad journal entry
  const journal = await prisma.journalEntry.findFirst({
    where: { referenceNo: invoiceNo, entryType: 'SYSTEM' }
  });

  if (journal) {
    // 2. Delete the old journal and its details
    await prisma.journalDetail.deleteMany({ where: { journalEntryId: journal.id } });
    await prisma.journalEntry.delete({ where: { id: journal.id } });
    console.log(`Deleted bad journal for ${invoiceNo}`);
  }

  // 3. Mark invoice as not posted so it can be reposted via the UI or here
  await prisma.invoice.update({
    where: { invoiceNo },
    data: { isPosted: false }
  });
  console.log(`Reset isPosted for ${invoiceNo}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
