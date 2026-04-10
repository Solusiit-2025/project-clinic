
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const CATEGORIES = [
  { id: 'cat-001', categoryName: 'Konsultasi', description: 'Layanan konsultasi dengan dokter umum, spesialis, dan subspesialis' },
  { id: 'cat-002', categoryName: 'Tindakan Medis', description: 'Tindakan medis minor, major, dan prosedur bedah kecil' },
  { id: 'cat-003', categoryName: 'Pemeriksaan Laboratorium', description: 'Tes darah, urine, feses, hormon, dan penanda penyakit' },
  { id: 'cat-004', categoryName: 'Radiologi & Imaging', description: 'USG, X-Ray, CT Scan, MRI, Mammografi, dan fluoroskopi' },
  { id: 'cat-005', categoryName: 'Terapi & Rehabilitasi', description: 'Fisioterapi, okupasi terapi, terapi wicara, dan akupunktur' },
  { id: 'cat-006', categoryName: 'Paket Kesehatan & Vaksinasi', description: 'Paket medical check up, imunisasi dewasa, anak, dan lansia' },
  { id: 'cat-007', categoryName: 'Tindakan Gigi', description: 'Scaling, tambal, cabut, veneer, kawat gigi, implan, pemutihan gigi' },
  { id: 'cat-008', categoryName: 'Perawatan Estetika Medis', description: 'Botox, filler, laser, chemical peeling, microneedling, PRP' },
  { id: 'cat-009', categoryName: 'Gawat Darurat & Ambulans', description: 'Layanan IGD 24 jam, ambulans, dan pertolongan pertama' },
  { id: 'cat-010', categoryName: 'Home Care & Telemedisin', description: 'Layanan kunjungan dokter ke rumah, konsultasi online' },
  { id: 'cat-011', categoryName: 'Psikologi & Kejiwaan', description: 'Konseling psikologi, psikotes, psikiater, terapi perilaku' },
  { id: 'cat-012', categoryName: 'Gizi & Dietetik', description: 'Konsultasi gizi, diet khusus, body composition analysis' },
  { id: 'cat-013', categoryName: 'Optometri & Optik', description: 'Pemeriksaan mata, kacamata, lensa kontak, terapi mata malas' },
  { id: 'cat-014', categoryName: 'Audiology & THT', description: 'Pemeriksaan pendengaran, tinnitus terapi, fitting alat bantu dengar' },
  { id: 'cat-015', categoryName: 'Program Promotif & Preventif', description: 'Edukasi kesehatan, screening penyakit, program deteksi dini' }
]

