const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const doctors = await prisma.doctor.findMany()
  console.log('Doctors:', JSON.stringify(doctors, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
