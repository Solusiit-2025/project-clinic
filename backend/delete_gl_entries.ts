import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const journals = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { description: { contains: 'Running Tex' } },
        { description: { contains: 'Alat Laborator' } }
      ]
    },
    include: {
      details: true
    }
  });

  if (journals.length === 0) {
    console.log("No matching Journal Entries found.");
    return;
  }

  console.log("Found Journal Entries to delete:");
  for (const entry of journals) {
    console.log(`- ID: ${entry.id}, Date: ${entry.date}, Desc: ${entry.description}`);
  }

  console.log("\nDeleting entries...");
  const deleteDetails = await prisma.journalDetail.deleteMany({
    where: {
      journalEntryId: {
        in: journals.map(e => e.id)
      }
    }
  });
  
  const deleteJournals = await prisma.journalEntry.deleteMany({
    where: {
      id: {
        in: journals.map(e => e.id)
      }
    }
  });

  console.log(`Deleted ${deleteDetails.count} journal details and ${deleteJournals.count} journal entries.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
