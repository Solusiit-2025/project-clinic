import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Memperbarui Nilai Angka Rujukan di Master Lab ---')

  const masterUpdates = [
    { name: 'Hb (Hemoglobin)', min: 12.0, max: 16.0 },
    { name: 'Ht (Hematokrit)', min: 37.0, max: 47.0 },
    { name: 'Leu (Leukosit)', min: 5000, max: 10000 },
    { name: 'Trom (Trombosit)', min: 150000, max: 450000 },
    { name: 'HEMATOKRIT', min: 35.0, max: 50.0 }, // Broad range for both L/P
    { name: 'Eritrosit', min: 4.0, max: 5.0 },
  ]

  for (const update of masterUpdates) {
    const tests = await prisma.labTestMaster.findMany({
      where: { name: { contains: update.name, mode: 'insensitive' } }
    })

    for (const test of tests) {
      await prisma.labTestMaster.update({
        where: { id: test.id },
        data: {
          minNormal: update.min,
          maxNormal: update.max
        }
      })
      console.log(`Updated Master: ${test.name} -> Min: ${update.min}, Max: ${update.max}`)
    }
  }

  console.log('\n✔ Master Lab updated. Sekarang menjalankan perbaikan data lama...')

  // RUN FIX SCRIPT LOGIC
  const details = await prisma.labResultDetail.findMany({
    include: { testMaster: true }
  })

  let updateCount = 0
  for (const detail of details) {
    const val = detail.resultValue
    const master = detail.testMaster

    if (!val || !master) continue
    if (master.minNormal === null && master.maxNormal === null) continue

    const numVal = parseFloat(val.replace(',', '.'))
    if (isNaN(numVal)) continue

    let shouldBeCritical = false
    if (master.minNormal !== null && numVal < master.minNormal) {
      shouldBeCritical = true
    } else if (master.maxNormal !== null && numVal > master.maxNormal) {
      shouldBeCritical = true
    }

    if (detail.isCritical !== shouldBeCritical) {
      await prisma.labResultDetail.update({
        where: { id: detail.id },
        data: { isCritical: shouldBeCritical }
      })
      updateCount++
      console.log(`Fixing Record: ${master.name} (Hasil: ${val}) -> Now KRITIS`)
    }
  }

  console.log(`\n✔ Berhasil memperbaiki ${updateCount} data lama menjadi KRITIS!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
