import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Memulai Seeding Master Lab di VPS ---')

  // 1. Helper to create or get master
  const upsertMaster = async (data: any) => {
    // Generate code if missing
    if (!data.code) {
      data.code = 'LAB-' + data.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 15)
    }

    const existing = await prisma.labTestMaster.findFirst({
      where: { name: data.name }
    })
    if (existing) {
      return await prisma.labTestMaster.update({
        where: { id: existing.id },
        data
      })
    }
    return await prisma.labTestMaster.create({ data })
  }

  // --- PARAMETERS DEFINITION ---
  
  // Hematology
  const hb = await upsertMaster({ name: 'Hb (Hemoglobin)', category: 'HEMATOLOGI', unit: 'g/dL', normalRangeText: '12.0 - 16.0', minNormal: 12.0, maxNormal: 16.0, price: 0 })
  const ht = await upsertMaster({ name: 'Ht (Hematokrit)', category: 'HEMATOLOGI', unit: '%', normalRangeText: '37.0 - 47.0', minNormal: 37.0, maxNormal: 47.0, price: 0 })
  const leu = await upsertMaster({ name: 'Leu (Leukosit)', category: 'HEMATOLOGI', unit: '/uL', normalRangeText: '5.000 - 10.000', minNormal: 5000, maxNormal: 10000, price: 0 })
  const trom = await upsertMaster({ name: 'Trom (Trombosit)', category: 'HEMATOLOGI', unit: '/uL', normalRangeText: '150.000 - 450.000', minNormal: 150000, maxNormal: 450000, price: 0 })
  const eri = await upsertMaster({ name: 'Eri (Eritrosit)', category: 'HEMATOLOGI', unit: 'juta/uL', normalRangeText: '4.0 - 5.0', minNormal: 4.0, maxNormal: 5.0, price: 0 })
  const diff = await upsertMaster({ name: 'Diff (Hitung Jenis)', category: 'HEMATOLOGI', unit: '%', normalRangeText: '-', price: 0 })

  // Lipid Profile
  const cholTotal = await upsertMaster({ name: 'Cholesterol Total', category: 'PROFIL LEMAK', unit: 'mg/dL', normalRangeText: '< 200', maxNormal: 200, price: 35000 })
  const tg = await upsertMaster({ name: 'Trigliserida', category: 'PROFIL LEMAK', unit: 'mg/dL', normalRangeText: '< 150', maxNormal: 150, price: 35000 })
  const hdl = await upsertMaster({ name: 'HDL Cholesterol', category: 'PROFIL LEMAK', unit: 'mg/dL', normalRangeText: '> 40', minNormal: 40, price: 35000 })
  const ldl = await upsertMaster({ name: 'LDL Cholesterol', category: 'PROFIL LEMAK', unit: 'mg/dL', normalRangeText: '< 130', maxNormal: 130, price: 35000 })

  // General Chemistry
  const gulaPuasa = await upsertMaster({ name: 'Gula Darah Puasa', category: 'KIMIA DARAH', unit: 'mg/dL', normalRangeText: '70 - 110', minNormal: 70, maxNormal: 110, price: 25000 })
  const gula2pp = await upsertMaster({ name: 'Gula Darah 2 Jam PP', category: 'KIMIA DARAH', unit: 'mg/dL', normalRangeText: '< 140', maxNormal: 140, price: 25000 })
  const gulaSewaktu = await upsertMaster({ name: 'Gula Darah Sewaktu', category: 'KIMIA DARAH', unit: 'mg/dL', normalRangeText: '< 140', maxNormal: 140, price: 25000 })
  const asamUrat = await upsertMaster({ name: 'Asam Urat', category: 'KIMIA DARAH', unit: 'mg/dL', normalRangeText: 'L: 3.4-7.0, P: 2.4-5.7', minNormal: 2.4, maxNormal: 7.0, price: 30000 })

  // Stick Items (Distinguished)
  const cholStick = await upsertMaster({ name: 'Kolesterol (Stick)', category: 'STICK JARI', unit: 'mg/dL', normalRangeText: '< 200', maxNormal: 200, price: 35000 })
  const gulaStick = await upsertMaster({ name: 'Gula Darah (Stick)', category: 'STICK JARI', unit: 'mg/dL', normalRangeText: '< 140', maxNormal: 140, price: 20000 })
  const auStick = await upsertMaster({ name: 'Asam Urat (Stick)', category: 'STICK JARI', unit: 'mg/dL', normalRangeText: 'L: 3.4-7.0, P: 2.4-5.7', minNormal: 2.4, maxNormal: 7.0, price: 25000 })

  // --- PACKAGES ---

  // 1. DARAH RUTIN 1
  await upsertMaster({
    name: 'DARAH RUTIN 1 (Hb,Ht,Leu,Trom)',
    category: 'HEMATOLOGI',
    price: 90000,
    children: { connect: [{ id: hb.id }, { id: ht.id }, { id: leu.id }, { id: trom.id }] }
  })

  // 2. DARAH RUTIN 2
  await upsertMaster({
    name: 'DARAH RUTIN 2 (Hb,Ht,Leu,Trom, Eri,Diff)',
    category: 'HEMATOLOGI',
    price: 95000,
    children: { connect: [{ id: hb.id }, { id: ht.id }, { id: leu.id }, { id: trom.id }, { id: eri.id }, { id: diff.id }] }
  })

  // 3. KOLESTEROL LENGKAP
  const packLipid = await upsertMaster({
    name: 'KOLESTEROL LENGKAP (Chol,Tg,HDL,LDL)',
    category: 'PROFIL LEMAK',
    price: 125000,
    children: { connect: [{ id: cholTotal.id }, { id: tg.id }, { id: hdl.id }, { id: ldl.id }] }
  })

  // 4. CEK STICK JARI
  await upsertMaster({
    name: 'CEK STICK JARI (Kolesterol,Gula,Asam urat)',
    category: 'STICK JARI',
    price: 75000,
    children: { connect: [{ id: cholStick.id }, { id: gulaStick.id }, { id: auStick.id }] }
  })

  // 5. CEK ALAT VENA
  await upsertMaster({
    name: 'CEK ALAT VENA (Kolesterol,Gula,Asam urat)',
    category: 'KIMIA DARAH',
    price: 85000,
    children: { connect: [{ id: cholTotal.id }, { id: gulaSewaktu.id }, { id: asamUrat.id }] }
  })

  // 6. PAKET LENGKAP
  await upsertMaster({
    name: 'PAKET LENGKAP (Koles.Lengkap,GP,2PP,AU)',
    category: 'PAKET CHECKUP',
    price: 250000,
    children: { 
      connect: [
        { id: packLipid.id }, 
        { id: gulaPuasa.id }, 
        { id: gula2pp.id }, 
        { id: asamUrat.id }
      ] 
    }
  })

  console.log('✔ Seeding selesai! Semua paket dan parameter sudah siap di VPS.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
