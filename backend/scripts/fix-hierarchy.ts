import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- NUCLEAR CLEANING & FIXING HIERARCHY ---')

  // 1. Create/Update Parents
  const parents = [
    { name: 'LAYANAN MEDIS SPESIALIS', code: 'ROOT-MED' },
    { name: 'DIAGNOSTIK & PENUNJANG', code: 'ROOT-SUP' },
    { name: 'LAYANAN EKSEKUTIF (MCU)', code: 'ROOT-EXE' }
  ]

  const parentMap: any = {}
  for (const p of parents) {
    const created = await prisma.department.upsert({
      where: { code: p.code },
      update: { name: p.name, level: 0, clinicId: null },
      create: { name: p.name, code: p.code, level: 0, clinicId: null }
    })
    parentMap[p.name] = created.id
    console.log(`Parent Ready: ${p.name}`)
  }

  // 2. Data Mapping
  const mapping = [
    { name: 'Dental Care & Orthodontics', parent: 'LAYANAN MEDIS SPESIALIS', code: 'POL-DNT' },
    { name: 'Poli Spesialis Anak (Pediatrics)', parent: 'LAYANAN MEDIS SPESIALIS', code: 'POL-ANK' },
    { name: 'Poli Spesialis Kandungan & Kebidanan', parent: 'LAYANAN MEDIS SPESIALIS', code: 'POL-KND' },
    { name: 'Poli Spesialis Penyakit Dalam', parent: 'LAYANAN MEDIS SPESIALIS', code: 'POL-DLM' },
    { name: 'Diagnostic & Imaging Suite', parent: 'DIAGNOSTIK & PENUNJANG', code: 'SUP-RAD' },
    { name: 'Executive MCU Center', parent: 'LAYANAN EKSEKUTIF (MCU)', code: 'MCU-EXC' }
  ]

  for (const item of mapping) {
    console.log(`Re-creating: ${item.name}...`)
    
    // HAPUS SEMUA yang punya nama ini atau kode ini agar tidak ada bentrok sama sekali
    await prisma.department.deleteMany({
      where: {
        OR: [
          { name: item.name },
          { code: item.code }
        ]
      }
    })

    // Buat Baru Paling Bersih
    await prisma.department.create({
      data: {
        name: item.name,
        code: item.code,
        parentId: parentMap[item.parent],
        level: 1,
        clinicId: null,
        isActive: true,
        description: `Layanan ${item.name} kelas premium.`
      }
    })
  }

  console.log('--- FIX TOTAL BERHASIL! Silakan Refresh Halaman ---')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
