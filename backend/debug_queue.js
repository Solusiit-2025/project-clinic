const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const id = 'b004c7aa-cce6-4b0c-8eb2-096f0550643b'
  try {
    console.log('Fetching queue...')
    const queue = await prisma.queueNumber.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        department: true
      }
    })
    console.log('Queue data:', JSON.stringify(queue, null, 2))
  } catch (e) {
    console.error('Error fetching queue:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
