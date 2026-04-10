import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: 'Admin Bekasi' },
    include: {
      clinics: {
        include: { clinic: true }
      }
    }
  })

  if (!user) {
    console.log('User not found')
    return
  }

  console.log('User:', user.name, '| Role:', user.role)
  console.log('Assigned Clinics:')
  user.clinics.forEach(uc => {
    console.log(`- ${uc.clinic.name} | ID: ${uc.clinic.id} | isMain: ${uc.clinic.isMain}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
