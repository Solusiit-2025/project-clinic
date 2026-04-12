import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// --- DATA SOURCE: MEDICINES (60 Items) ---
const medicinesCsv = `id,medicineName,genericName,description,dosageForm,strength,manufacturer,batchNumber,expiryDate,isActive
m1,Sanmol,Paracetamol,"Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi",Tablet,500 mg,Sanbe,SAN2401A,2026-12-31,true
m2,Bodrex,Paracetamol + Pseudoefedrin HCl,"Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu",Tablet,500 mg + 30 mg,Kimia Farma,KF2402B,2026-10-31,true
m3,Farnox,Ibuprofen,"Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi",Tablet,400 mg,Novell Pharma,NOV2403C,2026-09-30,true
m4,Ponalac,Naproxen,"Nyeri rematik, asam urat, dan nyeri haid",Tablet,250 mg,Soho,SOH2404D,2026-11-30,true
m5,Amoxan,Amoxicillin,"Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih",Capsule,500 mg,Kimia Farma,KF2405E,2026-08-31,true
m6,Ciflos,Ciprofloxacin,"Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna",Tablet,500 mg,Hexpharm,HEX2406F,2026-07-31,true
m7,Kalmethrox,Azithromycin,"Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT",Tablet,500 mg,Kalbe Farma,KAL2407G,2026-12-31,true
m8,Promag,Aluminium Magnesium Hydroxide + Simethicone,"Mengatasi maag, perut kembung, dan nyeri lambung",Tablet,"400 mg/5ml",Darya Varia,DVA2408H,2026-09-30,true
m9,Bio Gastra,Ranitidine HCl,"Mengurangi produksi asam lambung untuk mengatasi tukak lambung",Tablet,150 mg,Bernofarm,BER2409I,2026-10-31,true
m10,Lasal,Salbutamol sulfate,"Bronkodilator untuk asma dan sesak napas",Tablet,2 mg,Hexpharm,HEX2410J,2026-08-31,true
m11,OBH Combi,Guaifenesin + Dextromethorphan HBr,"Meredakan batuk berdahak dan batuk kering",Syrup,"100 mg/5ml + 15 mg/5ml",Prafa,PRA2411K,2026-09-30,true
m12,Woods,Guaifenesin,"Mengencerkan dahak pada batuk berdahak",Syrup,100 mg/5ml,Kimia Farma,KF2412L,2026-11-30,true
m13,Antimo,Dimenhydrinate,"Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)",Tablet,50 mg,Bintang Toedjoe,BIT2413M,2026-10-31,true
m14,Cetirizine,Cetirizine HCl,"Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)",Tablet,10 mg,Dexa Medica,DEM2414N,2026-12-31,true
m15,Lorastine,Loratadine,"Antihistamin non-sedatif untuk alergi kronis",Tablet,10 mg,Hexpharm,HEX2415O,2026-09-30,true
m16,CTM,Chlorpheniramine Maleate,"Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)",Tablet,4 mg,Konimex,KON2416P,2026-08-31,true
m17,Dextamine,Dexamethasone,"Kortikosteroid untuk peradangan berat dan alergi berat",Tablet,0.5 mg,Mutiara,MUT2417Q,2026-07-31,true
m18,Glucolin,Glucose,"Sumber energi cepat untuk pasien lemas atau dehidrasi",Syrup,200 mg/5ml,Sanbe,SAN2418R,2026-12-31,true
m19,Enervon-C,Vitamin B Complex + Vitamin C,"Multivitamin untuk daya tahan tubuh dan pemulihan",Tablet,"B1 50mg, B6 20mg, B12 5mcg, C 200mg",Dexa Medica,DEM2419S,2026-11-30,true
m20,Sangobion,Iron + Vitamin Complex,"Mengatasi anemia (kekurangan darah)",Capsule,"Fe 250mg + B12 + Asam Folat",PT. Sangobion,SAN2420T,2026-10-31,true
m21,Diapet,Attapulgite + Diosmectite,"Mengatasi diare akut dan kronis",Tablet,750 mg,Kimia Farma,KF2421U,2026-09-30,true
m22,New Diatabs,Loperamide HCl,"Menghentikan diare akut dengan mengurangi pergerakan usus",Capsule,2 mg,Novell Pharma,NOV2422V,2026-08-31,true
m23,Bisolvon,Bromhexine HCl,"Mengencerkan dahak pada batuk berdahak",Tablet,8 mg,Boehringer,BOH2423W,2026-12-31,true
m24,Flutamol,Fluoxetine HCl,"Antidepresan untuk depresi, OCD, dan bulimia",Capsule,20 mg,Kimia Farma,KF2424X,2026-07-31,true
m25,Calcium Lactate,Calcium Lactate,"Suplemen kalsium untuk osteoporosis dan tulang keropos",Tablet,500 mg,Hexpharm,HEX2425Y,2026-11-30,true
m26,Betadine,Povidone-Iodine,"Antiseptik untuk luka dan persiapan operasi",Solution (Topical),10%,PT. Betadine,BET2426Z,2027-01-31,true
m27,Kalpanax,Diazepam,"Obat penenang untuk kecemasan berat dan relaksasi otot",Tablet,2 mg,Kalbe Farma,KAL2427A,2026-09-30,true
m28,Nifedipine,Nifedipine,"Antihipertensi untuk tekanan darah tinggi",Capsule,10 mg,Kimia Farma,KF2428B,2026-10-31,true
m29,Captopril,Captopril,"Antihipertensi untuk hipertensi and gagal jantung",Tablet,25 mg,Hexpharm,HEX2429C,2026-08-31,true
m30,Glibenclamide,Glibenclamide,"Antidiabetik oral untuk diabetes tipe 2",Tablet,5 mg,Sanbe,SAN2430D,2026-12-31,true
m31,Metformin,Metformin HCl,"Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)",Tablet,500 mg,Dexa Medica,DEM2431E,2026-11-30,true
m32,Simvastatin,Simvastatin,"Menurunkan kolesterol LDL dan trigliserida",Tablet,10 mg,Kimia Farma,KF2432F,2026-09-30,true
m33,Allopurinol,Allopurinol,"Mencegah serangan asam urat (gout)",Tablet,100 mg,Hexpharm,HEX2433G,2026-10-31,true
m34,Omeprazole,Omeprazole,"Menghambat asam lambung untuk GERD dan tukak lambung",Capsule,20 mg,Kalbe Farma,KAL2434H,2026-12-31,true
m35,Domperidone,Domperidone,"Mengatasi mual dan muntah serta mempercepat pengosongan lambung",Tablet,10 mg,Novell Pharma,NOV2435I,2026-07-31,true
m36,Mebendazole,Mebendazole,"Antelmintik untuk cacingan (cacing kremi, tambang, gelang)",Tablet,100 mg,Kimia Farma,KF2436J,2026-11-30,true
m37,Albendazole,Albendazole,"Antelmintik spektrum luas untuk cacingan",Tablet,400 mg,Sanbe,SAN2437K,2026-08-31,true
m38,Methylprednisolone,Methylprednisolone,"Kortikosteroid untuk inflamasi berat and autoimun",Tablet,4 mg,Dexa Medica,DEM2438L,2026-10-31,true
m39,Warfarin,Warfarin Sodium,"Antikoagulan untuk mencegah pembekuan darah",Tablet,2 mg,Kimia Farma,KF2439M,2026-09-30,true
m40,Digoxin,Digoxin,"Untuk gagal jantung kongestif and aritmia jantung",Tablet,0.25 mg,Hexpharm,HEX2440N,2026-12-31,true
m41,Furosemide,Furosemide,"Diuretik kuat untuk edema and hipertensi",Tablet,40 mg,Sanbe,SAN2441O,2026-07-31,true
m42,Spironolactone,Spironolactone,"Diuretik hemat kalium untuk edema and hipertensi",Tablet,25 mg,Kalbe Farma,KAL2442P,2026-11-30,true
m43,Levothyroxine,Levothyroxine Sodium,"Hormon tiroid untuk hipotiroidisme",Tablet,50 mcg,Kimia Farma,KF2443Q,2026-08-31,true
m44,Clopidogrel,Clopidogrel Bisulfate,"Antiplatelet untuk mencegah stroke and serangan jantung",Tablet,75 mg,Dexa Medica,DEM2444R,2026-10-31,true
m45,Amlodipine,Amlodipine Besylate,"Antihipertensi golongan CCB untuk hipertensi",Tablet,5 mg,Hexpharm,HEX2445S,2026-12-31,true
m46,Losartan,Losartan Potassium,"Antihipertensi golongan ARB untuk hipertensi",Tablet,50 mg,Novell Pharma,NOV2446T,2026-09-30,true
m47,Bisoprolol,Bisoprolol Fumarate,"Beta-blocker untuk hipertensi and gagal jantung",Tablet,5 mg,Kalbe Farma,KAL2447U,2026-07-31,true
m48,Insulin NPH,Insulin Isophane,"Insulin kerja menengah untuk diabetes melitus",Injection,100 IU/ml,Eli Lilly,ELL2448V,2026-11-30,true
m49,Epinephrine,Epinephrine,"Untuk syok anafilaksis and henti jantung",Injection,1 mg/ml,Kimia Farma,KF2449W,2026-10-31,true
m50,Atropine Sulfate,Atropine Sulfate,"Antispasmodik untuk kolik abdomen and bradikardia",Injection,0.5 mg/ml,Hexpharm,HEX2450X,2026-08-31,true
m51,Ceftriaxone,Ceftriaxone Sodium,"Antibiotik suntik spektrum luas untuk infeksi berat",Injection,1 g/vial,Sanbe,SAN2451Y,2026-12-31,true
m52,Gentamicin,Gentamicin Sulfate,"Antibiotik aminoglikosida untuk infeksi gram negatif",Injection,80 mg/2ml,Kimia Farma,KF2452Z,2026-09-30,true
m53,Ketorolac,Ketorolac Tromethamine,"Analgesik kuat untuk nyeri sedang-berat pasca operasi",Injection,30 mg/ml,Dexa Medica,DEM2453A,2026-07-31,true
m54,Ondansetron,Ondansetron HCl,"Antiemetik untuk mual-muntah pasca kemoterapi/operasi",Injection,4 mg/2ml,Novell Pharma,NOV2454B,2026-11-30,true
m55,Dexamethasone,Dexamethasone Sodium Phosphate,"Kortikosteroid untuk inflamasi and alergi berat",Injection,5 mg/ml,Hexpharm,HEX2455C,2026-10-31,true
m56,Paracetamol Infus,Paracetamol,"Antipiretik untuk demam tinggi pada pasien rawat inap",Injection,10 mg/ml,Kimia Farma,KF2456D,2026-08-31,true
m57,Ringers Lactate,Ringers Lactate Solution,"Cairan infus untuk rehidrasi and keseimbangan elektrolit",Liquid,500 ml,Oxoid,OXY2457E,2027-02-28,true
m58,NaCl 0.9%,Sodium Chloride,"Cairan infus isotonik untuk dehidrasi",Liquid,500 ml,Kimia Farma,KF2458F,2027-01-31,true
m59,Dextrose 5%,Dextrose Monohydrate,"Sumber energi untuk pasien lemas atau hipoglikemia",Liquid,500 ml,Hexpharm,HEX2459G,2027-03-31,true
m60,Hydrocortisone Cream,Hydrocortisone Acetate,"Krim antiinflamasi untuk dermatitis, eksim, and alergi kulit",Cream (Topical),1%,Dexa Medica,DEM2460H,2026-12-31,true`;

