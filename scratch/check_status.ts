import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const q = await prisma.queueNumber.findFirst({
    where: { queueNo: 'A-003' },
    orderBy: { createdAt: 'desc' },
    include: { registration: true }
  })
  
  if (!q) {
    console.log('Queue A-003 not found')
    return
  }
  
  console.log('--- QUEUE A-003 ---')
  console.log('Status:', q.status)
  console.log('Registration ID:', q.registrationId)
  
  const mr = await prisma.medicalRecord.findUnique({
    where: { registrationId: q.registrationId || '' },
    include: { vitals: true }
  })
  
  console.log('--- MEDICAL RECORD ---')
  console.log('Exist:', !!mr)
  if (mr) {
    console.log('Created At:', mr.recordDate)
    console.log('Vitals Count:', mr.vitals.length)
  }
}

check().finally(() => prisma.$disconnect())
