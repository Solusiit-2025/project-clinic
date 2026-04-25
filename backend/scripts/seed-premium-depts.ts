import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Re-Structuring Premium Clinic Hierarchy ---')

  const structure = [
    {
      name: 'LAYANAN MEDIS SPESIALIS',
      code: 'ROOT-SPECIALIST',
      color: '#4f46e5', // Indigo
      children: [
        { name: 'Dental Care & Orthodontics', code: 'POL-DNT', color: '#818cf8' },
        { name: 'Poli Spesialis Anak (Pediatrics)', code: 'POL-ANK', color: '#818cf8' },
        { name: 'Poli Spesialis Kandungan & Kebidanan', code: 'POL-KND', color: '#818cf8' },
        { name: 'Poli Spesialis Penyakit Dalam', code: 'POL-DLM', color: '#818cf8' },
        { name: 'Poli Umum & Konsultasi', code: 'POL-UMM', color: '#818cf8' },
      ]
    },
    {
      name: 'DIAGNOSTIK & PENUNJANG MEDIS',
      code: 'ROOT-DIAGNOSTIC',
      color: '#0891b2', // Cyan
      children: [
        { name: 'Diagnostic & Imaging Suite', code: 'SUP-RAD', color: '#22d3ee' },
        { name: 'Laboratorium Klinik Modern', code: 'SUP-LAB', color: '#22d3ee' },
        { name: 'Farmasi & Apotek', code: 'SUP-FAR', color: '#22d3ee' },
      ]
    },
    {
      name: 'PREVENTIVE & EXECUTIVE CARE',
      code: 'ROOT-EXECUTIVE',
      color: '#b45309', // Amber
      children: [
        { name: 'Executive MCU Center', code: 'MCU-EXC', color: '#fbbf24' },
        { name: 'Wellness & Anti-Aging Clinic', code: 'WNS-ANC', color: '#fbbf24' },
      ]
    }
  ]

  for (const parentData of structure) {
    console.log(`Processing: ${parentData.name}...`)
    
    const parent = await prisma.department.upsert({
      where: { code: parentData.code },
      update: { name: parentData.name, color: parentData.color, level: 0, clinicId: null, isActive: true },
      create: { name: parentData.name, code: parentData.code, color: parentData.color, level: 0, clinicId: null, isActive: true }
    })

    for (const childData of parentData.children) {
      console.log(`  -> Mapping: ${childData.name}...`)
      await prisma.department.upsert({
        where: { code: childData.code },
        update: { 
          name: childData.name, 
          color: childData.color, 
          parentId: parent.id, 
          level: 1,
          clinicId: null,
          isActive: true
        },
        create: { 
          name: childData.name, 
          code: childData.code, 
          color: childData.color, 
          parentId: parent.id, 
          level: 1,
          clinicId: null,
          isActive: true
        }
      })
    }
  }

  console.log('--- Hierarchy Re-Structuring Done! ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
