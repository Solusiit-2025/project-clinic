const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.labOrder.findMany({
    include: {
      patient: { select: { name: true } },
      medicalRecord: true
    }
  })
  console.log('Lab Orders:', JSON.stringify(orders, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
