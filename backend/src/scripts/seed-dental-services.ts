import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const servicesData = [
  // --- Kategori: Konservasi (Penambalan Gigi) - BASIC ---
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Biaya Administrasi",
    price: 0,
    doctorFee: 0
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Bongkar Tambalan",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Tambal Sementara",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Tambal Sementara + (Eugenol / CHKM)",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Lining (Dycal)",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Fissure Sealant",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Poles / Occlusal Adjustment",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Desensitisasi",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Fluoridasi (Clin Pro)",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Devital",
    price: 50000,
    doctorFee: 15000
  },
  {
    category: "Konservasi (Penambalan Gigi) - BASIC",
    name: "Calcipex (Ca(OH)2)",
    price: 70000,
    doctorFee: 21000
  },

  // --- Kategori: Konservasi (Penambalan Gigi) - GIC & KOMPOSIT ---
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "GIC Kecil",
    price: 350000,
    doctorFee: 105000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "GIC Sedang",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "GIC Besar",
    price: 450000,
    doctorFee: 135000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Komposit Kecil",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Komposit Sedang",
    price: 450000,
    doctorFee: 135000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Komposit Besar",
    price: 500000,
    doctorFee: 150000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Komposit Kompleks",
    price: 550000,
    doctorFee: 165000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Komposit Matrix",
    price: 750000,
    doctorFee: 225000
  },
  {
    category: "Konservasi (Penambalan Gigi) - GIC & KOMPOSIT",
    name: "Direct Veneer Komposit",
    price: 750000,
    doctorFee: 225000
  },

  // --- Kategori: Konservasi (Perawatan Saluran Akar) ---
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "PSA Anak Reaming & Filing / Gigi",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "PSA Anak Pengisian Saluran Akar",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Buka Atap Pulpa (BAP)",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Mumifikasi / Medikamen",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Reaming & Filing / Saluran Akar",
    price: 125000,
    doctorFee: 37500
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Pengisian Saluran Akar / Saluran Akar",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Guttaperca / Saluran Akar",
    price: 15000,
    doctorFee: 4500
  },
  {
    category: "Konservasi (Perawatan Saluran Akar)",
    name: "Trepanasi",
    price: 100000,
    doctorFee: 30000
  },

  // --- Kategori: Konservasi (Estetik) ---
  {
    category: "Konservasi (Estetik)",
    name: "Indirect Veneer Porcelain / Gigi",
    price: 3000000,
    doctorFee: 900000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Bongkar Veneer / Gigi",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Direct Veneer Komposit / Gigi",
    price: 750000,
    doctorFee: 225000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Mock Up / Gigi",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Bleaching Opalesence",
    price: 4000000,
    doctorFee: 1200000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Internal Bleaching",
    price: 1000000,
    doctorFee: 300000
  },
  {
    category: "Konservasi (Estetik)",
    name: "Pola Office",
    price: 1600000,
    doctorFee: 480000
  },

  // --- Kategori: Oral Surgery (Bedah Mulut) ---
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Anak Chlorethyl",
    price: 250000,
    doctorFee: 75000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Anak Infiltrasi",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Dewasa (Goyang)",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Dewasa",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Komplikasi (Penyulit Ringan)",
    price: 600000,
    doctorFee: 180000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Komplikasi (Penyulit Berat)",
    price: 1000000,
    doctorFee: 300000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Molar 3 Bawah",
    price: 3000000,
    doctorFee: 900000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Pencabutan Gigi Molar 3 Atas",
    price: 700000,
    doctorFee: 210000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Alveolectomy",
    price: 850000,
    doctorFee: 255000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Frenectomy",
    price: 2000000,
    doctorFee: 600000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Operculectomy",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Eksisi Mucocele",
    price: 1500000,
    doctorFee: 450000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Insisi Abses",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Hecting / Jahit",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Lepas Jahitan (Pasien Luar)",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Anestesi Tambahan",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Oral Surgery (Bedah Mulut)",
    name: "Spongostan",
    price: 50000,
    doctorFee: 15000
  },

  // --- Kategori: Periodontia (Jaringan Penyangga Gigi) ---
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Scaling Anak (Gigi Susu)",
    price: 250000,
    doctorFee: 75000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Scaling Dewasa - Ringan",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Scaling Dewasa - Sedang",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Scaling Dewasa - Berat",
    price: 500000,
    doctorFee: 150000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Scaling Satu Gigi",
    price: 50000,
    doctorFee: 15000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Ti-es",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Splinting (Wire + Komposit) / Gigi",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Kuretase",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Insisi (Abses / Polip)",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Bongkar Splinting / Gigi",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Stain Removing",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Fluoridasi",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Periodontia (Jaringan Penyangga Gigi)",
    name: "Brushing",
    price: 100000,
    doctorFee: 30000
  },

  // --- Kategori: Prosthodontia (Gigi Palsu) ---
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Cetak Alginat",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Cetak Double Impression",
    price: 350000,
    doctorFee: 105000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Bongkar Gigi Palsu (Pertopi)",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTSL/GTP: Per Gigi Akrilik",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTSL/GTP: Plat Akrilik",
    price: 1500000,
    doctorFee: 450000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTSL/GTP: Plat Thermosense",
    price: 2000000,
    doctorFee: 600000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTSL/GTP: Plat Metal / Metal Frame",
    price: 3000000,
    doctorFee: 900000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Sendok Cetak Perseorangan (SCP) / Rahang",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Bite Rim / Rahang",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTSL/GTP: Plat Valplast",
    price: 1750000,
    doctorFee: 525000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Relining",
    price: 1500000,
    doctorFee: 450000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Rebasing (Reparasi Gigi Tiruan Patah)",
    price: 1500000,
    doctorFee: 450000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Reparasi Gigi Tiruan Cekat",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Bongkar Gigi Tiruan Cekat",
    price: 400000,
    doctorFee: 120000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "GTC Sementasi Crown",
    price: 250000,
    doctorFee: 75000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Crown Sementara / Gigi",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Crown All Porcelain",
    price: 5000000,
    doctorFee: 1500000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Crown Zirconia",
    price: 6000000,
    doctorFee: 1800000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Uplay Metal",
    price: 1500000,
    doctorFee: 450000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Uplay Komposit",
    price: 1750000,
    doctorFee: 525000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Crown PFM (Porcelain Fused to Metal)",
    price: 3000000,
    doctorFee: 900000
  },
  {
    category: "Prosthodontia (Gigi Palsu)",
    name: "Pasak (Fiber + Core Build Up)",
    price: 1500000,
    doctorFee: 450000
  },

  // --- Kategori: Orthodontic (Braces / Kawat Gigi) ---
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Self-Ligating Braces Metal RA + RB",
    price: 15500000,
    doctorFee: 4650000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Konvensional Braces Metal RA + RB",
    price: 6000000,
    doctorFee: 1800000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Konvensional Braces Clear RA + RB",
    price: 14500000,
    doctorFee: 4350000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Konvensional Braces Metal RA / RB",
    price: 4000000,
    doctorFee: 1200000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Konvensional Braces Clear RA / RB",
    price: 7500000,
    doctorFee: 2250000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Kontrol (Scaling + Ganti PO/PC)",
    price: 200000,
    doctorFee: 60000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Kontrol Luar",
    price: 300000,
    doctorFee: 90000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Ganti Kawat / Rahang",
    price: 75000,
    doctorFee: 22500
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Reinsert",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Insersi Braces Baru Konvensional",
    price: 50000,
    doctorFee: 15000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Ligature",
    price: 50000,
    doctorFee: 15000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Slicing",
    price: 75000,
    doctorFee: 22500
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "OCS (Open Coil Spring)",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Offbite / Bite Riser",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Button",
    price: 75000,
    doctorFee: 22500
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Hook",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Drop In Hook",
    price: 150000,
    doctorFee: 45000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Pindah Kontrol",
    price: 700000,
    doctorFee: 210000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Lepas Braces + Scaling",
    price: 600000,
    doctorFee: 180000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Retainer Clear (RA + RB) + Cetak",
    price: 1750000,
    doctorFee: 525000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Retainer Hawley (RA + RB) + Cetak",
    price: 2500000,
    doctorFee: 750000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Ortho Wax",
    price: 50000,
    doctorFee: 15000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Sikat Gigi Ortho",
    price: 100000,
    doctorFee: 30000
  },
  {
    category: "Orthodontic (Braces / Kawat Gigi)",
    name: "Interdental Brush",
    price: 50000,
    doctorFee: 15000
  }
]

