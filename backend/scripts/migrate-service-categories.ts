
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const CATEGORIES = ['consultation', 'treatment', 'test', 'procedure']

async function migrate() {
  console.log('Migrating service categories...')
  
  // 1. Create categories if they don't exist
  for (const name of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { categoryName: name },
      update: {},
      create: { categoryName: name }
    })
  }

  // 2. Fetch all categories
  const allCats = await prisma.serviceCategory.findMany()
  const catMap = new Map(allCats.map(c => [c.categoryName, c.id]))

  // 3. Update existing services
  const services = await prisma.service.findMany({
    where: { categoryId: null }
  })

  for (const s of services) {
    if (s.category && catMap.has(s.category)) {
      await prisma.service.update({
        where: { id: s.id },
        data: { categoryId: catMap.get(s.category) }
      })
    }
  }

  console.log('Migration complete.')
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
