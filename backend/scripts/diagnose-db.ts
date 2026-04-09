import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- DATABASE DIAGNOSIS ---')

  const clinics = await prisma.clinic.findMany()
  console.log(`\nClinics (${clinics.length}):`)
  clinics.forEach(c => console.log(`- [${c.id}] ${c.name} (${c.code})`))

  const users = await prisma.user.findMany({
    include: { clinics: { include: { clinic: true } } }
  })
  console.log(`\nUsers (${users.length}):`)
  users.forEach(u => {
    const uc = u.clinics.map(c => `${c.clinic.name} (${c.clinic.id})`).join(', ')
    console.log(`- [${u.id}] ${u.username} (${u.role}) -> Clinics: ${uc}`)
  })

  const assets = await prisma.asset.findMany()
  console.log(`\nAssets (${assets.length}):`)
  const grouped = assets.reduce((acc, a) => {
    acc[a.clinicId || 'no-clinic'] = (acc[a.clinicId || 'no-clinic'] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  Object.entries(grouped).forEach(([cid, count]) => {
    const clinicName = clinics.find(c => c.id === cid)?.name || 'Unknown'
    console.log(`- Clinic [${cid}] (${clinicName}): ${count} assets`)
  })

  if (assets.length > 0) {
    console.log('\nSample Asset Detail:')
    console.log(JSON.stringify(assets[0], null, 2))
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
