import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: {
      doctor: true
    }
  })

  console.log('--- User Data Debug ---')
  users.forEach(u => {
    console.log(`User: ${u.username} (${u.role})`)
    console.log(`- User Image Field: ${u.image}`)
    if (u.doctor) {
      console.log(`- Doctor Profile Picture: ${u.doctor.profilePicture}`)
    } else {
      console.log(`- No Doctor profile found`)
    }
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
