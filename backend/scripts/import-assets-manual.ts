import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING MANUAL ASSET IMPORT ---')

  const clinic = await prisma.clinic.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!clinic) {
    console.error('No clinic found.')
    return
  }

  const facilityCat = await prisma.productCategory.findUnique({ where: { categoryName: 'Facility' } })
  const securityCat = await prisma.productCategory.findUnique({ where: { categoryName: 'Security' } })

  const assets = [
    {
      id: "0b69c830-ad54-460b-b9be-702055287307",
      assetCode: "AS-FAC-AC-R2-K001",
      assetName: "AC Panasonic 1PK Inverter (Ruang Periksa 2)",
      assetType: "furniture", // based on snippet
      category: "Facility",
      description: "Operational Asset for Clinic Support",
      manufacturer: "Panasonic",
      model: "CS-PU9XKP",
      purchaseDate: new Date("2026-01-09"),
      purchasePrice: 6500000,
      currentValue: 6175000,
      condition: "excellent",
      maintenanceSchedule: "Quarterly",
      status: "active",
      categoryId: facilityCat?.id
    },
    {
      id: "f1a546f7-a4b3-4608-958e-a290229b1c74",
      assetCode: "AS-FAC-CCTV-K001",
      assetName: "CCTV System Hikvision 8-CH (Full HD)",
      assetType: "equipment", // based on snippet
      category: "Security",
      description: "Operational Asset for Clinic Support",
      manufacturer: "Hikvision",
      model: "Turbo HD 8CH",
      purchaseDate: new Date("2026-01-09"),
      purchasePrice: 8500000,
      currentValue: 8075000,
      condition: "excellent",
      maintenanceSchedule: "Quarterly",
      status: "active",
      categoryId: securityCat?.id
    }
  ]

  for (const a of assets) {
    // 1. Create/Update ProductMaster first
    const master = await prisma.productMaster.upsert({
      where: { masterCode: a.assetCode },
      update: { 
        masterName: a.assetName,
        description: a.description,
        categoryId: a.categoryId
      },
      create: {
        masterCode: a.assetCode,
        masterName: a.assetName,
        description: a.description,
        categoryId: a.categoryId,
        isActive: true
      }
    })

    // 2. Create/Update Asset
    await prisma.asset.upsert({
      where: { id: a.id },
      update: {
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        category: a.category,
        description: a.description,
        manufacturer: a.manufacturer,
        model: a.model,
        purchaseDate: a.purchaseDate,
        purchasePrice: a.purchasePrice,
        currentValue: a.currentValue,
        condition: a.condition,
        maintenanceSchedule: a.maintenanceSchedule,
        status: a.status,
        clinicId: clinic.id,
        masterProductId: master.id
      },
      create: {
        id: a.id,
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        category: a.category,
        description: a.description,
        manufacturer: a.manufacturer,
        model: a.model,
        purchaseDate: a.purchaseDate,
        purchasePrice: a.purchasePrice,
        currentValue: a.currentValue,
        condition: a.condition,
        maintenanceSchedule: a.maintenanceSchedule,
        status: a.status,
        clinicId: clinic.id,
        masterProductId: master.id
      }
    })
    console.log(`✅ Asset processed: ${a.assetName}`)
  }

  console.log('--- MANUAL ASSET IMPORT COMPLETED ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
