import { prisma } from '../lib/prisma';

async function main() {
  const invoiceNo = 'INV-20260505-0002';
  
  const journals = await prisma.journalEntry.findMany({
    where: { 
      OR: [
        { referenceNo: invoiceNo },
        { description: { contains: invoiceNo } }
      ]
    },
    include: { details: { include: { coa: true } } }
  });

  console.log(`Found ${journals.length} journals for ${invoiceNo}`);
  console.log(JSON.stringify(journals, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
