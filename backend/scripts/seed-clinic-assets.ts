import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING CLINIC ASSET SEED (Premium Tier) ---')

  const clinics = await prisma.clinic.findMany()
  if (clinics.length === 0) {
    console.error('No clinics found. Please create a clinic first.')
    return
  }
  
  console.log(`Found ${clinics.length} clinics. Seeding assets for each...`)

  const assets = [
    {
      code: 'AS-MED-USG4D',
      name: 'USG 4D Mindray DC-70',
      type: 'medical-equipment',
      cat: 'Radiology',
      manufacturer: 'Mindray',
      model: 'DC-70 Expert',
      price: 750000000,
      maintenance: 'Quarterly',
    },
    {
      code: 'AS-MED-ECG',
      name: 'ECG 12-Channel GE MAC 2000',
      type: 'medical-equipment',
      cat: 'Cardiology',
      manufacturer: 'GE Healthcare',
      model: 'MAC 2000',
      price: 450000000,
      maintenance: 'Semi-Annually',
    },
    {
      code: 'AS-MED-DENTAL',
      name: 'Dental Chair Unit Anthos A3',
      type: 'medical-equipment',
      cat: 'Dental',
      manufacturer: 'Anthos',
      model: 'A3 Plus',
      price: 135000000,
      maintenance: 'Monthly',
    },
    {
      code: 'AS-MED-AUTO',
      name: 'Autoclave Getinge HS33',
      type: 'medical-equipment',
      cat: 'Sterilization',
      manufacturer: 'Getinge',
      model: 'HS33',
      price: 95000000,
      maintenance: 'Quarterly',
    },
    {
      code: 'AS-VEH-AMB',
      name: 'Ambulance Toyota Hiace Medis (Advance)',
      type: 'vehicle',
      cat: 'Emergency',
      manufacturer: 'Toyota',
      model: 'Hiace Commuter',
      price: 680000000,
      maintenance: 'Monthly',
    },
    {
      code: 'AS-FAC-AC-INV',
      name: 'AC Daikin Multi-S 3 Connection',
      type: 'furniture',
      cat: 'Facility',
      manufacturer: 'Daikin',
      model: 'Multi-S',
      price: 18000000,
      maintenance: 'Quarterly',
    },
    {
      code: 'AS-OFF-IMAC',
      name: 'iMac 24" M3 16GB/512GB (Reception)',
      type: 'computer',
      cat: 'IT',
      manufacturer: 'Apple',
      model: 'M3 2024',
      price: 28500000,
      maintenance: 'Yearly',
    },
    {
      code: 'AS-OFF-AERON',
      name: 'Herman Miller Aeron Chair',
      type: 'furniture',
      cat: 'Office',
      manufacturer: 'Herman Miller',
      model: 'Aeron Remastered',
      price: 24000000,
      maintenance: 'As needed',
    },
    {
      code: 'AS-LAB-HEM',
      name: 'Hematology Analyzer Sysmex XN-350',
      type: 'medical-equipment',
      cat: 'Laboratory',
      manufacturer: 'Sysmex',
      model: 'XN-350',
      price: 210000000,
      maintenance: 'Monthly',
    },
    {
      code: 'AS-FAC-TV75',
      name: 'Smart TV Samsung 75" Neo QLED',
      type: 'furniture',
      cat: 'Waiting Room',
      manufacturer: 'Samsung',
      model: 'QN90C',
      price: 35000000,
      maintenance: 'As needed',
    }
  ]

  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const warrantyExp = new Date()
  warrantyExp.setFullYear(warrantyExp.getFullYear() + 3)

  for (const clinic of clinics) {
    console.log(`Seeding assets for: ${clinic.name} (${clinic.code})...`)
    for (const a of assets) {
      // Create a unique asset code per pharmacy/clinic to avoid global conflicts if needed, 
      // but schema has global unique constraint on assetCode. 
      // We'll append branch code to assetCode.
      const branchAssetCode = `${a.code}-${clinic.code}`
      
      await prisma.asset.upsert({
        where: { assetCode: branchAssetCode },
        update: {},
        create: {
          assetCode: branchAssetCode,
          assetName: a.name,
          assetType: a.type,
          category: a.cat,
          description: `Premium Asset for ${clinic.name}`,
          manufacturer: a.manufacturer,
          model: a.model,
          purchaseDate: twoYearsAgo,
          purchasePrice: a.price,
          currentValue: a.price * 0.8,
          condition: 'excellent',
          status: 'active',
          maintenanceSchedule: a.maintenance,
          lastMaintenanceDate: new Date(),
          warrantyExpiry: warrantyExp,
          clinicId: clinic.id,
        }
      })
    }
  }

  console.log('--- ASSET SEEDING COMPLETED FOR ALL CLINICS ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
