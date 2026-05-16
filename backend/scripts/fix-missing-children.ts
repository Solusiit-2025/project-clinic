import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Sinkronisasi Koneksi Anak Paket Lab ---')

  // Find the Masters
  const hb = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Hb (Hemoglobin)' } } })
  const ht = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Ht (Hematokrit)' } } })
  const leu = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Leu (Leukosit)' } } })
  const trom = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Trom (Trombosit)' } } })

  const kolesLengkap = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'KOLESTEROL LENGKAP' } } })
  const gp = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Gula Darah Puasa' } } })
  const pp = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Gula Darah 2 Jam PP' } } })
  const au = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'Asam Urat' } } })

  // Fix DARAH RUTIN 1 (Find any variation of the name)
  const dr1 = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'DARAH RUTIN 1' } } })
  if (dr1 && hb && ht && leu && trom) {
    await prisma.labTestMaster.update({
      where: { id: dr1.id },
      data: { children: { connect: [{ id: hb.id }, { id: ht.id }, { id: leu.id }, { id: trom.id }] } }
    })
    console.log('✔ DARAH RUTIN 1 connected to children.')
  }

  // Fix PAKET LENGKAP
  const pl = await prisma.labTestMaster.findFirst({ where: { name: { contains: 'PAKET LENGKAP' } } })
  if (pl && kolesLengkap && gp && pp && au) {
    await prisma.labTestMaster.update({
      where: { id: pl.id },
      data: { children: { connect: [{ id: kolesLengkap.id }, { id: gp.id }, { id: pp.id }, { id: au.id }] } }
    })
    console.log('✔ PAKET LENGKAP connected to children.')
  }

  console.log('✔ Sinkronisasi selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
