import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const patient = await prisma.patient.findFirst({
    where: { name: { contains: 'Siti Aminah', mode: 'insensitive' } }
  })
  
  if (!patient) {
    console.log('Patient not found')
    return
  }
  
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const queues = await prisma.queueNumber.findMany({
    where: { 
      patientId: patient.id,
      queueDate: { gte: today }
    },
    include: {
      registration: true
    }
  })
  
  console.log('Queues for Siti Aminah today:')
  console.log(JSON.stringify(queues, null, 2))
  
  for (const q of queues) {
    const mr = await prisma.medicalRecord.findUnique({
      where: { registrationId: q.registrationId || '' },
      include: { vitals: true }
    })
    console.log(`Medical Record for queue ${q.queueNo}:`)
    console.log(JSON.stringify(mr, null, 2))
  }
}

check().finally(() => prisma.$disconnect())
