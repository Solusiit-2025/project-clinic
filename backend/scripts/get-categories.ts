import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const categories = await prisma.asset.findMany({
    select: { category: true },
    distinct: ['category']
  })
  console.log(JSON.stringify(categories))
}
main().finally(() => prisma.$disconnect())
