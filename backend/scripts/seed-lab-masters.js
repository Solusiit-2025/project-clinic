const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- SEEDING LAB TEST MASTERS ---')
  
  const labData = [
    // Hematologi
    { code: 'HB', name: 'Hemoglobin', category: 'Hematologi', unit: 'g/dL', normalRangeText: '13.0 - 17.0', price: 25000 },
    { code: 'LEU', name: 'Leukosit', category: 'Hematologi', unit: '/uL', normalRangeText: '5.000 - 10.000', price: 25000 },
    { code: 'TRO', name: 'Trombosit', category: 'Hematologi', unit: '/uL', normalRangeText: '150.000 - 450.000', price: 25000 },
    { code: 'HMT', name: 'Hematokrit', category: 'Hematologi', unit: '%', normalRangeText: '40 - 52', price: 25000 },
    
    // Diabetes & Ginjal
    { code: 'GDS', name: 'Gula Darah Sewaktu', category: 'Diabetes', unit: 'mg/dL', normalRangeText: '< 200', price: 35000 },
    { code: 'GDP', name: 'Gula Darah Puasa', category: 'Diabetes', unit: 'mg/dL', normalRangeText: '70 - 110', price: 35000 },
    { code: 'UREUM', name: 'Ureum', category: 'Fungsi Ginjal', unit: 'mg/dL', normalRangeText: '15 - 45', price: 45000 },
    { code: 'CREA', name: 'Creatinine', category: 'Fungsi Ginjal', unit: 'mg/dL', normalRangeText: '0.6 - 1.2', price: 45000 },
    
    // Lipid
    { code: 'CHOL', name: 'Kolesterol Total', category: 'Lemak (Lipid)', unit: 'mg/dL', normalRangeText: '< 200', price: 50000 },
    { code: 'TRIG', name: 'Trigliserida', category: 'Lemak (Lipid)', unit: 'mg/dL', normalRangeText: '< 150', price: 55000 },
    { code: 'HDL', name: 'HDL (Kolesterol Baik)', category: 'Lemak (Lipid)', unit: 'mg/dL', normalRangeText: '> 40', price: 50000 },
    { code: 'LDL', name: 'LDL (Kolesterol Jahat)', category: 'Lemak (Lipid)', unit: 'mg/dL', normalRangeText: '< 130', price: 50000 },
    
    // Fungsi Hati
    { code: 'SGOT', name: 'SGOT (AST)', category: 'Fungsi Hati', unit: 'U/L', normalRangeText: '< 35', price: 40000 },
    { code: 'SGPT', name: 'SGPT (ALT)', category: 'Fungsi Hati', unit: 'U/L', normalRangeText: '< 45', price: 40000 },
  ]

  for (const item of labData) {
    await prisma.labTestMaster.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        category: item.category,
        unit: item.unit,
        normalRangeText: item.normalRangeText,
        price: item.price
      },
      create: {
        code: item.code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        normalRangeText: item.normalRangeText,
        price: item.price,
        isActive: true
      }
    })
    console.log(`✅ Upserted: ${item.name} (${item.code})`)
  }

  console.log('--- LAB TEST MASTERS SEEDING COMPLETED ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
