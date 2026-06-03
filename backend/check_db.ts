import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const labTests = await prisma.labTestMaster.findMany({
    include: {
      children: true,
      parents: true
    }
  })

  console.log(JSON.stringify(labTests.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    children: t.children.map(c => c.name),
    parents: t.parents.map(p => p.name)
  })), null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
