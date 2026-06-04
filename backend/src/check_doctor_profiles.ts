import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctor: true }
  })
  
  users.forEach(u => {
      console.log(`User: ${u.username}, has doctor profile: ${!!u.doctor}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
