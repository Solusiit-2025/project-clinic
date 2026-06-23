# Implementasi Odontogram Terintegrasi (Poli Gigi) — v2

## Ringkasan

Dokumen ini merupakan revisi dari rencana teknis Odontogram sebelumnya. Struktur dasar (snapshot before/after di `MedicalRecord`, latest state di model `Odontogram`, field `Json` di PostgreSQL) tetap dipertahankan karena sudah sesuai kebutuhan. Revisi ini menambahkan detail yang sebelumnya belum diputuskan: granularitas data per gigi, validasi data, kontrol akses, penanganan race condition, dan cakupan pengujian yang lebih lengkap.

## Keputusan yang Perlu Disetujui

Sebelum implementasi dimulai, empat keputusan berikut menentukan bentuk skema JSON secara langsung. Rekomendasi diberikan agar rencana ini bisa langsung dieksekusi, namun mohon dikonfirmasi atau diganti sesuai kebutuhan klinik.

**Granularitas data.** Direkomendasikan mencatat status per permukaan gigi (mesial, distal, oklusal/insisal, bukal/labial, lingual/palatal), bukan satu status untuk seluruh gigi. Alasannya: karies pada satu permukaan vs beberapa permukaan punya implikasi tindakan yang berbeda (tambalan kecil vs crown/cabut), dan retrofit ke level permukaan setelah aplikasi berjalan jauh lebih mahal daripada mendesainnya dari awal.

**Kondisi majemuk per gigi.** Direkomendasikan setiap gigi menyimpan array kondisi, bukan satu field status tunggal, karena satu gigi sering punya lebih dari satu temuan bersamaan (contoh: tambalan lama dengan karies sekunder di tepinya).

**Layer kondisi vs rencana perawatan.** Direkomendasikan memisahkan `existing` (kondisi aktual) dan `planned` (rencana tindakan) pada setiap gigi, mengikuti konvensi odontogram standar yang membedakan keduanya secara visual (warna solid vs outline).

**Audit trail.** Direkomendasikan setiap entri kondisi menyimpan `recordedAt` dan `doctorId` di level kondisi (bukan hanya di level `MedicalRecord`), mengingat data rekam medis gigi berimplikasi legal dan perlu bisa ditelusuri sampai ke perubahan spesifik, kapan, dan oleh siapa.

Contoh bentuk data hasil dari keempat keputusan di atas:

```json
{
  "teeth": {
    "16": {
      "existing": [
        { "type": "tambalan", "material": "amalgam", "surface": ["O"], "recordedAt": "2026-06-10T09:00:00Z", "doctorId": "dr-001" },
        { "type": "karies_sekunder", "surface": ["M"], "recordedAt": "2026-06-17T08:30:00Z", "doctorId": "dr-001" }
      ],
      "planned": [
        { "type": "crown", "surface": ["full"], "recordedAt": "2026-06-17T08:30:00Z", "doctorId": "dr-001" }
      ]
    },
    "36": {
      "existing": [
        { "type": "missing", "recordedAt": "2025-11-02T10:00:00Z", "doctorId": "dr-002" }
      ],
      "planned": []
    }
  }
}
```

Notasi gigi mengikuti standar FDI (11–18, 21–28, 31–38, 41–48 untuk gigi dewasa; 51–55, 61–65, 71–75, 81–85 untuk gigi sulung) — ini sudah sesuai rencana awal dan tidak diubah.

## 1. Database Schema (`backend/prisma/schema.prisma`)

Selain perubahan yang sudah direncanakan sebelumnya, ditambahkan hal berikut:

- Model `Odontogram` mendapat field `version` (integer, increment tiap update) untuk mencegah race condition saat dua sesi mengubah data yang sama secara bersamaan; backend menolak update jika `version` yang dikirim klien tidak cocok dengan yang tersimpan.
- Model `Odontogram` mendapat field `lastUpdatedByRecordId`, mereferensikan `MedicalRecord` terakhir yang mengubahnya, supaya riwayat bisa ditelusuri langsung tanpa query manual ke seluruh `MedicalRecord` pasien.
- Field `odontogramBefore` dan `odontogramAfter` di `MedicalRecord` tetap sebagai snapshot penuh per sesi, sesuai rencana awal.
- Bentuk JSON di atas (existing/planned, array kondisi, recordedAt, doctorId) didefinisikan sebagai TypeScript interface dan skema Zod bersama, dipakai oleh backend (validasi sebelum simpan) dan frontend (tipe komponen), sebagai satu sumber kebenaran agar kedua sisi tidak saling drift.

## 2. Backend API & Controllers

### [NEW] `backend/src/routes/odontogram.routes.ts`
Endpoint untuk mengambil dan memperbarui latest state Odontogram pasien, dengan middleware role-check: hanya role dokter (dan opsional admin, perlu konfirmasi) yang boleh mengubah data; role lain hanya bisa membaca.

### [NEW] `backend/src/controllers/odontogram.controller.ts`
- `getOdontogramByPatient(patientId)` — jika pasien belum punya record Odontogram, controller mengembalikan default state (semua gigi pada kondisi sehat, sesuai tipe dentisi pasien) alih-alih error 404, supaya frontend punya bentuk response yang konsisten pada kunjungan pertama.
- `updateOdontogram(patientId, newState, expectedVersion)` — memvalidasi `newState` terhadap skema Zod, mengecek `expectedVersion` untuk mencegah overwrite tak disengaja, lalu menyimpan dan menaikkan `version`.

