const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const mrId = "11e96678-a6da-4554-9b29-658f0aa0b0e8"
  const patientId = "4c6eb0a4-9658-43a2-bd96-27efd5f6bc68"
  const doctorId = "68e8d64f-f702-458d-93a2-fb0faef7cbb5"
  
  const order = await prisma.labOrder.create({
    data: {
      orderNo: "LAB-TEST-123",
      medicalRecordId: mrId,
      patientId: patientId,
      doctorId: doctorId,
      status: "pending",
      orderDate: new Date()
    }
  })
  console.log('Order created:', order)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
