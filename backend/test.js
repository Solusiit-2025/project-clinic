const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const entries = await prisma.journalEntry.findMany({
    where: { referenceNo: { startsWith: 'DEP' } },
    include: { details: { include: { coa: true } } }
  })
  console.log(JSON.stringify(entries, null, 2))
}
main().finally(() => prisma.$disconnect())