### [MODIFY] `backend/src/controllers/medicalRecord.controller.ts`
Menerima payload `odontogramBefore` dan `odontogramAfter`, memvalidasi keduanya dengan skema Zod yang sama, dan jika ada perubahan pada "After", memperbarui tabel `Odontogram` pasien beserta `lastUpdatedByRecordId` dan `version` secara atomik (dalam satu transaksi Prisma) bersama penyimpanan `MedicalRecord`.

### Pertimbangan reporting (dicatat, belum untuk dieksekusi sekarang)
Jika ke depan dibutuhkan laporan agregat (misal jumlah gigi missing per kuadran untuk keperluan statistik atau klaim BPJS), query terhadap kolom JSON akan terasa lambat dan rumit. Opsi yang bisa dipertimbangkan saat kebutuhan ini muncul: menambahkan index GIN pada kolom JSONB, atau menormalisasi status per gigi ke tabel relasional terpisah. Ini di luar cakupan implementasi awal, hanya dicatat agar tidak menjadi kejutan di kemudian hari.

## 3. Frontend UI Components

### [NEW] `frontend/components/doctor/Odontogram.tsx`
- Visualisasi tetap menggunakan SVG/CSS Grid untuk memetakan gigi dewasa dan gigi sulung, dengan tiap gigi dipecah menjadi 5 area permukaan yang bisa diklik terpisah, sesuai keputusan granularitas di atas.
- State perubahan disimpan secara lokal di komponen selama sesi pemeriksaan berlangsung; pengiriman ke backend baru terjadi saat dokter menekan tombol simpan rekam medis secara keseluruhan, bukan per klik gigi. Ini menghindari beban API call berlebihan dan konsisten dengan pola before/after yang sudah direncanakan.
- Legenda status menyertakan warna, simbol, dan label teks untuk setiap kondisi (bukan warna saja), agar tetap terbaca oleh dokter dengan gangguan persepsi warna dan saat dicetak hitam-putih.
- Untuk pasien pada rentang usia gigi campuran (mixed dentition), komponen menampilkan kedua notasi (gigi permanen dan gigi sulung) sesuai data yang ada pada `teeth`, bukan memilih salah satu berdasarkan usia.
- Disediakan mode "print view" terpisah dari mode interaktif: render statis tanpa elemen klik, untuk kebutuhan cetak rekam medis fisik atau lampiran klaim asuransi/BPJS.

### [MODIFY] `frontend/app/doctor/queue/[id]/page.tsx`
Menyisipkan komponen `Odontogram.tsx`, mengambil state awal dari `odontogram` pasien (termasuk `version` untuk dikirim kembali saat update), dan menyimpan hasil akhir sesi ke `odontogramAfter` pada form `MedicalRecord`, sesuai rencana awal.

## 4. Migrasi & Kompatibilitas Data

Field `odontogramBefore` dan `odontogramAfter` bersifat nullable, sehingga `MedicalRecord` lama yang sudah ada di database tidak memerlukan migrasi data — field tersebut otomatis bernilai `null` dan harus diperlakukan sebagai "tidak ada data odontogram" saat ditampilkan di riwayat pasien lama, bukan dianggap error.

## Verification Plan

### Automated Tests
- `npx prisma format` dan `npx prisma generate` untuk memastikan skema valid.
- Build TypeScript backend tanpa error.
- Unit test untuk skema validasi Zod: payload tidak valid (misal `surface` berisi nilai di luar daftar yang diizinkan) harus ditolak controller dengan pesan error yang jelas, bukan tersimpan dalam bentuk rusak.
- Unit test untuk `getOdontogramByPatient` pada pasien baru: memastikan default state ter-generate dengan benar sesuai tipe dentisi.
- Unit test untuk mekanisme `version`: update dengan `expectedVersion` yang sudah usang harus ditolak.

### Manual Verification
- Masuk ke dashboard Dokter, pilih pasien yang antre.
- Membuka panel Odontogram, memastikan default state tampil benar untuk pasien yang belum pernah punya data.
- Mengubah status pada level permukaan gigi tertentu, memastikan kondisi majemuk (lebih dari satu temuan per gigi) tersimpan dan ditampilkan dengan benar.
- Mencoba menambahkan entri pada layer "planned" tanpa mengubah layer "existing", memastikan keduanya tervisualisasi berbeda.
- Menyimpan sesi (Save Medical Record) dan memeriksa Network Tab untuk memastikan `odontogramBefore`, `odontogramAfter`, serta `version` baru pada tabel `Odontogram` terekam dengan benar.
- Mencoba mengubah Odontogram dari role selain dokter untuk memastikan endpoint menolak akses sesuai kontrol peran.

## Di Luar Cakupan (Dicatat untuk Diskusi Lanjutan)

- Normalisasi data ke tabel relasional terpisah untuk kebutuhan reporting/agregasi.
- Riwayat odontogram lintas-sesi dalam bentuk timeline visual (saat ini riwayat hanya tersedia melalui snapshot before/after per `MedicalRecord`).
- Integrasi format cetak Odontogram dengan template klaim BPJS, jika diperlukan secara spesifik oleh format BPJS.

## Persetujuan

Mohon konfirmasi empat keputusan pada bagian "Keputusan yang Perlu Disetujui" (granularitas per permukaan, kondisi majemuk berbentuk array, pemisahan layer existing/planned, audit trail per kondisi). Setelah dikonfirmasi atau direvisi, implementasi dapat langsung dimulai sesuai rencana ini.