const SERVICES = [
  { id: 'svc-001', serviceCode: 'KONS-001', serviceName: 'Konsultasi Dokter Umum', description: 'Konsultasi dengan dokter umum, termasuk resep dan rujukan', categoryId: 'cat-001', unit: 'session', price: 150000 },
  { id: 'svc-002', serviceCode: 'KONS-002', serviceName: 'Konsultasi Dokter Spesialis Jantung', description: 'Konsultasi dengan Spesialis Jantung (Sp.JP)', categoryId: 'cat-001', unit: 'session', price: 350000 },
  { id: 'svc-003', serviceCode: 'KONS-003', serviceName: 'Konsultasi Dokter Spesialis Anak', description: 'Konsultasi tumbuh kembang, imunisasi, dan nutrisi anak', categoryId: 'cat-001', unit: 'session', price: 250000 },
  { id: 'svc-004', serviceCode: 'KONS-004', serviceName: 'Konsultasi Dokter Spesialis Kandungan', description: 'Konsultasi kehamilan, kesehatan reproduksi wanita', categoryId: 'cat-001', unit: 'session', price: 300000 },
  { id: 'svc-005', serviceCode: 'KONS-005', serviceName: 'Konsultasi Dokter Spesialis Saraf', description: 'Konsultasi sakit kepala, stroke, gangguan saraf', categoryId: 'cat-001', unit: 'session', price: 350000 },
  { id: 'svc-006', serviceCode: 'KONS-006', serviceName: 'Konsultasi Dokter Spesialis Bedah', description: 'Konsultasi pra/pasca operasi, tumor, hernia', categoryId: 'cat-001', unit: 'session', price: 400000 },
  { id: 'svc-007', serviceCode: 'TINDAK-001', serviceName: 'Jahit Luka (Minor)', description: 'Penjahitan luka tanpa komplikasi, termasuk anestesi lokal', categoryId: 'cat-002', unit: 'item', price: 500000 },
  { id: 'svc-008', serviceCode: 'TINDAK-002', serviceName: 'Pemasangan Infus', description: 'Pemasangan IV line untuk rehidrasi, obat', categoryId: 'cat-002', unit: 'item', price: 150000 },
  { id: 'svc-009', serviceCode: 'TINDAK-003', serviceName: 'Injeksi & Suntik Obat', description: 'Suntikan IM/IV/SC termasuk obat (non spesial)', categoryId: 'cat-002', unit: 'item', price: 75000 },
  { id: 'svc-010', serviceCode: 'TINDAK-004', serviceName: 'Perawatan Luka Bakar Ringan', description: 'Perawatan luka bakar derajat 1-2 (<10%)', categoryId: 'cat-002', unit: 'session', price: 350000 },
  { id: 'svc-011', serviceCode: 'TINDAK-005', serviceName: 'Pemasangan Kateter Urin', description: 'Pemasangan folley catheter', categoryId: 'cat-002', unit: 'item', price: 200000 },
  { id: 'svc-012', serviceCode: 'TINDAK-006', serviceName: 'Insisi & Drainase Abses', description: 'Membuka dan mengeluarkan nanah pada abses kecil', categoryId: 'cat-002', unit: 'item', price: 750000 },
  { id: 'svc-013', serviceCode: 'LAB-001', serviceName: 'Hematologi Lengkap', description: 'Pemeriksaan HB, leukosit, trombosit, hematokrit', categoryId: 'cat-003', unit: 'item', price: 120000 },
  { id: 'svc-014', serviceCode: 'LAB-002', serviceName: 'Gula Darah Puasa & 2 Jam PP', description: 'Tes toleransi gula darah (screening DM)', categoryId: 'cat-003', unit: 'item', price: 85000 },
  { id: 'svc-015', serviceCode: 'LAB-003', serviceName: 'Profil Lipid Lengkap', description: 'Pemeriksaan kolesterol total, HDL, LDL, TG', categoryId: 'cat-003', unit: 'item', price: 140000 },
  { id: 'svc-016', serviceCode: 'LAB-004', serviceName: 'Fungsi Hati (SGOT/SGPT/Gamma GT)', description: 'Pemeriksaan enzim hati', categoryId: 'cat-003', unit: 'item', price: 110000 },
  { id: 'svc-017', serviceCode: 'LAB-005', serviceName: 'Fungsi Ginjal (Ureum & Kreatinin)', description: 'Pemeriksaan kadar ureum dan kreatinin', categoryId: 'cat-003', unit: 'item', price: 90000 },
  { id: 'svc-018', serviceCode: 'LAB-006', serviceName: 'Urinalisa Lengkap', description: 'Pemeriksaan fisik, kimia, mikroskopis urine', categoryId: 'cat-003', unit: 'item', price: 70000 },
  { id: 'svc-019', serviceCode: 'LAB-007', serviceName: 'Hormon Tiroid (TSH/fT4)', description: 'Pemeriksaan fungsi tiroid', categoryId: 'cat-003', unit: 'item', price: 180000 },
  { id: 'svc-020', serviceCode: 'LAB-008', serviceName: 'Marka Jantung (Troponin/CKMB)', description: 'Pemeriksaan untuk diagnosis infark miokard', categoryId: 'cat-003', unit: 'item', price: 220000 },
  { id: 'svc-021', serviceCode: 'RAD-001', serviceName: 'USG Abdomen', description: 'Pemeriksaan organ hati, empedu, pankreas, ginjal', categoryId: 'cat-004', unit: 'item', price: 350000 },
  { id: 'svc-022', serviceCode: 'RAD-002', serviceName: 'USG Payudara + Doppler', description: 'Pemeriksaan payudara untuk massa/tumor', categoryId: 'cat-004', unit: 'item', price: 400000 },
  { id: 'svc-023', serviceCode: 'RAD-003', serviceName: 'Foto Thorax (X-Ray Dada)', description: 'Pemeriksaan paru, jantung, tulang iga', categoryId: 'cat-004', unit: 'item', price: 200000 },
  { id: 'svc-024', serviceCode: 'RAD-004', serviceName: 'Foto Polos Tulang (1 regio)', description: 'X-Ray ekstremitas atau tulang belakang', categoryId: 'cat-004', unit: 'item', price: 180000 },
  { id: 'svc-025', serviceCode: 'RAD-005', serviceName: 'CT Scan Kepala (Non Kontras)', description: 'Pencitraan otak (stroke/trauma)', categoryId: 'cat-004', unit: 'item', price: 1200000 },
  { id: 'svc-026', serviceCode: 'RAD-006', serviceName: 'CT Scan Abdomen (Dengan Kontras)', description: 'Pencitraan detail organ perut dengan kontras', categoryId: 'cat-004', unit: 'item', price: 1800000 },
  { id: 'svc-027', serviceCode: 'RAD-007', serviceName: 'MRI Lumbosakral', description: 'Pencitraan tulang belakang (HNP)', categoryId: 'cat-004', unit: 'item', price: 2500000 },
  { id: 'svc-028', serviceCode: 'RAD-008', serviceName: 'Mammografi Digital', description: 'Screening kanker payudara', categoryId: 'cat-004', unit: 'item', price: 500000 },
  { id: 'svc-029', serviceCode: 'TERAPI-001', serviceName: 'Fisioterapi (1 Sesi)', description: 'Latihan, TENS/IFT, manual therapy', categoryId: 'cat-005', unit: 'session', price: 200000 },
  { id: 'svc-030', serviceCode: 'TERAPI-002', serviceName: 'Pijat Medis (Sport/Neuromuscular)', description: 'Terapi cedera olahraga, nyeri otot', categoryId: 'cat-005', unit: 'session', price: 250000 },
  { id: 'svc-031', serviceCode: 'TERAPI-003', serviceName: 'Akupunktur Medis (1 Sesi)', description: 'Terapi jarum nyeri kronis, migrain', categoryId: 'cat-005', unit: 'session', price: 300000 },
  { id: 'svc-032', serviceCode: 'TERAPI-004', serviceName: 'Okupasi Terapi Anak', description: 'Terapi keterlambatan perkembangan/autisme', categoryId: 'cat-005', unit: 'session', price: 350000 },
  { id: 'svc-033', serviceCode: 'TERAPI-005', serviceName: 'Terapi Wicara', description: 'Terapi gangguan bicara/artikulasi', categoryId: 'cat-005', unit: 'session', price: 300000 },
  { id: 'svc-034', serviceCode: 'PAKET-001', serviceName: 'Medical Check Up Basic', description: 'Hematolgi, Gula darah, Kolesterol, Urinalisa', categoryId: 'cat-006', unit: 'package', price: 350000 },
  { id: 'svc-035', serviceCode: 'PAKET-002', serviceName: 'Medical Check Up Eksekutif', description: 'EKG, USG, Lab lengkap, Dokter', categoryId: 'cat-006', unit: 'package', price: 1200000 },
  { id: 'svc-036', serviceCode: 'PAKET-003', serviceName: 'Medical Check Up Karyawan', description: 'Paket standar screening karyawan', categoryId: 'cat-006', unit: 'package', price: 450000 },
  { id: 'svc-037', serviceCode: 'PAKET-004', serviceName: 'Paket Prolanis (Hipertensi + Diabetes)', description: 'Monitoring rutin pasien prolanis', categoryId: 'cat-006', unit: 'package', price: 250000 },
  { id: 'svc-038', serviceCode: 'PAKET-005', serviceName: 'Vaksin COVID-19 (Booster Pfizer)', description: 'Vaksinasi booster dosis ke-2', categoryId: 'cat-006', unit: 'item', price: 250000 },
  { id: 'svc-039', serviceCode: 'PAKET-006', serviceName: 'Vaksin Influenza (Flu)', description: 'Vaksin flu tahunan dewasa/anak', categoryId: 'cat-006', unit: 'item', price: 180000 },
  { id: 'svc-040', serviceCode: 'PAKET-007', serviceName: 'Vaksin Hepatitis B (Dosis 1-3)', description: 'Vaksinasi hepatitis B dewasa', categoryId: 'cat-006', unit: 'item', price: 220000 },
  { id: 'svc-041', serviceCode: 'PAKET-008', serviceName: 'Vaksin HPV (Gardasil 9)', description: 'Vaksin pencegahan kanker serviks', categoryId: 'cat-006', unit: 'item', price: 850000 },
  { id: 'svc-042', serviceCode: 'GIGI-001', serviceName: 'Scaling & Poles Gigi', description: 'Pembersihan karang gigi ultrasonik', categoryId: 'cat-007', unit: 'session', price: 300000 },
  { id: 'svc-043', serviceCode: 'GIGI-002', serviceName: 'Tambal Gigi (Resin Komposit)', description: 'Penambalan gigi warna gigi', categoryId: 'cat-007', unit: 'item', price: 350000 },
  { id: 'svc-044', serviceCode: 'GIGI-003', serviceName: 'Cabut Gigi (Permanen Non Bedah)', description: 'Pencabutan gigi dengan anestesi lokal', categoryId: 'cat-007', unit: 'item', price: 250000 },
  { id: 'svc-045', serviceCode: 'GIGI-004', serviceName: 'Veneer Gigi (Resin/1 gigi)', description: 'Pemasangan veneer resin', categoryId: 'cat-007', unit: 'item', price: 750000 },
  { id: 'svc-046', serviceCode: 'GIGI-005', serviceName: 'Bleaching / Pemutihan Gigi', description: 'Pemutihan gigi LED (in-office)', categoryId: 'cat-007', unit: 'session', price: 1500000 },
  { id: 'svc-047', serviceCode: 'GIGI-006', serviceName: 'Pemasangan Behel / Ortodonti', description: 'Pemasangan kawat gigi metal', categoryId: 'cat-007', unit: 'package', price: 5000000 },
  { id: 'svc-048', serviceCode: 'ESTETIK-001', serviceName: 'Injeksi Botox (1 area)', description: 'Pengurangan kerutan wajah', categoryId: 'cat-008', unit: 'session', price: 2500000 },
  { id: 'svc-049', serviceCode: 'ESTETIK-002', serviceName: 'Filler Asam Hyaluronat (1 cc)', description: 'Pengisi area wajah/pipi/bibir', categoryId: 'cat-008', unit: 'session', price: 3500000 },
  { id: 'svc-050', serviceCode: 'ESTETIK-003', serviceName: 'Chemical Peeling (Medium)', description: 'Pengangkatan sel kulit mati', categoryId: 'cat-008', unit: 'session', price: 850000 },
  { id: 'svc-051', serviceCode: 'ESTETIK-004', serviceName: 'Laser CO2 Fraksional', description: 'Resurfacing laser bekas jerawat', categoryId: 'cat-008', unit: 'session', price: 3000000 },
  { id: 'svc-052', serviceCode: 'ESTETIK-005', serviceName: 'Microneedling + PRP', description: 'Microneedling dengan PRP', categoryId: 'cat-008', unit: 'session', price: 2800000 },
  { id: 'svc-053', serviceCode: 'IGD-001', serviceName: 'Pelayanan Gawat Darurat (IGD)', description: 'Pelayanan 24 jam kasus emergensi', categoryId: 'cat-009', unit: 'session', price: 300000 },
  { id: 'svc-054', serviceCode: 'IGD-002', serviceName: 'Panggilan Ambulans (Dalam Kota)', description: 'Ambulans paramedis, radius 10 km', categoryId: 'cat-009', unit: 'item', price: 500000 },
  { id: 'svc-055', serviceCode: 'HOMECARE-001', serviceName: 'Kunjungan Dokter ke Rumah', description: 'Kunjungan dokter umum ke rumah (dalam kota)', categoryId: 'cat-010', unit: 'session', price: 350000 },
  { id: 'svc-056', serviceCode: 'HOMECARE-002', serviceName: 'Konsultasi Online (Telemedisin)', description: 'Konsultasi via chat/video dokter umum', categoryId: 'cat-010', unit: 'session', price: 75000 },
  { id: 'svc-057', serviceCode: 'PSIKIATRI-001', serviceName: 'Konsultasi Psikologi', description: 'Sesi konseling (60 menit)', categoryId: 'cat-011', unit: 'session', price: 300000 },
  { id: 'svc-058', serviceCode: 'PSIKIATRI-002', serviceName: 'Konsultasi Psikiater', description: 'Konsultasi manajemen obat jiwa', categoryId: 'cat-011', unit: 'session', price: 400000 },
  { id: 'svc-059', serviceCode: 'GIZI-001', serviceName: 'Konsultasi Gizi Klinis', description: 'Konsultasi diet khusus (diabetes/jantung)', categoryId: 'cat-012', unit: 'session', price: 200000 },
  { id: 'svc-060', serviceCode: 'GIZI-002', serviceName: 'Body Composition Analysis (BIA)', description: 'Analisis komposisi tubuh', categoryId: 'cat-012', unit: 'item', price: 125000 },
  { id: 'svc-061', serviceCode: 'MATA-001', serviceName: 'Pemeriksaan Mata Lengkap', description: 'Tajam penglihatan, refraksi', categoryId: 'cat-013', unit: 'session', price: 150000 },
  { id: 'svc-062', serviceCode: 'THT-001', serviceName: 'Pemeriksaan THT + Audiometri', description: 'Pemeriksaan THT + tes pendengaran', categoryId: 'cat-014', unit: 'session', price: 250000 },
  { id: 'svc-063', serviceCode: 'PREVENTIF-001', serviceName: 'Screening Diabetes Gratis', description: 'Pemeriksaan GDS + edukasi (event)', categoryId: 'cat-015', unit: 'item', price: 0 },
  { id: 'svc-064', serviceCode: 'PREVENTIF-002', serviceName: 'Edukasi Kesehatan Jantung', description: 'Sesi edukasi pencegahan jantung', categoryId: 'cat-015', unit: 'session', price: 100000 }
]

