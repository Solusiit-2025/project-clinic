import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING CLINIC INVENTORY SEED ---')

  // 1. Get Target Clinic
  const clinic = await prisma.clinic.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!clinic) {
    console.error('No clinic found. Please create a clinic first.')
    return
  }
  console.log(`Target Clinic: ${clinic.name} (${clinic.id})`)

  // 2. Sync Existing Medicines (60 items)
  const medicines = await prisma.medicine.findMany()
  console.log(`Syncing ${medicines.length} Medicines to Product Master...`)

  for (const med of medicines) {
    const masterCode = `PM-MED-${med.id.slice(0, 4).toUpperCase()}`
    const sku = `SKU-MED-${med.id.toUpperCase()}`
    
    // Create ProductMaster
    const master = await prisma.productMaster.upsert({
      where: { masterCode: masterCode },
      update: { medicineId: med.id }, // Ensure link
      create: {
        masterCode: masterCode,
        masterName: med.medicineName,
        description: med.description,
        category: 'medicine',
        medicineId: med.id,
        isActive: true
      }
    })

    // Create Product for Clinic
    await prisma.product.upsert({
      where: { sku: sku },
      update: {
        productName: med.medicineName,
        quantity: 100, // Default seed stock
      },
      create: {
        masterProductId: master.id,
        productCode: `PROD-MED-${med.id.toUpperCase()}`,
        sku: sku,
        productName: med.medicineName,
        description: med.description,
        unit: med.dosageForm || 'Tablet',
        purchaseUnit: 'Box',
        storageUnit: med.dosageForm || 'Tablet',
        usedUnit: med.dosageForm || 'Tablet',
        quantity: 100,
        minimumStock: 20,
        reorderQuantity: 50,
        purchasePrice: 10000,
        sellingPrice: 15000,
        clinicId: clinic.id,
        isActive: true
      }
    })
  }

  // 3. Add Standard Medical Supplies (BHP)
  const supplies = [
    { name: 'Handschoen Latex S', unit: 'Pasang', cat: 'supplies', price: 2500, sell: 5000 },
    { name: 'Handschoen Latex M', unit: 'Pasang', cat: 'supplies', price: 2500, sell: 5000 },
    { name: 'Handschoen Latex L', unit: 'Pasang', cat: 'supplies', price: 2500, sell: 5000 },
    { name: 'Masker Bedah 3-Ply', unit: 'Pcs', cat: 'supplies', price: 1000, sell: 2000 },
    { name: 'Spuit 1cc', unit: 'Pcs', cat: 'supplies', price: 3000, sell: 6000 },
    { name: 'Spuit 3cc', unit: 'Pcs', cat: 'supplies', price: 3500, sell: 7000 },
    { name: 'Spuit 5cc', unit: 'Pcs', cat: 'supplies', price: 4000, sell: 8000 },
    { name: 'Alcohol Swab', unit: 'Pcs', cat: 'supplies', price: 500, sell: 1000 },
    { name: 'Abocath G20 (Pink)', unit: 'Pcs', cat: 'supplies', price: 15000, sell: 25000 },
    { name: 'Abocath G22 (Blue)', unit: 'Pcs', cat: 'supplies', price: 15000, sell: 25000 },
    { name: 'Infusion Set Dewasa', unit: 'Set', cat: 'supplies', price: 20000, sell: 35000 },
    { name: 'Infusion Set Anak', unit: 'Set', cat: 'supplies', price: 22000, sell: 38000 },
    { name: 'Kasa Steril 10x10', unit: 'Box', cat: 'supplies', price: 12000, sell: 20000 },
    { name: 'Micropore 1 inch', unit: 'Roll', cat: 'supplies', price: 25000, sell: 35000 },
    { name: 'Underpad', unit: 'Pcs', cat: 'supplies', price: 5000, sell: 10000 },
    { name: 'Urinal Bag', unit: 'Pcs', cat: 'supplies', price: 12000, sell: 20000 },
    { name: 'Verband Gulung 10cm', unit: 'Roll', cat: 'supplies', price: 3000, sell: 5000 },
    { name: 'Betadine 1 Liter', unit: 'Bottle', cat: 'supplies', price: 150000, sell: 180000 },
    { name: 'Aseptic Gel 500ml', unit: 'Bottle', cat: 'supplies', price: 35000, sell: 50000 },
  ]

  console.log(`Seeding ${supplies.length} Medical Supplies (BHP)...`)
  for (const s of supplies) {
    const code = `SUP-${s.name.replace(/\s+/g, '-').toUpperCase()}`
    const master = await prisma.productMaster.upsert({
      where: { masterCode: code },
      update: {},
      create: {
        masterCode: code,
        masterName: s.name,
        category: s.cat,
        isActive: true
      }
    })

    await prisma.product.upsert({
      where: { sku: `SKU-${code}` },
      update: { quantity: 50 },
      create: {
        masterProductId: master.id,
        productCode: `PROD-${code}`,
        sku: `SKU-${code}`,
        productName: s.name,
        unit: s.unit,
        purchaseUnit: 'Box',
        storageUnit: s.unit,
        usedUnit: s.unit,
        quantity: 50,
        minimumStock: 10,
        reorderQuantity: 20,
        purchasePrice: s.price,
        sellingPrice: s.sell,
        clinicId: clinic.id,
        isActive: true
      }
    })
  }

  // 4. Add Medical Equipment (Alkes)
  const alkes = [
    { name: 'Termometer Digital', unit: 'Unit', cat: 'equipment', price: 35000, sell: 65000 },
    { name: 'Oximeter Fingertip', unit: 'Unit', cat: 'equipment', price: 120000, sell: 185000 },
    { name: 'Tensimeter Digital Omron', unit: 'Unit', cat: 'equipment', price: 650000, sell: 850000 },
    { name: 'Tensimeter Aneroid (Manual)', unit: 'Unit', cat: 'equipment', price: 180000, sell: 250000 },
    { name: 'Stetoskop Littmann Style', unit: 'Unit', cat: 'equipment', price: 350000, sell: 550000 },
    { name: 'Gluco-Check Kit', unit: 'Set', cat: 'equipment', price: 250000, sell: 350000 },
    { name: 'Nebulizer Machine Portable', unit: 'Unit', cat: 'equipment', price: 450000, sell: 650000 },
    { name: 'Tabung Oksigen 1m3 (Set)', unit: 'Set', cat: 'equipment', price: 950000, sell: 1250000 },
    { name: 'Termometer Infrared (Gun)', unit: 'Unit', cat: 'equipment', price: 150000, sell: 250000 },
  ]

  console.log(`Seeding ${alkes.length} Medical Equipment (Alkes)...`)
  for (const a of alkes) {
    const code = `ALKES-${a.name.replace(/\s+/g, '-').toUpperCase()}`
    const master = await prisma.productMaster.upsert({
      where: { masterCode: code },
      update: {},
      create: {
        masterCode: code,
        masterName: a.name,
        category: a.cat,
        isActive: true
      }
    })

    await prisma.product.upsert({
      where: { sku: `SKU-${code}` },
      update: { quantity: 5 },
      create: {
        masterProductId: master.id,
        productCode: `PROD-${code}`,
        sku: `SKU-${code}`,
        productName: a.name,
        unit: a.unit,
        purchaseUnit: 'Unit',
        storageUnit: a.unit,
        usedUnit: a.unit,
        quantity: 5,
        minimumStock: 2,
        reorderQuantity: 3,
        purchasePrice: a.price,
        sellingPrice: a.sell,
        clinicId: clinic.id,
        isActive: true
      }
    })
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---')
  console.log('Summary:')
  console.log(`- Medicines Synced: ${medicines.length}`)
  console.log(`- Supplies Added: ${supplies.length}`)
  console.log(`- Equipment Added: ${alkes.length}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
