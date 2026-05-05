const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { medicalRecordNo: 'RM-20260414-0001' }
  })
  if (!patient) {
    console.log('Patient not found')
    return
  }
  const mr = await prisma.medicalRecord.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    include: { labOrders: true }
  })
  console.log('Medical Records for Aris:', JSON.stringify(mr, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
