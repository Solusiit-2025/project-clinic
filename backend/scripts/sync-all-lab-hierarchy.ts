import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Sinkronisasi TOTAL Master Lab (Banyak Induk) ---')

  // Helper to find master by name
  const find = async (name: string) => prisma.labTestMaster.findFirst({ where: { name: { contains: name } } })

  // 1. Parameters
  const hb = await find('Hb (Hemoglobin)')
  const ht = await find('Ht (Hematokrit)')
  const leu = await find('Leu (Leukosit)')
  const trom = await find('Trom (Trombosit)')
  const eri = await find('Eri (Eritrosit)')
  const diff = await find('Diff (Hitung Jenis)')
  
  const chol = await find('Cholesterol Total')
  const tg = await find('Trigliserida')
  const hdl = await find('HDL Cholesterol')
  const ldl = await find('LDL Cholesterol')
  
  const gp = await find('Gula Darah Puasa')
  const pp = await find('Gula Darah 2 Jam PP')
  const au = await find('Asam Urat')
  
  const cholStick = await find('Kolesterol (Stick)')
  const gulaStick = await find('Gula Darah (Stick)')
  const auStick = await find('Asam Urat (Stick)')

  // 2. Packages
  const dr1 = await find('DARAH RUTIN 1')
  const dr2 = await find('DARAH RUTIN 2')
  const kl = await find('KOLESTEROL LENGKAP')
  const stick = await find('CEK STICK JARI')
  const vena = await find('CEK ALAT VENA')
  const paketLengkap = await find('PAKET LENGKAP')

  // --- CONNECTING ---

  const connect = async (parent: any, children: any[]) => {
    if (!parent) return
    const ids = children.filter(c => !!c).map(c => ({ id: c.id }))
    await prisma.labTestMaster.update({
      where: { id: parent.id },
      data: { children: { connect: ids } }
    })
  }

  console.log('Menghubungkan Darah Rutin 1...')
  await connect(dr1, [hb, ht, leu, trom])

  console.log('Menghubungkan Darah Rutin 2...')
  await connect(dr2, [hb, ht, leu, trom, eri, diff])

  console.log('Menghubungkan Kolesterol Lengkap...')
  await connect(kl, [chol, tg, hdl, ldl])

  console.log('Menghubungkan Cek Stick Jari...')
  await connect(stick, [cholStick, gulaStick, auStick])

  console.log('Menghubungkan Cek Alat Vena...')
  // Vena usually uses general masters but distinct package
  const gs = await find('Gula Darah Sewaktu')
  await connect(vena, [chol, gs, au])

  console.log('Menghubungkan Paket Lengkap...')
  await connect(paketLengkap, [kl, gp, pp, au])

  console.log('\n✔ SEMUA DATA SUDAH SINKRON DAN LENGKAP!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
