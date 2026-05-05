const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const clinics = await prisma.clinic.findMany()
  console.log('Clinics:', JSON.stringify(clinics, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
