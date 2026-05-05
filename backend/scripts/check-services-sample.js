const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany({
    take: 10
  })
  console.log('Sample Services:', JSON.stringify(services, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