// --- DATA SOURCE: SUPPLIES & EQUIPMENT ---
const suppliesData = [
  { name: 'Handschoen Latex S', unit: 'Pasang', price: 2500, sell: 5000 },
  { name: 'Handschoen Latex M', unit: 'Pasang', price: 2500, sell: 5000 },
  { name: 'Handschoen Latex L', unit: 'Pasang', price: 2500, sell: 5000 },
  { name: 'Masker Bedah 3-Ply', unit: 'Pcs', price: 1000, sell: 2000 },
  { name: 'Spuit 1cc', unit: 'Pcs', price: 3000, sell: 6000 },
  { name: 'Spuit 3cc', unit: 'Pcs', price: 3500, sell: 7000 },
  { name: 'Spuit 5cc', unit: 'Pcs', price: 4000, sell: 8000 },
  { name: 'Alcohol Swab', unit: 'Pcs', price: 500, sell: 1000 },
  { name: 'Abocath G20 (Pink)', unit: 'Pcs', price: 15000, sell: 25000 },
  { name: 'Abocath G22 (Blue)', unit: 'Pcs', price: 15000, sell: 25000 },
  { name: 'Infusion Set Dewasa', unit: 'Set', price: 20000, sell: 35000 },
  { name: 'Infusion Set Anak', unit: 'Set', price: 22000, sell: 38000 },
  { name: 'Kasa Steril 10x10', unit: 'Box', price: 12000, sell: 20000 },
  { name: 'Micropore 1 inch', unit: 'Roll', price: 25000, sell: 35000 },
  { name: 'Underpad', unit: 'Pcs', price: 5000, sell: 10000 },
  { name: 'Urinal Bag', unit: 'Pcs', price: 12000, sell: 20000 },
  { name: 'Verband Gulung 10cm', unit: 'Roll', price: 3000, sell: 5000 },
  { name: 'Betadine 1 Liter', unit: 'Bottle', price: 150000, sell: 180000 },
  { name: 'Aseptic Gel 500ml', unit: 'Bottle', price: 35000, sell: 50000 },
];

