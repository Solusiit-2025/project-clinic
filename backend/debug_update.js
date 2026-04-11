const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const id = 'b004c7aa-cce6-4b0c-8eb2-096f0550643b'
  try {
    console.log('Attempting to update queue status...')
    const data = { status: 'called' }
    data.actualCallTime = new Date()
    data.callCounter = { increment: 1 }

    const queue = await prisma.queueNumber.update({
      where: { id },
      data,
      include: {
        patient: {
           select: { id: true, name: true, medicalRecordNo: true, gender: true }
        },
        doctor: {
           select: { id: true, name: true, specialization: true }
        },
        department: {
           select: { id: true, name: true }
        }
      }
    })
    console.log('Update successful!')
    console.log('New data:', JSON.stringify(queue, null, 2))
  } catch (e) {
    console.error('UPDATE FAILED!')
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