async function main() {
  console.log('Seeding dental services...')

  // 1. Find main clinic or first clinic
  const clinic = await prisma.clinic.findFirst({ where: { isMain: true } }) || await prisma.clinic.findFirst()
  if (!clinic) {
    throw new Error('Klinik tidak ditemukan. Pastikan sudah melakukan seeding klinik.')
  }
  const clinicId = clinic.id

  // 2. Find Dental Department (Poli Gigi)
  const dentalDept = await prisma.department.findFirst({
    where: {
      name: { contains: 'gigi', mode: 'insensitive' }
    }
  })
  if (!dentalDept) {
    throw new Error('Departemen Poli Gigi tidak ditemukan. Pastikan sudah melakukan seeding departemen.')
  }
  const departmentId = dentalDept.id
  console.log(`Using Dental Department ID: ${departmentId} (${dentalDept.name})`)

  // 3. Load all service categories
  const dbCategories = await prisma.serviceCategory.findMany()
  const categoryMap: Record<string, string> = {}
  for (const dbCat of dbCategories) {
    categoryMap[dbCat.categoryName] = dbCat.id
  }

  // 4. Retrieve maximum numeric suffix of existing serviceCodes to generate unique codes
  const allServices = await prisma.service.findMany({
    select: { serviceCode: true }
  })
  let maxCodeNumber = 0
  for (const s of allServices) {
    if (s.serviceCode) {
      const match = s.serviceCode.match(/(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxCodeNumber) {
          maxCodeNumber = num
        }
      }
    }
  }
  console.log(`Starting service code suffix from: ${maxCodeNumber + 1}`)

  let createdCount = 0
  let updatedCount = 0

  // 5. Populate and upsert services
  for (const s of servicesData) {
    const catId = categoryMap[s.category]
    if (!catId) {
      console.warn(`Category "${s.category}" not found in database. Skipping service "${s.name}"`)
      continue
    }

    // Check if the service already exists in the same category
    const existing = await prisma.service.findFirst({
      where: {
        serviceName: s.name,
        categoryId: catId
      }
    })

    if (existing) {
      // Update existing service pricing & department association
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          price: s.price,
          doctorFee: s.doctorFee,
          departmentId: departmentId,
          clinicId: clinicId
        }
      })
      updatedCount++
    } else {
      // Create new service with unique serviceCode
      maxCodeNumber++
      const newServiceCode = `SVC-${maxCodeNumber.toString().padStart(4, '0')}`

      await prisma.service.create({
        data: {
          serviceCode: newServiceCode,
          serviceName: s.name,
          price: s.price,
          doctorFee: s.doctorFee,
          categoryId: catId,
          departmentId: departmentId,
          clinicId: clinicId,
          unit: 'session',
          isActive: true
        }
      })
      createdCount++
    }
  }

  console.log(`Finished seeding dental services! Created: ${createdCount}, Updated: ${updatedCount}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
