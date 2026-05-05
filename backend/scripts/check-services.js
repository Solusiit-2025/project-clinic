const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany({
    where: {
      serviceName: { contains: 'DARAH' }
    }
  })
  console.log('Services:', JSON.stringify(services, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
