import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- SEEDING EXTENDED OPERATIONAL ASSETS ---')

  const clinics = await prisma.clinic.findMany()
  if (clinics.length === 0) {
    console.error('No clinics found.')
    return
  }

  const assets = [
    // IT & NETWORKING
    { code: 'AS-IT-SVR', name: 'Server NAS Synology DS923+', type: 'computer', cat: 'IT Infrastructure', manufacturer: 'Synology', model: 'DS923+', price: 15500000 },
    { code: 'AS-IT-WIFI', name: 'Ubiquiti UniFi Dream Machine Pro (WiFi System)', type: 'computer', cat: 'Networking', manufacturer: 'Ubiquiti', model: 'UDM-Pro', price: 9500000 },
    { code: 'AS-IT-LP1', name: 'Laptop MacBook Air 13" M3 16GB (Manajemen)', type: 'computer', cat: 'Mobile Workstation', manufacturer: 'Apple', model: 'MacBook Air M3', price: 21500000 },
    { code: 'AS-IT-PC1', name: 'PC Desktop Dell Optiplex 7010 (Admin Set)', type: 'computer', cat: 'Workstation', manufacturer: 'Dell', model: 'Optiplex 7010', price: 12500000 },
    { code: 'AS-IT-PRN', name: 'Printer Epson L3210 (Multifunction)', type: 'computer', cat: 'Office Equipment', manufacturer: 'Epson', model: 'L3210', price: 3200000 },
    
    // VEHICLES
    { code: 'AS-VEH-CAR', name: 'Mobil Operasional Toyota Avanza Veloz', type: 'vehicle', cat: 'Transportation', manufacturer: 'Toyota', model: 'Veloz 2024', price: 295000000 },
    { code: 'AS-VEH-MTR2', name: 'Motor Operasional Yamaha NMAX 155', type: 'vehicle', cat: 'Transportation', manufacturer: 'Yamaha', model: 'NMAX Connected', price: 35000000 },
    
    // FACILITY & SECURITY
    { code: 'AS-FAC-CCTV', name: 'CCTV System Hikvision 8-CH (Full HD)', type: 'equipment', cat: 'Security', manufacturer: 'Hikvision', model: 'Turbo HD 8CH', price: 8500000 },
    { code: 'AS-FAC-ABS', name: 'Mesin Absensi Face Recognition (Solution)', type: 'equipment', cat: 'Security', manufacturer: 'Solution', model: 'X606-S', price: 4500000 },
    { code: 'AS-FAC-AC-R1', name: 'AC Panasonic 1PK Inverter (Ruang Periksa 1)', type: 'furniture', cat: 'Facility', manufacturer: 'Panasonic', model: 'CS-PU9XKP', price: 6500000 },
    { code: 'AS-FAC-AC-R2', name: 'AC Panasonic 1PK Inverter (Ruang Periksa 2)', type: 'furniture', cat: 'Facility', manufacturer: 'Panasonic', model: 'CS-PU9XKP', price: 6500000 },
    { code: 'AS-FAC-AC-W', name: 'AC Panasonic 2PK Inverter (Ruang Tunggu)', type: 'furniture', cat: 'Facility', manufacturer: 'Panasonic', model: 'CS-PU18XKP', price: 12500000 },
  ]

  const purchaseDate = new Date()
  purchaseDate.setMonth(purchaseDate.getMonth() - 3)

  for (const clinic of clinics) {
    console.log(`Seeding extended assets for: ${clinic.name} (${clinic.code})...`)
    for (const a of assets) {
      const branchAssetCode = `${a.code}-${clinic.code}`
      await prisma.asset.upsert({
        where: { assetCode: branchAssetCode },
        update: {},
        create: {
          assetCode: branchAssetCode,
          assetName: a.name,
          assetType: a.type,
          category: a.cat,
          description: `Operational Asset for Clinic Support`,
          manufacturer: a.manufacturer,
          model: a.model,
          purchaseDate: purchaseDate,
          purchasePrice: a.price,
          currentValue: a.price * 0.95,
          condition: 'excellent',
          status: 'active',
          maintenanceSchedule: 'Quarterly',
          lastMaintenanceDate: new Date(),
          clinicId: clinic.id,
        }
      })
    }
  }

  console.log(`--- SEEDED ADDITIONAL ASSETS FOR ALL ${clinics.length} CLINICS ---`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
