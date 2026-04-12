import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Clinic Mapping: [Old ID in Backup] -> [New ID in current DB]
const clinicMap: Record<string, string> = {
  "cdf427a7-bf4d-478e-97e7-7f24c214f584": "dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c", // Pusat
  "2f33c982-33d9-416b-bb9c-90602896da7d": "c546aafa-0ea1-45e1-b383-2ba8452322cd", // Bekasi
}

async function main() {
  const sqlFile = path.resolve(__dirname, '../../backups/backup-2026-04-11T03-10-42-105Z.sql')
  console.log(`Reading SQL file: ${sqlFile}`)
  const content = fs.readFileSync(sqlFile, 'utf8')

  console.log('🧹 Cleaning current records for a clean UUID-based restore...')
  // Order matters for FK constraints
  await prisma.inventoryTransaction.deleteMany({})
  await prisma.inventory.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.asset.deleteMany({})
  await prisma.productMaster.deleteMany({})
  await prisma.medicine.deleteMany({})
  await prisma.productCategory.deleteMany({})
  console.log('✨ Workspace cleaned.')

  function extractCopyData(tableName: string) {
    const startPattern = `COPY public.${tableName}`
    const endPattern = '\\.'
    const startIndex = content.indexOf(startPattern)
    if (startIndex === -1) return []

    const headerEndIndex = content.indexOf(';', startIndex)
    const dataStartIndex = content.indexOf('\n', headerEndIndex) + 1
    const dataEndIndex = content.indexOf(endPattern, dataStartIndex)
    
    const rawData = content.slice(dataStartIndex, dataEndIndex).trim()
    if (!rawData) return []

    return rawData.split('\n').map(line => {
      return line.split('\t').map(val => val === '\\N' ? null : val)
    })
  }

  // 1. Restore Product Categories
  console.log('📦 Restoring Product Categories...')
  const cats = extractCopyData('product_categories')
  for (const row of cats) {
    // id, categoryName, description, isActive, createdAt, updatedAt
    await prisma.productCategory.create({
      data: { 
        id: row[0]!, 
        categoryName: row[1]!, 
        description: row[2], 
        isActive: row[3] === 't',
        createdAt: new Date(row[4]!),
        updatedAt: new Date(row[5]!)
      }
    })
  }
  console.log(`✅ ${cats.length} Categories restored.`)

  // 2. Restore Medicines
  console.log('💊 Restoring Medicines...')
  const meds = extractCopyData('medicines')
  for (const row of meds) {
    // id, medicineName, genericName, description, dosageForm, strength, manufacturer, batchNumber, expiryDate, isActive, etc.
    // Fields: id, medicineName, genericName, description, dosageForm, strength, manufacturer, batchNumber, expiryDate, isActive, createdAt, updatedAt, image, clinicId, medicineCode
    await prisma.medicine.upsert({
      where: { id: row[0]! },
      update: { medicineName: row[1]! },
      create: {
        id: row[0]!,
        medicineName: row[1]!,
        genericName: row[2]!,
        description: row[3],
        dosageForm: row[4],
        strength: row[5],
        manufacturer: row[6],
        batchNumber: row[7],
        expiryDate: row[8] ? new Date(row[8]) : null,
        isActive: row[9] === 't',
        createdAt: new Date(row[10]!),
        updatedAt: new Date(row[11]!),
        image: row[12],
        clinicId: row[13] ? (clinicMap[row[13]!] || row[13]) : null,
        medicineCode: row[14]
      }
    })
  }
  console.log(`✅ ${meds.length} Medicines restored.`)

  // 3. Restore Product Masters
  console.log('📋 Restoring Product Masters...')
  const masters = extractCopyData('product_masters')
  for (const row of masters) {
    // id, masterCode, masterName, description, isActive, createdAt, updatedAt, medicineId, categoryId, image
    await prisma.productMaster.upsert({
      where: { id: row[0]! },
      update: { masterName: row[2]! },
      create: {
        id: row[0]!,
        masterCode: row[1]!,
        masterName: row[2]!,
        description: row[3],
        isActive: row[4] === 't',
        createdAt: new Date(row[5]!),
        updatedAt: new Date(row[6]!),
        medicineId: row[7],
        categoryId: row[8],
        image: row[9]
      }
    })
  }
  console.log(`✅ ${masters.length} Product Masters restored.`)

  // 4. Restore Assets
  console.log('🏛️ Restoring Assets...')
  const assets = extractCopyData('assets')
  for (const row of assets) {
    // id, assetCode, assetName, assetType, category, description, serialNumber, manufacturer, model, purchaseDate, 
    // purchasePrice, currentValue, condition, location, supplier, warrantyExpiry, maintenanceSchedule, etc.
    // Index mapping (from header seen in grep):
    // 0:id, 1:assetCode, 2:assetName, 3:assetType, 4:category, 5:description, 6:serialNum, 7:manufacturer, 8:model, 
    // 9:purchaseDate, 10:purchasePrice, 11:currentValue, 12:condition, 13:location, 14:supplier, 15:warrantyExp, 16:maintenanceSched 
    // 17:lastMaint, 18:status, 19:notes, 20:attach, 21:createdAt, 22:updatedAt, 23:clinicId, 24:image, 25:masterProductId
    await prisma.asset.upsert({
      where: { id: row[0]! },
      update: { assetName: row[2]! },
      create: {
        id: row[0]!,
        assetCode: row[1]!,
        assetName: row[2]!,
        assetType: row[3]!,
        category: row[4]!,
        description: row[5],
        serialNumber: row[6],
        manufacturer: row[7],
        model: row[8],
        purchaseDate: new Date(row[9]!),
        purchasePrice: row[10] ? parseFloat(row[10]) : 0,
        currentValue: row[11] ? parseFloat(row[11]) : null,
        condition: row[12] || 'good',
        location: row[13],
        supplier: row[14],
        warrantyExpiry: row[15] ? new Date(row[15]) : null,
        maintenanceSchedule: row[16],
        lastMaintenanceDate: row[17] ? new Date(row[17]) : null,
        status: row[18] || 'active',
        notes: row[19],
        attachmentUrl: row[20],
        createdAt: new Date(row[21]!),
        updatedAt: new Date(row[22]!),
        clinicId: row[23] ? (clinicMap[row[23]!] || row[23]) : null,
        image: row[24],
        masterProductId: row[25]
      }
    })
  }
  console.log(`✅ ${assets.length} Assets restored.`)

  console.log('--- RESTORE COMPLETED SUCCESSFULLY ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
