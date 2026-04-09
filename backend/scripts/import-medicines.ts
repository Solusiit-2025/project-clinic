import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const csvData = `id,medicineName,genericName,description,dosageForm,strength,manufacturer,batchNumber,expiryDate,isActive,createdAt,updatedAt
,m1,Sanmol,Paracetamol,"Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi",Tablet,500 mg,Sanbe,SAN2401A,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m2,Bodrex,Paracetamol + Pseudoefedrin HCl,"Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu",Tablet,500 mg + 30 mg,Kimia Farma,KF2402B,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m3,Farnox,Ibuprofen,"Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi",Tablet,400 mg,Novell Pharma,NOV2403C,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m4,Ponalac,Naproxen,"Nyeri rematik, asam urat, dan nyeri haid",Tablet,250 mg,Soho,SOH2404D,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m5,Amoxan,Amoxicillin,"Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih",Capsule,500 mg,Kimia Farma,KF2405E,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m6,Ciflos,Ciprofloxacin,"Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna",Tablet,500 mg,Hexpharm,HEX2406F,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m7,Kalmethrox,Azithromycin,"Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT",Tablet,500 mg,Kalbe Farma,KAL2407G,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m8,Promag,Aluminium Magnesium Hydroxide + Simethicone,"Mengatasi maag, perut kembung, dan nyeri lambung",Tablet,"400 mg/5ml",Darya Varia,DVA2408H,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m9,Bio Gastra,Ranitidine HCl,"Mengurangi produksi asam lambung untuk mengatasi tukak lambung",Tablet,150 mg,Bernofarm,BER2409I,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m10,Lasal,Salbutamol sulfate,"Bronkodilator untuk asma dan sesak napas",Tablet,2 mg,Hexpharm,HEX2410J,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m11,OBH Combi,Guaifenesin + Dextromethorphan HBr,"Meredakan batuk berdahak dan batuk kering",Syrup,"100 mg/5ml + 15 mg/5ml",Prafa,PRA2411K,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m12,Woods,Guaifenesin,"Mengencerkan dahak pada batuk berdahak",Syrup,100 mg/5ml,Kimia Farma,KF2412L,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m13,Antimo,Dimenhydrinate,"Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)",Tablet,50 mg,Bintang Toedjoe,BIT2413M,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m14,Cetirizine,Cetirizine HCl,"Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)",Tablet,10 mg,Dexa Medica,DEM2414N,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m15,Lorastine,Loratadine,"Antihistamin non-sedatif untuk alergi kronis",Tablet,10 mg,Hexpharm,HEX2415O,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m16,CTM,Chlorpheniramine Maleate,"Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)",Tablet,4 mg,Konimex,KON2416P,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m17,Dextamine,Dexamethasone,"Kortikosteroid untuk peradangan berat dan alergi berat",Tablet,0.5 mg,Mutiara,MUT2417Q,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m18,Glucolin,Glucose,"Sumber energi cepat untuk pasien lemas atau dehidrasi",Syrup,200 mg/5ml,Sanbe,SAN2418R,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m19,Enervon-C,Vitamin B Complex + Vitamin C,"Multivitamin untuk daya tahan tubuh dan pemulihan",Tablet,"B1 50mg, B6 20mg, B12 5mcg, C 200mg",Dexa Medica,DEM2419S,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m20,Sangobion,Iron + Vitamin Complex,"Mengatasi anemia (kekurangan darah)",Capsule,"Fe 250mg + B12 + Asam Folat",PT. Sangobion,SAN2420T,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m21,Diapet,Attapulgite + Diosmectite,"Mengatasi diare akut dan kronis",Tablet,750 mg,Kimia Farma,KF2421U,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m22,New Diatabs,Loperamide HCl,"Menghentikan diare akut dengan mengurangi pergerakan usus",Capsule,2 mg,Novell Pharma,NOV2422V,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m23,Bisolvon,Bromhexine HCl,"Mengencerkan dahak pada batuk berdahak",Tablet,8 mg,Boehringer,BOH2423W,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m24,Flutamol,Fluoxetine HCl,"Antidepresan untuk depresi, OCD, dan bulimia",Capsule,20 mg,Kimia Farma,KF2424X,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m25,Calcium Lactate,Calcium Lactate,"Suplemen kalsium untuk osteoporosis dan tulang keropos",Tablet,500 mg,Hexpharm,HEX2425Y,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m26,Betadine,Povidone-Iodine,"Antiseptik untuk luka dan persiapan operasi",Solution (Topical),10%,PT. Betadine,BET2426Z,2027-01-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m27,Kalpanax,Diazepam,"Obat penenang untuk kecemasan berat dan relaksasi otot",Tablet,2 mg,Kalbe Farma,KAL2427A,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m28,Nifedipine,Nifedipine,"Antihipertensi untuk tekanan darah tinggi",Capsule,10 mg,Kimia Farma,KF2428B,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m29,Captopril,Captopril,"Antihipertensi untuk hipertensi dan gagal jantung",Tablet,25 mg,Hexpharm,HEX2429C,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m30,Glibenclamide,Glibenclamide,"Antidiabetik oral untuk diabetes tipe 2",Tablet,5 mg,Sanbe,SAN2430D,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m31,Metformin,Metformin HCl,"Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)",Tablet,500 mg,Dexa Medica,DEM2431E,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m32,Simvastatin,Simvastatin,"Menurunkan kolesterol LDL dan trigliserida",Tablet,10 mg,Kimia Farma,KF2432F,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m33,Allopurinol,Allopurinol,"Mencegah serangan asam urat (gout)",Tablet,100 mg,Hexpharm,HEX2433G,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m34,Omeprazole,Omeprazole,"Menghambat asam lambung untuk GERD dan tukak lambung",Capsule,20 mg,Kalbe Farma,KAL2434H,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m35,Domperidone,Domperidone,"Mengatasi mual dan muntah serta mempercepat pengosongan lambung",Tablet,10 mg,Novell Pharma,NOV2435I,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m36,Mebendazole,Mebendazole,"Antelmintik untuk cacingan (cacing kremi, tambang, gelang)",Tablet,100 mg,Kimia Farma,KF2436J,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m37,Albendazole,Albendazole,"Antelmintik spektrum luas untuk cacingan",Tablet,400 mg,Sanbe,SAN2437K,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m38,Methylprednisolone,Methylprednisolone,"Kortikosteroid untuk inflamasi berat dan autoimun",Tablet,4 mg,Dexa Medica,DEM2438L,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m39,Warfarin,Warfarin Sodium,"Antikoagulan untuk mencegah pembekuan darah",Tablet,2 mg,Kimia Farma,KF2439M,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m40,Digoxin,Digoxin,"Untuk gagal jantung kongestif dan aritmia jantung",Tablet,0.25 mg,Hexpharm,HEX2440N,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m41,Furosemide,Furosemide,"Diuretik kuat untuk edema dan hipertensi",Tablet,40 mg,Sanbe,SAN2441O,2026-7-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m42,Spironolactone,Spironolactone,"Diuretik hemat kalium untuk edema dan hipertensi",Tablet,25 mg,Kalbe Farma,KAL2442P,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m43,Levothyroxine,Levothyroxine Sodium,"Hormon tiroid untuk hipotiroidisme",Tablet,50 mcg,Kimia Farma,KF2443Q,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m44,Clopidogrel,Clopidogrel Bisulfate,"Antiplatelet untuk mencegah stroke dan serangan jantung",Tablet,75 mg,Dexa Medica,DEM2444R,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m45,Amlodipine,Amlodipine Besylate,"Antihipertensi golongan CCB untuk hipertensi",Tablet,5 mg,Hexpharm,HEX2445S,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m46,Losartan,Losartan Potassium,"Antihipertensi golongan ARB untuk hipertensi",Tablet,50 mg,Novell Pharma,NOV2446T,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m47,Bisoprolol,Bisoprolol Fumarate,"Beta-blocker untuk hipertensi dan gagal jantung",Tablet,5 mg,Kalbe Farma,KAL2447U,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m48,Insulin NPH,Insulin Isophane,"Insulin kerja menengah untuk diabetes melitus",Injection,100 IU/ml,Eli Lilly,ELL2448V,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m49,Epinephrine,Epinephrine,"Untuk syok anafilaksis dan henti jantung",Injection,1 mg/ml,Kimia Farma,KF2449W,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m50,Atropine Sulfate,Atropine Sulfate,"Antispasmodik untuk kolik abdomen dan bradikardia",Injection,0.5 mg/ml,Hexpharm,HEX2450X,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m51,Ceftriaxone,Ceftriaxone Sodium,"Antibiotik suntik spektrum luas untuk infeksi berat",Injection,1 g/vial,Sanbe,SAN2451Y,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m52,Gentamicin,Gentamicin Sulfate,"Antibiotik aminoglikosida untuk infeksi gram negatif",Injection,80 mg/2ml,Kimia Farma,KF2452Z,2026-09-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m53,Ketorolac,Ketorolac Tromethamine,"Analgesik kuat untuk nyeri sedang-berat pasca operasi",Injection,30 mg/ml,Dexa Medica,DEM2453A,2026-07-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m54,Ondansetron,Ondansetron HCl,"Antiemetik untuk mual-muntah pasca kemoterapi/operasi",Injection,4 mg/2ml,Novell Pharma,NOV2454B,2026-11-30,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m55,Dexamethasone,Dexamethasone Sodium Phosphate,"Kortikosteroid untuk inflamasi dan alergi berat",Injection,5 mg/ml,Hexpharm,HEX2455C,2026-10-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m56,Paracetamol Infus,Paracetamol,"Antipiretik untuk demam tinggi pada pasien rawat inap",Injection,10 mg/ml,Kimia Farma,KF2456D,2026-08-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m57,Ringers Lactate,Ringers Lactate Solution,"Cairan infus untuk rehidrasi dan keseimbangan elektrolit",Liquid,500 ml,Oxoid,OXY2457E,2027-02-28,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m58,NaCl 0.9%,Sodium Chloride,"Cairan infus isotonik untuk dehidrasi",Liquid,500 ml,Kimia Farma,KF2458F,2027-01-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m59,Dextrose 5%,Dextrose Monohydrate,"Sumber energi untuk pasien lemas atau hipoglikemia",Liquid,500 ml,Hexpharm,HEX2459G,2027-03-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z
,m60,Hydrocortisone Cream,Hydrocortisone Acetate,"Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit",Cream (Topical),1%,Dexa Medica,DEM2460H,2026-12-31,true,2026-04-08T00:00:00Z,2026-04-08T00:00:00Z`

