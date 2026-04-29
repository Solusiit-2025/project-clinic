import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding compound formulas...')

  // Ambil beberapa obat yang ada untuk dijadikan komponen
  const paracetamol = await prisma.medicine.findFirst({ where: { medicineName: { contains: 'Paracetamol', mode: 'insensitive' } } })
  const ctm = await prisma.medicine.findFirst({ where: { medicineName: { contains: 'CTM', mode: 'insensitive' } } })
  const vitaminC = await prisma.medicine.findFirst({ where: { medicineName: { contains: 'Vitamin C', mode: 'insensitive' } } })
  const amoxicillin = await prisma.medicine.findFirst({ where: { medicineName: { contains: 'Amoxicillin', mode: 'insensitive' } } })

  if (!paracetamol || !ctm || !vitaminC) {
    console.log('⚠️  Obat dasar tidak ditemukan. Pastikan sudah ada data Medicine.')
    console.log('   Seed ini membutuhkan: Paracetamol, CTM, Vitamin C')
    return
  }

  // Formula 1: Racikan Flu Standar
  const fluFormula = await prisma.compoundFormula.upsert({
    where: { formulaCode: 'FRM-FLU-001' },
    update: {},
    create: {
      formulaCode: 'FRM-FLU-001',
      formulaName: 'Racikan Flu Standar',
      description: 'Formula standar untuk mengatasi gejala flu: demam, pilek, bersin',
      category: 'Flu & Pilek',
      dosageForm: 'Kapsul',
      defaultQty: 10,
      defaultDosage: '3x1',
      defaultFrequency: '3 kali sehari',
      defaultDuration: '3 hari',
      defaultInstructions: 'Diminum sesudah makan',
      tuslahPrice: 5000,
      isActive: true,
      clinicId: null, // Global formula
      items: {
        create: [
          {
            medicineId: paracetamol.id,
            quantity: 1,
            unit: 'tablet',
            notes: 'Untuk menurunkan demam',
            sortOrder: 1,
          },
          {
            medicineId: ctm.id,
            quantity: 0.5,
            unit: 'tablet',
            notes: 'Antihistamin untuk pilek',
            sortOrder: 2,
          },
          {
            medicineId: vitaminC.id,
            quantity: 1,
            unit: 'tablet',
            notes: 'Meningkatkan daya tahan tubuh',
            sortOrder: 3,
          },
        ],
      },
    },
    include: { items: { include: { medicine: true } } },
  })

  console.log('✅ Created:', fluFormula.formulaName, `(${fluFormula.items.length} komponen)`)

  // Formula 2: Racikan Batuk Kering
  if (amoxicillin) {
    const batukFormula = await prisma.compoundFormula.upsert({
      where: { formulaCode: 'FRM-BATUK-001' },
      update: {},
      create: {
        formulaCode: 'FRM-BATUK-001',
        formulaName: 'Racikan Batuk Kering',
        description: 'Formula untuk batuk kering dengan antibiotik',
        category: 'Batuk',
        dosageForm: 'Kapsul',
        defaultQty: 12,
        defaultDosage: '3x1',
        defaultFrequency: '3 kali sehari',
        defaultDuration: '4 hari',
        defaultInstructions: 'Diminum sesudah makan, habiskan antibiotik',
        tuslahPrice: 7000,
        isActive: true,
        clinicId: null,
        items: {
          create: [
            {
              medicineId: amoxicillin.id,
              quantity: 1,
              unit: 'kapsul',
              notes: 'Antibiotik',
              sortOrder: 1,
            },
            {
              medicineId: ctm.id,
              quantity: 0.5,
              unit: 'tablet',
              notes: 'Meredakan batuk',
              sortOrder: 2,
            },
          ],
        },
      },
      include: { items: { include: { medicine: true } } },
    })

    console.log('✅ Created:', batukFormula.formulaName, `(${batukFormula.items.length} komponen)`)
  }

  // Formula 3: Racikan Alergi
  const alergiFormula = await prisma.compoundFormula.upsert({
    where: { formulaCode: 'FRM-ALERGI-001' },
    update: {},
    create: {
      formulaCode: 'FRM-ALERGI-001',
      formulaName: 'Racikan Alergi Ringan',
      description: 'Formula untuk mengatasi gejala alergi ringan',
      category: 'Alergi',
      dosageForm: 'Puyer',
      defaultQty: 6,
      defaultDosage: '2x1',
      defaultFrequency: '2 kali sehari',
      defaultDuration: '3 hari',
      defaultInstructions: 'Diminum pagi dan malam',
      tuslahPrice: 4000,
      isActive: true,
      clinicId: null,
      items: {
        create: [
          {
            medicineId: ctm.id,
            quantity: 1,
            unit: 'tablet',
            notes: 'Antihistamin utama',
            sortOrder: 1,
          },
          {
            medicineId: vitaminC.id,
            quantity: 0.5,
            unit: 'tablet',
            notes: 'Antioksidan',
            sortOrder: 2,
          },
        ],
      },
    },
    include: { items: { include: { medicine: true } } },
  })

  console.log('✅ Created:', alergiFormula.formulaName, `(${alergiFormula.items.length} komponen)`)

  console.log('\n🎉 Seeding compound formulas selesai!')
  console.log('   Total formula:', await prisma.compoundFormula.count())
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