const equipmentData = [
  { name: 'Termometer Digital', unit: 'Unit', price: 35000, sell: 65000 },
  { name: 'Oximeter Fingertip', unit: 'Unit', price: 120000, sell: 185000 },
  { name: 'Tensimeter Digital Omron', unit: 'Unit', price: 650000, sell: 850000 },
  { name: 'Tensimeter Aneroid (Manual)', unit: 'Unit', price: 180000, sell: 250000 },
  { name: 'Stetoskop Littmann Style', unit: 'Unit', price: 350000, sell: 550000 },
  { name: 'Gluco-Check Kit', unit: 'Set', price: 250000, sell: 350000 },
  { name: 'Nebulizer Machine Portable', unit: 'Unit', price: 450000, sell: 650000 },
  { name: 'Tabung Oksigen 1m3 (Set)', unit: 'Set', price: 950000, sell: 1250000 },
  { name: 'Termometer Infrared (Gun)', unit: 'Unit', price: 150000, sell: 250000 },
];

async function main() {
  console.log('--- STARTING CLEAN MASTER DATABASE SEEDING ---')

  // 1. Seed Clinics
  console.log('🏥 Seeding clinics...')
  let mainClinic = await prisma.clinic.upsert({
    where: { code: 'K001' },
    update: {},
    create: {
      name: 'Klinik Yasfina Pusat',
      code: 'K001',
      address: 'Jl. Contoh No. 123, Jakarta',
      phone: '021-12345678',
      email: 'info@klinikterpadu.com',
      isMain: true,
      isActive: true,
    },
  })
  console.log(`✅ Main clinic ready: ${mainClinic.name}`)

  // 2. Seed Users
  console.log('👤 Seeding master users...')
  const users = [
    { email: 'superadmin@clinic.com', username: 'superadmin', password: 'superadmin123', name: 'Super Administrator', role: 'SUPER_ADMIN' },
    { email: 'admin@clinic.com', username: 'admin', password: 'admin123', name: 'Administrator', role: 'ADMIN' },
    { email: 'dr.fauzi@clinic.com', username: 'drfauzi', password: 'doctor123', name: 'dr. Ahmad Fauzi', role: 'DOCTOR' }
  ]

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, username: u.username },
      create: { ...u, role: u.role as Role, password: hashedPassword, isActive: true }
    })
    
    await prisma.userClinic.upsert({
      where: { userId_clinicId: { userId: user.id, clinicId: mainClinic.id } },
      update: {},
      create: { userId: user.id, clinicId: mainClinic.id }
    })
  }

  // 3. Seed 12 Specialized Product Categories (Consolidated)
  console.log('🏷️ Seeding consolidated product categories...')
  const categories = [
    { name: 'Obat-obatan', desc: 'Katalog master obat-obatan farmasi dan medis' },
    { name: 'Alat Kesehatan (Alkes)', desc: 'Peralatan medis, instrumen, dan perangkat diagnosa' },
    { name: 'BHP (Bahan Habis Pakai)', desc: 'Suplai medis habis pakai (Kapas, Spuit, Alkohol, dll)' },
    { name: 'Office Equipment', desc: 'Peralatan kantor dan ATK' },
    { name: 'Networking', desc: 'Perangkat jaringan dan konektivitas' },
    { name: 'Facility', desc: 'Fasilitas gedung dan utilitas' },
    { name: 'IT Infrastructure', desc: 'Infrastruktur IT dan server' },
    { name: 'Security', desc: 'Sistem keamanan dan CCTV' },
    { name: 'Transportation', desc: 'Kendaraan dan operasional transportasi' },
    { name: 'Mobile Workstation', desc: 'Perangkat kerja mobile (Laptop/Tablet)' },
    { name: 'Workstation', desc: 'Komputer kerja dan monitor' },
    { name: 'Lain-lain', desc: 'Produk pendukung lainnya' }
  ]

  const catMap: Record<string, string> = {}
  for (const cat of categories) {
    const c = await prisma.productCategory.upsert({
      where: { categoryName: cat.name },
      update: { description: cat.desc },
      create: { categoryName: cat.name, description: cat.desc }
    })
    catMap[cat.name] = c.id
  }

  // 4. Seed Medicines (60 Items) -> Map to "Obat-obatan"
  console.log('💊 Seeding medicines and syncing to inventory...')
  const lines = medicinesCsv.split('\n').slice(1)
  for (const line of lines) {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // CSV split aware of quotes
    const id = cols[0]
    const medName = cols[1]
    const generic = cols[2]
    const desc = cols[3].replace(/"/g, '')
    const form = cols[4]
    const strength = cols[5]
    const manufacturer = cols[6]
    const batch = cols[7]
    const expiry = new Date(cols[8])
    
    // Create Medicine Entry
    await prisma.medicine.upsert({
      where: { id },
      update: { medicineName: medName },
      create: {
        id, medicineName: medName, genericName: generic, description: desc,
        dosageForm: form, strength, manufacturer, batchNumber: batch,
        expiryDate: expiry, isActive: true
      }
    })

    // Create ProductMaster for Medicine
    const masterCode = `PM-MED-${id.toUpperCase()}`
    const master = await prisma.productMaster.upsert({
      where: { masterCode },
      update: { categoryId: catMap['Obat-obatan'] },
      create: {
        masterCode, masterName: medName, description: desc,
        categoryId: catMap['Obat-obatan'], medicineId: id, isActive: true
      }
    })

    // Create Inventory Product
    const sku = `SKU-MED-${id.toUpperCase()}`
    await prisma.product.upsert({
      where: { sku_clinicId: { sku, clinicId: mainClinic.id } },
      update: { quantity: 100 },
      create: {
        masterProductId: master.id,
        productCode: `PROD-MED-${id.toUpperCase()}`,
        sku, productName: medName, description: desc,
        unit: form, purchaseUnit: 'Box', storageUnit: form, usedUnit: form,
        quantity: 100, minimumStock: 20, reorderQuantity: 50,
        purchasePrice: 10000, sellingPrice: 15000, clinicId: mainClinic.id,
        isActive: true
      }
    })
  }

  // 5. Seed Supplies -> Map to "BHP (Bahan Habis Pakai)"
  console.log('📦 Seeding medical supplies...')
  for (const s of suppliesData) {
    const code = `SUP-${s.name.replace(/\s+/g, '-').toUpperCase()}`
    const master = await prisma.productMaster.upsert({
      where: { masterCode: code },
      update: { categoryId: catMap['BHP (Bahan Habis Pakai)'] },
      create: {
        masterCode: code, masterName: s.name,
        categoryId: catMap['BHP (Bahan Habis Pakai)'], isActive: true
      }
    })

    await prisma.product.upsert({
      where: { sku_clinicId: { sku: `SKU-${code}`, clinicId: mainClinic.id } },
      update: { quantity: 50 },
      create: {
        masterProductId: master.id,
        productCode: `PROD-${code}`,
        sku: `SKU-${code}`,
        productName: s.name,
        unit: s.unit, purchaseUnit: 'Box', storageUnit: s.unit, usedUnit: s.unit,
        quantity: 50, minimumStock: 10, reorderQuantity: 20,
        purchasePrice: s.price, sellingPrice: s.sell, clinicId: mainClinic.id,
        isActive: true
      }
    })
  }

  // 6. Seed Equipment -> Map to "Alat Kesehatan (Alkes)"
  console.log('🔧 Seeding medical equipment...')
  for (const a of equipmentData) {
    const code = `ALKES-${a.name.replace(/\s+/g, '-').toUpperCase()}`
    const master = await prisma.productMaster.upsert({
      where: { masterCode: code },
      update: { categoryId: catMap['Alat Kesehatan (Alkes)'] },
      create: {
        masterCode: code, masterName: a.name,
        categoryId: catMap['Alat Kesehatan (Alkes)'], isActive: true
      }
    })

    await prisma.product.upsert({
      where: { sku_clinicId: { sku: `SKU-${code}`, clinicId: mainClinic.id } },
      update: { quantity: 5 },
      create: {
        masterProductId: master.id,
        productCode: `PROD-${code}`,
        sku: `SKU-${code}`,
        productName: a.name,
        unit: a.unit, purchaseUnit: 'Unit', storageUnit: a.unit, usedUnit: a.unit,
        quantity: 5, minimumStock: 2, reorderQuantity: 3,
        purchasePrice: a.price, sellingPrice: a.sell, clinicId: mainClinic.id,
        isActive: true
      }
    })
  }

  console.log('--- CLEAN SEEDING COMPLETED SUCCESSFULLY ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
