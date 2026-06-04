import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      serviceCategory: true,
      department: true,
      clinic: true
    }
  })

  console.log(`Total services: ${services.length}`)
  console.log(services.map(s => ({
    id: s.id,
    name: s.serviceName,
    category: s.serviceCategory?.categoryName,
    department: s.department?.name,
    departmentId: s.departmentId,
    clinicId: s.clinicId
  })))

  const queue = await prisma.queueNumber.findUnique({
    where: { id: '747762aa-350d-4287-8d61-c8c23e81c833' },
    include: { department: true }
  })
  
  console.log('\nQueue Info:')
  console.log(queue)
}

main().catch(console.error).finally(() => prisma.$disconnect())
