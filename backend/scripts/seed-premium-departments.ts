import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🏛️ Menyiapkan Struktur Departemen Klinik Premium Berjenjang...')

    const clinic = await prisma.clinic.findFirst({ where: { isMain: true } })
    if (!clinic) {
      console.error('❌ Klinik utama tidak ditemukan.')
      return
    }

    // 1. Hapus departemen lama untuk klinik ini (Clean Start)
    console.log(`🧹 Membersihkan departemen lama di ${clinic.name}...`)
    await prisma.department.deleteMany({ where: { clinicId: clinic.id } })

    const structure = [
      {
        parent: { name: 'Departemen Medis (Core Services)', description: 'Jantung operasional klinik. Fokus pada pelayanan medis prima.', order: 1 },
        children: [
          { name: 'Poli Spesialis', description: 'Konsultasi dokter spesialis (Estetika, Gigi, Anak, Penyakit Dalam).' },
          { name: 'Unit Gawat Darurat (UGD) Terbatas', description: 'Penanganan awal kegawatdaruratan sebelum rujukan.' },
          { name: 'Keperawatan (Nursing)', description: 'Staf perawat terlatih dengan standar keramahan hotel berbintang.' },
          { name: 'Farmasi', description: 'Penyediaan obat-obatan paten dan racikan berkualitas tinggi.' },
          { name: 'Laboratorium & Diagnostik', description: 'Fasilitas cek darah, USG, dan radiologi di tempat.' }
        ]
      },
      {
        parent: { name: 'Departemen Patient Experience & Frontliner', description: 'Area krusial untuk pelayanan segmen menengah ke atas.', order: 2 },
        children: [
          { name: 'Concierge & Reception', description: 'Layanan pendaftaran dengan sistem personal asisten.' },
          { name: 'Patient Relations Officer (PRO)', description: 'Penanganan keluhan dan kebutuhan khusus pasien secara personal.' },
          { name: 'Call Center & Telemarketing', description: 'Appointment reminder dan layanan purna jual (customer care).' }
        ]
      },
      {
        parent: { name: 'Departemen Operasional & Fasilitas', description: 'Menjamin kenyamanan fisik dan kelancaran teknis fasilitas.', order: 3 },
        children: [
          { name: 'Housekeeping (Hospitality Standard)', description: 'Kebersihan area klinik dengan standar industri perhotelan.' },
          { name: 'Maintenance & Engineering', description: 'Pemeliharaan alat medis dan fasilitas (AC, Wi-Fi, Lift).' },
          { name: 'Purchasing & Inventory', description: 'Pengadaan stok bahan medis dan non-medis berkualitas.' }
        ]
      },
      {
        parent: { name: 'Departemen Bisnis & Administrasi', description: 'Fungsi manajerial untuk keberlangsungan bisnis klinik.', order: 4 },
        children: [
          { name: 'Finance, Accounting, & Tax', description: 'Pengelolaan arus kas, pelaporan keuangan, dan perpajakan.' },
          { name: 'Human Resources Development (HRD)', description: 'Rekrutmen dan pelatihan staf dengan soft skill pelayanan premium.' },
          { name: 'Marketing & Public Relations', description: 'Branding, social media, dan kerjasama komunitas eksklusif/asuransi.' },
          { name: 'IT Support', description: 'Pengelolaan SIM-Klinik dan keamanan data pasien.' }
        ]
      },
      {
        parent: { name: 'Departemen Penunjang Khusus (Premium Extra)', description: 'Nilai tambah untuk keamanan dan kenyamanan VIP.', order: 5 },
        children: [
          { name: 'Quality Assurance & Komite Medik', description: 'Memastikan standar SOP dan keselamatan pasien (Patient Safety).' },
          { name: 'Layanan Home Care', description: 'Tim medis khusus untuk tindakan di rumah pasien (VIP Home Service).' }
        ]
      }
    ]

    for (const group of structure) {
      // Create Parent
      const parentDept = await prisma.department.create({
        data: {
          name: group.parent.name,
          description: group.parent.description,
          clinicId: clinic.id,
          level: 0,
          sortOrder: group.parent.order,
          isActive: true
        }
      })
      console.log(`📂 Parent: ${parentDept.name}`)

      // Create Children
      for (const [index, child] of group.children.entries()) {
        const childDept = await prisma.department.create({
          data: {
            name: child.name,
            description: child.description,
            clinicId: clinic.id,
            parentId: parentDept.id,
            level: 1,
            sortOrder: index + 1,
            isActive: true
          }
        })
        console.log(`   └── Child: ${childDept.name}`)
      }
    }

    console.log(`\n✨ Berhasil memperbarui struktur departemen premium di ${clinic.name}.`)

  } catch (error) {
    console.error('❌ Gagal memperbarui departemen:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
