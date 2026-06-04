import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const patientId = '01eb037d-0572-4c7b-8cac-609df04b54ef'
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      medicalRecords: true,
      queueNumbers: true,
      registrations: true,
      appointments: true
    }
  })
  
  if (patient) {
      console.log('Patient MR:', patient.medicalRecords.length)
      console.log('MR details:', patient.medicalRecords.map(m => ({ id: m.id, doctorId: m.doctorId })))
      console.log('Patient Queue:', patient.queueNumbers.length)
      console.log('Patient Registrations:', patient.registrations.length)
      console.log('Patient Appointments:', patient.appointments.length)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
