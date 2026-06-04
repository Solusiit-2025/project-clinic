import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const patient = await prisma.patient.findUnique({
    where: { id: '01eb037d-0572-4c7b-8cac-609df04b54ef' }
  })
  console.log('Patient found:', patient)

  if (!patient) {
      const allPatients = await prisma.patient.findMany({ take: 5 })
      console.log('Some existing patients:', allPatients.map(p => ({id: p.id, name: p.name})))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
