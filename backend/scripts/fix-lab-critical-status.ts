import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Memulai Perbaikan Status Kritis Data Lab Lama ---')

  const details = await prisma.labResultDetail.findMany({
    include: {
      testMaster: true
    }
  })

  let updateCount = 0

  for (const detail of details) {
    const val = detail.resultValue
    const master = detail.testMaster

    if (!val || !master) continue

    // Only process if minNormal or maxNormal is set
    if (master.minNormal === null && master.maxNormal === null) continue

    const numVal = parseFloat(val.replace(',', '.'))
    if (isNaN(numVal)) continue

    let shouldBeCritical = false
    if (master.minNormal !== null && numVal < master.minNormal) {
      shouldBeCritical = true
    } else if (master.maxNormal !== null && numVal > master.maxNormal) {
      shouldBeCritical = true
    }

    // Update if status is different
    if (detail.isCritical !== shouldBeCritical) {
      await prisma.labResultDetail.update({
        where: { id: detail.id },
        data: { isCritical: shouldBeCritical }
      })
      updateCount++
      console.log(`Updated: ${master.name} - Nilai: ${val} -> Status: ${shouldBeCritical ? 'KRITIS' : 'Normal'}`)
    }
  }

  console.log(`\n✔ Selesai! Berhasil memperbarui ${updateCount} data lab lama.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
