import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding Data Lab Darah Rutin ---')

  // 1. Create DARAH RUTIN 1 Package
  const dr1 = await prisma.labTestMaster.upsert({
    where: { code: 'LAB-DR-01' },
    update: { name: 'DARAH RUTIN 1 (Hb,Ht,Leu,Trom)', price: 90000, category: 'HEMATOLOGI' },
    create: { 
      code: 'LAB-DR-01', 
      name: 'DARAH RUTIN 1 (Hb,Ht,Leu,Trom)', 
      price: 90000, 
      category: 'HEMATOLOGI' 
    }
  })

  // Add Children for DR 1
  const dr1Children = [
    { code: 'DR1-HB', name: 'Hb (Hemoglobin)', unit: 'g/dL', normalRange: '12.0 - 16.0' },
    { code: 'DR1-HT', name: 'Ht (Hematokrit)', unit: '%', normalRange: '37.0 - 47.0' },
    { code: 'DR1-LEU', name: 'Leu (Leukosit)', unit: '/uL', normalRange: '5.000 - 10.000' },
    { code: 'DR1-TROM', name: 'Trom (Trombosit)', unit: '/uL', normalRange: '150.000 - 450.000' },
  ]

  for (const child of dr1Children) {
    await prisma.labTestMaster.upsert({
      where: { code: child.code },
      update: { parentId: dr1.id, unit: child.unit, normalRangeText: child.normalRange },
      create: { 
        code: child.code, 
        name: child.name, 
        unit: child.unit, 
        normalRangeText: child.normalRange,
        category: 'HEMATOLOGI',
        price: 0,
        parentId: dr1.id
      }
    })
  }

  // 2. Create DARAH RUTIN 2 Package
  const dr2 = await prisma.labTestMaster.upsert({
    where: { code: 'LAB-DR-02' },
    update: { name: 'DARAH RUTIN 2 (Hb,Ht,Leu,Trom, Eri,Diff)', price: 95000, category: 'HEMATOLOGI' },
    create: { 
      code: 'LAB-DR-02', 
      name: 'DARAH RUTIN 2 (Hb,Ht,Leu,Trom, Eri,Diff)', 
      price: 95000, 
      category: 'HEMATOLOGI' 
    }
  })

  // Add Children for DR 2
  const dr2Children = [
    { code: 'DR2-HB', name: 'Hb (Hemoglobin)', unit: 'g/dL', normalRange: '12.0 - 16.0' },
    { code: 'DR2-HT', name: 'Ht (Hematokrit)', unit: '%', normalRange: '37.0 - 47.0' },
    { code: 'DR2-LEU', name: 'Leu (Leukosit)', unit: '/uL', normalRange: '5.000 - 10.000' },
    { code: 'DR2-TROM', name: 'Trom (Trombosit)', unit: '/uL', normalRange: '150.000 - 450.000' },
    { code: 'DR2-ERI', name: 'Eri (Eritrosit)', unit: 'juta/uL', normalRange: '4.0 - 5.0' },
    { code: 'DR2-DIFF', name: 'Diff (Hitung Jenis)', unit: '%', normalRange: '-' },
  ]

  for (const child of dr2Children) {
    await prisma.labTestMaster.upsert({
      where: { code: child.code },
      update: { parentId: dr2.id, unit: child.unit, normalRangeText: child.normalRange },
      create: { 
        code: child.code, 
        name: child.name, 
        unit: child.unit, 
        normalRangeText: child.normalRange,
        category: 'HEMATOLOGI',
        price: 0,
        parentId: dr2.id
      }
    })
  }

  console.log('✔ Berhasil membuat data Darah Rutin 1 & 2 beserta parameternya!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
