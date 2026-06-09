import { PrismaClient } from '@prisma/client';
import { syncAllInventoryToLedger } from './src/services/inventoryLedger.service';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting old journals...");
  const deletedJournals = await prisma.journalEntry.deleteMany({
    where: {
      OR: [
        { referenceNo: { startsWith: 'INV-MUT-' } },
        { referenceNo: { startsWith: 'OPENING-' } }
      ],
      entryType: 'SYSTEM'
    }
  });
  console.log(`Deleted ${deletedJournals.count} old journals.`);

  console.log("Resyncing mutations...");
  const retroResult = await syncAllInventoryToLedger();
  console.log("Retro Result:", retroResult);
}
main();