async function main() {
  console.log('🚀 Memulai import master data layanan...')

  // 1. Dapatkan Klinik Utama
  const mainClinic = await prisma.clinic.findFirst({ where: { isMain: true } })
  if (!mainClinic) {
    console.error('❌ Klinik Utama tidak ditemukan. Pastikan data klinik sudah ada.')
    return
  }
  const clinicId = mainClinic.id
  console.log(`🏥 Menggunakan Klinik ID: ${clinicId} (${mainClinic.name})`)

  // 2. Import Kategori
  console.log('📂 Mengimport Kategori Layanan...')
  for (const cat of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { categoryName: cat.categoryName },
      update: { description: cat.description },
      create: { 
        id: cat.id, 
        categoryName: cat.categoryName, 
        description: cat.description 
      }
    })
  }
  console.log(`✅ ${CATEGORIES.length} Kategori berhasil di-upsert.`)

  // 3. Import Layanan
  console.log('🏥 Mengimport Layanan Medis...')
  let successCount = 0
  for (const svc of SERVICES) {
    try {
      await prisma.service.upsert({
        where: { serviceCode: svc.serviceCode },
        update: {
            serviceName: svc.serviceName,
            description: svc.description,
            price: svc.price,
            unit: svc.unit,
            categoryId: svc.categoryId,
            clinicId: clinicId
        },
        create: {
          id: svc.id,
          serviceCode: svc.serviceCode,
          serviceName: svc.serviceName,
          description: svc.description,
          price: svc.price,
          unit: svc.unit,
          categoryId: svc.categoryId,
          clinicId: clinicId,
          isActive: true
        }
      })
      successCount++
    } catch (err) {
      console.error(`❌ Gagal mengimport ${svc.serviceCode}:`, err)
    }
  }
  console.log(`✅ ${successCount}/${SERVICES.length} Layanan berhasil di-upsert.`)

  console.log('\n✨ Import Selesai!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
