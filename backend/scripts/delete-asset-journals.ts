import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding asset-related journals...')
  
  // Find journal entries created by Asset module (referenceNo starts with ASSET- and entryType is SYSTEM)
  const journals = await prisma.journalEntry.findMany({
    where: {
      referenceNo: {
        startsWith: 'ASSET-'
      },
      entryType: 'SYSTEM'
    },
    include: {
      details: true
    }
  })
  
  console.log(`Found ${journals.length} journals to delete.`)
  
  for (const journal of journals) {
    console.log(`Deleting journal ${journal.referenceNo} (ID: ${journal.id})...`)
    
    // Delete details first
    await prisma.journalDetail.deleteMany({
      where: {
        journalEntryId: journal.id
      }
    })
    
    // Delete the journal entry
    await prisma.journalEntry.delete({
      where: {
        id: journal.id
      }
    })
    console.log(`Successfully deleted journal ${journal.referenceNo}`)
  }
  
  console.log('Done cleaning up asset journals.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
