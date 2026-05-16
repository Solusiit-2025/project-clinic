import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Migrasi Koneksi Lab ke Sistem Many-to-Many ---')

  const testsWithParent = await prisma.labTestMaster.findMany({
    where: { parentId: { not: null } }
  })

  console.log(`Menemukan ${testsWithParent.length} koneksi untuk dimigrasi...`)

  for (const test of testsWithParent) {
    if (test.parentId) {
      await prisma.labTestMaster.update({
        where: { id: test.id },
        data: {
          parents: {
            connect: { id: test.parentId }
          }
        }
      })
      console.log(`Migrated: ${test.name} -> Terhubung ke Induk (ID: ${test.parentId})`)
    }
  }

  console.log('\n✔ Migrasi selesai! Sekarang sistem Many-to-Many sudah sinkron dengan data lama.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
