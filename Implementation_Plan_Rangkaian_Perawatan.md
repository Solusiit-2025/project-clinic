# Implementation Plan: Fitur Rangkaian Perawatan (Treatment Series)

| | |
|---|---|
| **Versi dokumen** | 2.0 |
| **Tanggal** | 17 Juni 2026 |
| **Status** | Draft — revisi setelah review |
| **Perubahan dari v1.0** | Menambahkan permission per role di level API, audit log status, validasi backend untuk FR-7, enum status, alasan penyesuaian harga manual (FR-13), dan strategi kalkulasi total biaya |

Implementasi fitur ini akan merombak bagaimana `TreatmentPlan` dikelola dalam sistem, menambahkan dukungan *multi-tahap* yang presisi (menggunakan model `Visit` yang ada ditambah relasi ke master data `Service`), serta menyediakan antarmuka khusus untuk dokter dan admin dengan pembatasan akses sesuai peran masing-masing.

## Proposed Changes

### 1. Database Schema (`backend/prisma/schema.prisma`)

Model `TreatmentPlan` dan `Visit` yang sudah ada akan disesuaikan, dan beberapa entitas baru akan ditambahkan untuk mendukung audit trail dan penyesuaian harga.

#### [MODIFY] `backend/prisma/schema.prisma`

**Model `Visit`**
- Ubah `visitDate` menjadi `DateTime?` (nullable) karena FR-8 mensyaratkan tahap dapat dibuat tanpa jadwal (belum dijadwalkan).
- Tambahkan field `status` menggunakan **enum**, bukan string bebas, agar tervalidasi di level database:

