import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function check() {
  const depts = await p.department.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      clinicId: true,
      clinic: { select: { name: true, code: true } }
    },
    take: 15
  })

  console.log(JSON.stringify(depts, null, 2))

  const byClinic = await p.department.groupBy({
    by: ['clinicId'],
    _count: { id: true }
  })

  console.log('\nDepartments by Clinic:')
  console.log(JSON.stringify(byClinic, null, 2))
}

check()
  .finally(() => p.$disconnect())
