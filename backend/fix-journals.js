const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { syncAllInventoryToLedger } = require('./src/services/inventoryLedger.service');

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
  // Using ts-node or requiring TS files from a JS script might fail unless we use ts-node.
}
main();