```prisma
enum VisitStatus {
  BELUM
  BERJALAN
  SELESAI
}

model Visit {
  id            String        @id @default(cuid())
  treatmentPlanId String
  visitDate     DateTime?
  status        VisitStatus   @default(BELUM)
  order         Int
  services      VisitService[]
  statusLogs    VisitStatusLog[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

**Model Baru `VisitService` (Tindakan dalam tahap)**
- Menyimpan `visitId`, `serviceId`, `price` (snapshot harga saat dipilih — bukan referensi live ke `Service`, agar histori biaya tetap akurat meski tarif master berubah di kemudian hari), `quantity`, `subtotal`.
- Tambahkan field untuk mendukung FR-13 (penyesuaian harga manual oleh admin):

```prisma
model VisitService {
  id              String   @id @default(cuid())
  visitId         String
  serviceId       String
  price           Decimal
  quantity        Int      @default(1)
  subtotal        Decimal
  adjustedPrice   Decimal?
  adjustmentReason String?
  adjustedBy      String?
  adjustedAt      DateTime?
}
```

**Model Baru `VisitStatusLog` (Audit trail — FR-16)**
- Mencatat setiap perubahan status tahap: siapa yang mengubah, kapan, dari status apa ke status apa.

```prisma
model VisitStatusLog {
  id          String      @id @default(cuid())
  visitId     String
  fromStatus  VisitStatus
  toStatus    VisitStatus
  changedBy   String
  changedAt   DateTime    @default(now())
}
```

### 2. Backend API (`backend/src/controllers/treatmentPlan.controller.ts`)

Untuk mencegah lintas-peran mengubah data yang bukan tanggung jawabnya (misalnya admin mengubah tindakan klinis, atau dokter mengubah jadwal tanpa koordinasi), endpoint update dipecah berdasarkan jenis perubahan, masing-masing dengan middleware role-check tersendiri.

- **GET `/api/treatment-plans/:id`**: Memuat data rangkaian beserta `visits`, `visitServices` (join ke `Service`), dan ringkasan kalkulasi (lihat bagian Strategi Kalkulasi Biaya).
- **POST `/api/treatment-plans/:id/visits`**: Endpoint untuk menambahkan tahapan baru beserta array tindakan. Role: **dokter**.
- **PUT `/api/treatment-plans/:id/visits/:visitId/services`**: Endpoint khusus untuk mengubah daftar tindakan dalam suatu tahap. Role: **dokter**.
- **PUT `/api/treatment-plans/:id/visits/:visitId/schedule`**: Endpoint khusus untuk mengubah tanggal kunjungan. Role: **admin**.
- **PUT `/api/treatment-plans/:id/visits/:visitId/status`**: Endpoint khusus untuk mengubah status tahap. Role: **dokter, perawat**. Setiap pemanggilan endpoint ini menulis satu baris baru ke `VisitStatusLog` (FR-16).
- **PUT `/api/treatment-plans/:id/visits/:visitId/adjustment`**: Endpoint untuk penyesuaian harga manual. Role: **admin**. Mewajibkan field `adjustmentReason` (tidak boleh kosong) sesuai FR-13.
- **DELETE `/api/treatment-plans/:id/visits/:visitId`**: Endpoint untuk menghapus tahapan. Role: **dokter**. Menolak permintaan dengan status `409 Conflict` apabila `visit.status === "SELESAI"` (validasi backend untuk FR-7, tidak hanya disable tombol di frontend).

Middleware role-check (`requireRole(['DOCTOR'])`, `requireRole(['ADMIN'])`, dst) diterapkan di level route, bukan dicek manual di setiap controller, agar konsisten dan mudah diaudit.

### 3. Strategi kalkulasi total biaya

Total estimasi biaya **dihitung on-the-fly** saat `GET /api/treatment-plans/:id` dipanggil, dengan mengagregasi `subtotal` (atau `adjustedPrice` jika ada) dari seluruh `VisitService` terkait. Pendekatan ini dipilih dibanding menyimpan field cache di `TreatmentPlan` karena:

- Menghindari risiko data basi ketika tindakan ditambah/diubah/dihapus dari berbagai endpoint berbeda.
- Jumlah `VisitService` per rangkaian relatif kecil (biasanya belasan baris), sehingga agregasi on-the-fly tidak membebani performa.

Jika di kemudian hari volume data bertambah besar dan agregasi on-the-fly mulai memengaruhi performa, dapat dipertimbangkan migrasi ke field cache dengan strategi *invalidation* yang jelas (trigger di setiap endpoint yang mengubah `VisitService`).

### 4. Frontend UI

#### [MODIFY] `frontend/components/doctor/TreatmentPlanModule.tsx`
- Saat pembuatan rangkaian baru berhasil, arahkan dokter (menggunakan `router.push`) ke halaman detail rangkaian di `/doctor/treatment-series/[id]`.

#### [NEW] `frontend/app/doctor/treatment-series/[id]/page.tsx`
- Halaman mandiri (bukan modal di `queue/[id]`) untuk menampilkan dashboard detail rangkaian, agar tautannya bisa dibagikan dan tetap dapat diakses lintas sesi kunjungan (FR-2).
- Menampilkan ringkasan: **Total Kunjungan**, **Tahap Selesai**, **Estimasi Total Biaya** (hasil agregasi dari backend, bukan dihitung ulang di frontend).
- Menampilkan daftar `Visit` (tahapan) secara vertikal.
- Tombol **+ Tambah tahap** memunculkan modal pemilihan master tindakan dan pembuatan tahap baru — hanya tampil untuk role dokter.
- Field tanggal kunjungan hanya dapat diedit oleh role admin; field tindakan dan status hanya dapat diedit oleh role dokter/perawat sesuai pemetaan endpoint di atas. Tombol/field yang bukan kewenangan role aktif ditampilkan dalam mode *read-only*, bukan disembunyikan, supaya tetap ada transparansi lintas peran.

#### [NEW] `frontend/components/doctor/TreatmentStepModal.tsx`
- Modal form untuk menambah/mengedit tahap.
- Memiliki dropdown search ke master data tindakan (`/api/services`).
- Memunculkan harga otomatis setelah master tindakan dipilih (FR-11).

## Verification Plan

### Automated Tests
- Menjalankan `prisma format` dan `prisma db push` untuk memverifikasi validitas perubahan skema, termasuk enum `VisitStatus`.
- Test unit untuk setiap endpoint baru, termasuk:
  - Percobaan akses lintas role: admin memanggil endpoint `/services` (seharusnya `403 Forbidden`); dokter memanggil endpoint `/schedule` (seharusnya `403 Forbidden`).
  - Percobaan `DELETE` pada tahap berstatus `SELESAI` (seharusnya `409 Conflict`).
  - Percobaan `PUT .../adjustment` tanpa `adjustmentReason` (seharusnya `400 Bad Request`).
  - Verifikasi bahwa setiap perubahan status menulis baris baru ke `VisitStatusLog` dengan `changedBy` dan `changedAt` yang benar.
- Memastikan server Node.js backend dan frontend dapat berjalan normal setelah modifikasi API.

### Manual Verification
- **Dokter**:
  - Membuat rangkaian baru di antrean pasien.
  - Menambah 2 tahapan yang masing-masing berisi tindakan (mis. Ekstirpasi Pulpa, Obturasi).
  - Memverifikasi total harga terkalkulasi dengan benar.
  - Memastikan tahap dapat diubah statusnya menjadi "Selesai", dan riwayatnya tercatat.
  - Mencoba menghapus tahap yang sudah "Selesai" — harus ditolak sistem.
- **Admin**:
  - Membuka rangkaian tersebut dari sisi Front Office atau saat pasien akan membayar.
  - Memasukkan tanggal jadwal kunjungan berikutnya.
  - Melakukan penyesuaian harga manual pada satu tindakan dan mengisi alasan penyesuaian.
  - Mencoba mengubah daftar tindakan secara langsung lewat API — harus ditolak sistem.

> [!WARNING]
> Karena perubahan skema pada tabel `Visit` mengubah `visitDate` menjadi opsional (`DateTime?`), apabila ada modul existing yang mengasumsikan tipe ini non-nullable, maka akan disesuaikan. Namun karena fitur ini tergolong sangat baru di ekosistem klinik, impaknya akan minimal.

> [!WARNING]
> Migrasi skema menambahkan tabel baru (`VisitService`, `VisitStatusLog`) dan mengubah tipe `status` dari string bebas menjadi enum. Apabila ada data `Visit` lama dengan nilai status yang tidak sesuai dengan enum (misalnya typo atau nilai lain), migrasi perlu menyertakan langkah normalisasi data sebelum `prisma db push` dijalankan di environment produksi.

## Resolved Questions

- **Lokasi rute UI detail**: diputuskan menggunakan rute baru `/doctor/treatment-series/[id]`, bukan modal layar penuh di `queue/[id]`, agar tautan dapat dibagikan dan tetap relevan lintas sesi kunjungan (FR-2).

## Open Questions

- Apakah perawat diberi izin mengubah status tahap secara independen, atau perubahan status oleh perawat tetap memerlukan konfirmasi dokter (misalnya lewat status sementara "menunggu konfirmasi")?
- Apakah penyesuaian harga manual oleh admin (FR-13) memerlukan approval tambahan dari dokter/pihak lain sebelum berlaku, atau cukup tercatat di audit log?
- Apakah dibutuhkan endpoint terpisah untuk mengambil riwayat `VisitStatusLog` per tahap (untuk ditampilkan di UI sebagai timeline), atau cukup disertakan sebagai relasi nested di response `GET /api/treatment-plans/:id`?