async function main() {
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',')
  const dataLines = lines.slice(1)

  console.log(`Starting import of ${dataLines.length} medicines...`)

  for (const line of dataLines) {
    // Basic CSV parser that handles quotes
    const cols: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) {
        cols.push(current)
        current = ''
      } else {
        current += char
      }
    }
    cols.push(current)

    // Mapping based on col index (ignoring first empty column if present)
    // If the line starts with a comma, col[0] is empty, col[1] is ID 'm1', col[2] is 'Sanmol'
    const offset = line.startsWith(',') ? 1 : 0
    
    const id = cols[offset]
    const medicineName = cols[offset + 1]
    const genericName = cols[offset + 2]
    const description = cols[offset + 3]
    const dosageForm = cols[offset + 4]
    const strength = cols[offset + 5]
    const manufacturer = cols[offset + 6]
    const batchNumber = cols[offset + 7]
    const expiryDate = cols[offset + 8] ? new Date(cols[offset + 8]) : null
    const isActive = cols[offset + 9] === 'true'
    const createdAt = cols[offset + 10] ? new Date(cols[offset + 10]) : new Date()
    const updatedAt = cols[offset + 11] ? new Date(cols[offset + 11]) : new Date()

    try {
      await prisma.medicine.upsert({
        where: { id },
        update: {
          medicineName,
          genericName,
          description,
          dosageForm,
          strength,
          manufacturer,
          batchNumber,
          expiryDate,
          isActive,
          updatedAt
        },
        create: {
          id,
          medicineName,
          genericName,
          description,
          dosageForm,
          strength,
          manufacturer,
          batchNumber,
          expiryDate,
          isActive,
          createdAt,
          updatedAt
        }
      })
      console.log(`Imported: ${medicineName}`)
    } catch (error) {
      console.error(`Failed to import ${medicineName}:`, error)
    }
  }

  console.log('Import completed.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
