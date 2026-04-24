import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const all = await prisma.journalEntry.findMany({
    include: { details: true }
  })
  console.log(`Total Journal Entries: ${all.length}`)
  for (const je of all) {
    console.log(`- Ref: ${je.referenceNo} | Desc: ${je.description} | Details: ${je.details.length}`)
  }
}

check().catch(console.error).finally(() => prisma.$disconnect())
