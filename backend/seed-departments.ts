import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding comprehensive department hierarchy...')

  // Clear existing departments to start fresh with the new structure
  await prisma.department.deleteMany()

  // 1. Departemen Medis & Spesialisasi (Clinical Department)
  const clinical = await prisma.department.create({
    data: {
      name: 'Departemen Medis & Spesialisasi (Clinical Department)',
      description: 'Layanan garis depan yang menentukan reputasi medis klinik.',
      level: 0,
      sortOrder: 1,
      children: {
        create: [
          {
            name: 'Poli Umum (General Practitioner)',
            description: 'Penanganan penyakit akut/kronis ringan dan rujukan.',
            level: 1,
            sortOrder: 1,
          },
          {
            name: 'Poli Gigi & Mulut (Dental Clinic)',
            level: 1,
            sortOrder: 2,
            children: {
              create: [
                { name: 'Konservasi Gigi (Tambal)', level: 2, sortOrder: 1 },
                { name: 'Ortodonti (Behel)', level: 2, sortOrder: 2 },
                { name: 'Bedah Mulut (Odontektomi)', level: 2, sortOrder: 3 },
                { name: 'Prosedur Estetik (Veneer/Bleaching)', level: 2, sortOrder: 4 },
              ]
            }
          },
          {
            name: 'Poli Ibu & Anak (KIA/Pediatric & OBGYN)',
            level: 1,
            sortOrder: 3,
            children: {
              create: [
                { name: 'Imunisasi', level: 2, sortOrder: 1 },
                { name: 'Pemantauan Tumbuh Kembang (Stunting Check)', level: 2, sortOrder: 2 },
                { name: 'USG Kehamilan (2D/4D)', level: 2, sortOrder: 3 },
                { name: 'Layanan KB (IUD/Implan)', level: 2, sortOrder: 4 },
              ]
            }
          },
          {
            name: 'Poli Penyakit Dalam (Internal Medicine)',
            description: 'Manajemen diabetes, hipertensi, dan masalah metabolisme.',
            level: 1,
            sortOrder: 4,
          },
          {
            name: 'Poli Bedah Minor',
            description: 'Tindakan bedah kecil tanpa bius total (kista, luka robek).',
            level: 1,
            sortOrder: 5,
          }
        ]
      }
    }
  })

  // 2. Departemen Penunjang Medis (Diagnostic & Support)
  const diagnostic = await prisma.department.create({
    data: {
      name: 'Departemen Penunjang Medis (Diagnostic & Support)',
      description: 'Bagian yang memastikan diagnosa dokter akurat 100%.',
      level: 0,
      sortOrder: 2,
      children: {
        create: [
          {
            name: 'Instalasi Farmasi (Apotek Klinik)',
            description: 'Pengadaan obat, peracikan, dan konseling obat oleh Apoteker.',
            level: 1,
            sortOrder: 1,
          },
          {
            name: 'Laboratorium Klinik Terpadu',
            level: 1,
            sortOrder: 2,
            children: {
              create: [
                { name: 'Hematologi', description: 'Cek darah lengkap.', level: 2, sortOrder: 1 },
                { name: 'Kimia Klinik', description: 'Cek kolesterol, asam urat, fungsi hati & ginjal.', level: 2, sortOrder: 2 },
                { name: 'Mikrobiologi/Serologi', description: 'Swab, PCR, Tes Widal (Tipes).', level: 2, sortOrder: 3 },
              ]
            }
          },
          {
            name: 'Instalasi Radiologi & Imaging',
            description: 'Rontgen Thorax, Panoramic Gigi, dan USG Abdomen/Kandungan.',
            level: 1,
            sortOrder: 3,
          },
          {
            name: 'Unit Fisioterapi & Rehabilitasi Medik',
            description: 'Terapi syaraf terjepit, cedera olahraga, atau pemulihan stroke ringan.',
            level: 1,
            sortOrder: 4,
          }
        ]
      }
    }
  })

  // 3. Departemen Gawat Darurat & Observasi (Urgent Care)
  const urgent = await prisma.department.create({
    data: {
      name: 'Departemen Gawat Darurat & Observasi (Urgent Care)',
      description: 'Berfungsi 24 jam untuk kondisi mendesak.',
      level: 0,
      sortOrder: 3,
      children: {
        create: [
          {
            name: 'Instalasi Gawat Darurat (IGD)',
            description: 'Area triase, resusitasi, dan stabilisasi.',
            level: 1,
            sortOrder: 1,
          },
          {
            name: 'Unit Observasi / Rawat Inap Sementara',
            description: 'Pemantauan 1x24 jam sebelum diperbolehkan pulang atau dirujuk.',
            level: 1,
            sortOrder: 2,
          },
          {
            name: 'Layanan Ambulans (Emergency Transport)',
            description: 'Penjemputan pasien dan layanan gawat darurat luar klinik.',
            level: 1,
            sortOrder: 3,
          }
        ]
      }
    }
  })

  // 4. Departemen Layanan Pelanggan & Administrasi (Front Office)
  const frontOffice = await prisma.department.create({
    data: {
      name: 'Departemen Layanan Pelanggan & Administrasi (Front Office)',
      description: 'Wajah pertama yang ditemui pasien.',
      level: 0,
      sortOrder: 4,
      children: {
        create: [
          {
            name: 'Pendaftaran & Customer Relation (CRM)',
            description: 'Reservasi online, verifikasi asuransi, penanganan keluhan.',
            level: 1,
            sortOrder: 1,
          },
          {
            name: 'Manajemen Rekam Medis Elektronik (RME)',
            description: 'Digitalisasi riwayat medis pasien sesuai aturan Kemenkes.',
            level: 1,
            sortOrder: 2,
          },
          {
            name: 'Billing & Finance',
            description: 'Kasir, administrasi klaim asuransi, manajemen piutang.',
            level: 1,
            sortOrder: 3,
          }
        ]
      }
    }
  })

  // 5. Departemen Operasional & Manajemen (Back Office)
  const backOffice = await prisma.department.create({
    data: {
      name: 'Departemen Operasional & Manajemen (Back Office)',
      description: 'Bagian yang menjaga klinik tetap berjalan sehat.',
      level: 0,
      sortOrder: 5,
      children: {
        create: [
          {
            name: 'Layanan Umum & Logistik (General Affairs)',
            description: 'Pengadaan alkes, stok obat, dan perlengkapan kantor.',
            level: 1,
            sortOrder: 1,
          },
          {
            name: 'Pencegahan & Pengendalian Infeksi (PPI) / K3',
            description: 'Klinik steril dan sterilisasi alat (CSSD).',
            level: 1,
            sortOrder: 2,
          },
          {
            name: 'Manajemen Limbah Medis (B3)',
            description: 'Pengolahan limbah cair dan padat infeksius.',
            level: 1,
            sortOrder: 3,
          },
          {
            name: 'Information Technology (IT)',
            description: 'Maintenance SIM Klinik, internet, dan keamanan data.',
            level: 1,
            sortOrder: 4,
          },
          {
            name: 'Pemasaran & Kerjasama (Marketing & Partnership)',
            description: 'Kerjasama perusahaan (corporate check-up) dan asuransi.',
            level: 1,
            sortOrder: 5,
          }
        ]
      }
    }
  })

  console.log('Comprehensive Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
