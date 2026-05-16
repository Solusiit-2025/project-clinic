import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Menghubungkan Trombosit ke Banyak Induk ---')

  // 1. Cari Trombosit
  const trom = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Trombosit' } } })
  
  // 2. Cari Induk-Induknya
  const dr1 = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'DARAH RUTIN 1' } } })
  const dr2 = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'DARAH RUTIN 2' } } })

  if (trom && dr1 && dr2) {
    await prisma.labTestMaster.update({
      where: { id: trom.id },
      data: {
        parents: {
          connect: [
            { id: dr1.id },
            { id: dr2.id }
          ]
        }
      }
    })
    console.log(`✔ Trombosit berhasil dihubungkan ke: ${dr1.name} DAN ${dr2.name}`)
  }

  console.log('✔ Selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
