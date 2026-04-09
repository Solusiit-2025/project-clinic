import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- CLEANING UP ASSET TABLE ---')
  const deleted = await prisma.asset.deleteMany({})
  console.log(`Successfully deleted ${deleted.count} orphaned/duplicate assets.`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
