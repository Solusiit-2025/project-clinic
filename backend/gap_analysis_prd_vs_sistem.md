# Gap Analysis: PRD vs Sistem yang Sudah Berjalan
**Modul: Pembayaran Bertahap (DP) & Manajemen Lab Eksternal (Work Order)**

---

## Ringkasan Eksekutif

Setelah membaca kode secara menyeluruh (Backend Controller, Prisma Schema, Frontend Pages), ditemukan bahwa:

- ✅ **~40% fitur PRD sudah berjalan** dalam bentuk yang berbeda
- 🟡 **~25% perlu modifikasi kecil** — logika sudah ada tapi perlu penyesuaian
- 🔴 **~35% adalah fitur baru** yang belum ada sama sekali di sistem

---

## Peta Lengkap: PRD vs Sistem

### FASE 1: Kunjungan Pertama & Pembayaran DP

| Requirement PRD | Status | Kondisi di Sistem | Rekomendasi |
|---|---|---|---|
| Invoice dibuat otomatis saat dokter input tindakan "Indirect/Butuh Lab" | ❌ BELUM ADA | Invoice otomatis dibuat untuk kunjungan biasa (dari EMR). Namun tidak ada flag "Indirect/Butuh Lab" | Tambahkan flag `requiresLab: Boolean` pada tabel `Service` untuk membedakan tindakan indirect |
| Status Invoice: UNPAID → PARTIAL → PAID | ✅ SUDAH ADA | `finance.controller.ts` L228: `newStatus = 'partial'` sudah diimplementasi. Status `unpaid`, `partial`, `paid` sudah ada di sistem | **Tidak perlu perubahan** |
| Input DP (bayar sebagian dari 1 Invoice) | ✅ SUDAH ADA | `processPayment` di finance controller sudah support partial payment pada 1 Invoice. Invoice yang sama bisa dibayar berkali-kali | **Tidak perlu perubahan. Ini sudah sesuai PRD!** |
| Validasi Minimal DP (%) | ❌ BELUM ADA | Tidak ada batas minimal persentase DP. Kasir bisa input nominal berapapun | Tambahkan setting `min_dp_percentage` di `SiteSetting`. Validasi di endpoint `processPayment` |
| Trigger buka akses SPK Lab jika Invoice ≥ PARTIAL | 🟡 SEBAGIAN | Treatment Plan punya relasi ke Invoice. Status invoice bisa dicek. Tapi belum ada gate/guard yang memblokir pembuatan SPK | Tambahkan validasi di endpoint `POST /treatment-plans/:id/work-orders` |

---

### FASE 2: Proses Penantian Lab (Manajemen Work Order Eksternal)

> **⚠️ PERBEDAAN KONSEP KRITIS**: Di sistem, model `LabOrder` adalah untuk **Lab Internal Klinik** (pemeriksaan darah, urin, dll). PRD menginginkan **Work Order untuk Lab Eksternal Gigi** (Dental Lab — Crown, Gigi Palsu, Veneer). Ini adalah **dua entitas yang BERBEDA** dan harus dibuat sebagai model baru.

| Requirement PRD | Status | Kondisi di Sistem | Rekomendasi |
|---|---|---|---|
| Model Work Order (SPK) untuk Lab Eksternal | ❌ BELUM ADA | `LabOrder` yang ada hanya untuk lab internal medis (pemeriksaan darah). Tidak ada entitas untuk dental lab eksternal | **Buat model baru**: `DentalLabWorkOrder` di Prisma |
| Status Work Order: PENDING → SENT_TO_LAB → RECEIVED | ❌ BELUM ADA | Tidak ada | Tambahkan enum baru `WorkOrderStatus` dengan nilai ini |
| Tombol "Buat Work Order" terkunci jika belum DP | ❌ BELUM ADA | Tidak ada gate/guard sama sekali | Tambahkan validasi di controller & disable button di Frontend |
| Halaman Monitoring Lab Eksternal | ❌ BELUM ADA | Halaman `/admin/lab` hanya ada untuk input lab internal | Buat halaman baru `/admin/lab/external` |
| Notifikasi saat status berubah ke RECEIVED | 🟡 SEBAGIAN | Model `Notification` sudah ada di schema (`@@map("notifications")`) | Tinggal trigger emit notifikasi saat status WO diupdate ke `RECEIVED` |
| Cetak / kirim SPK ke Lab | ❌ BELUM ADA | Tidak ada template print untuk dental lab | Buat template print SPK di Frontend |

---

### FASE 3: Kunjungan Kedua & Pelunasan

| Requirement PRD | Status | Kondisi di Sistem | Rekomendasi |
|---|---|---|---|
| Kasir buka Invoice lama (PARTIAL) untuk dilunasi | ✅ SUDAH ADA | Finance module sudah bisa mencari invoice berdasarkan pasien dan status. `processPayment` akan otomatis mengubah status ke `paid` setelah lunas | **Tidak perlu perubahan pada logika payment** |
| Tampilkan "Sisa Tagihan yang Harus Dibayar" | ✅ SUDAH ADA | Treatment Plan page sudah menghitung `remaining = totalBilled - totalPaid` | **Tidak perlu perubahan** |
| Status Invoice otomatis PAID setelah pelunasan | ✅ SUDAH ADA | `finance.controller.ts` L230: `if (totalCoveredFinal >= currentTotal - 0.01) newStatus = 'paid'` | **Tidak perlu perubahan** |
| Status Treatment Plan otomatis COMPLETED | 🟡 SEBAGIAN | Ada endpoint `PATCH /treatment-plans/:id/status` tapi trigger otomatis tidak ada. Admin harus manual | Tambahkan auto-trigger: saat Invoice terakhir dari TreatmentPlan berstatus `paid`, update Treatment Plan ke `COMPLETED` |

---

### Non-Functional Requirements

| Requirement PRD | Status | Kondisi di Sistem | Rekomendasi |
|---|---|---|---|
| Audit Trail (perubahan status + siapa yang mengubah) | 🟡 SEBAGIAN | `ActivityLog` model ada di sistem tapi tidak semua perubahan status dicatat secara konsisten | Tambahkan `createdBy`/`updatedBy` field di model WO baru |
| Pencarian Invoice PARTIAL < 2 detik | ✅ TERPENUHI | Query sudah menggunakan index `@@index([status])` | Pastikan index tetap ada di migration baru |

---

## Komponen yang Harus Dibangun (Roadmap)

### 🔵 TIDAK PERLU DIBANGUN (Sudah Ada & Sudah Sesuai PRD)
1. Logika pembayaran DP (partial payment) di `finance.controller.ts`
2. Status Invoice: `unpaid → partial → paid`
3. Kalkulasi sisa tagihan di Frontend Treatment Plans
4. Model `Notification` di database

---

### 🟡 MODIFIKASI KECIL (Estimasi: 1–2 Hari)

1. **Validasi Minimal DP** (`SiteSetting` + `finance.controller.ts`)
   - Tambah key `min_dp_percentage` di tabel `site_settings`
   - Tambah validasi di `processPayment` sebelum menyimpan payment

2. **Auto-Complete Treatment Plan** (`treatmentPlan.controller.ts`)
   - Di `processPayment`, setelah invoice diupdate ke `paid`, cek apakah invoice tersebut punya `treatmentPlanId`. Jika ya, cek apakah semua invoice dalam TP sudah `paid` → update status TP ke `COMPLETED`

3. **Flag Tindakan Indirect** (`Service` model di schema)
   - Tambah field `requiresExternalLab: Boolean @default(false)` di model `Service`
   - Tampilkan checkbox di UI Master Layanan

---

### 🔴 FITUR BARU (Estimasi: 3–5 Hari Development)

#### A. Schema Database (Prisma Migration)
Tambahkan model baru `DentalLabWorkOrder` ke `schema.prisma`:

```prisma
enum WorkOrderStatus {
  DRAFT
  PENDING_DP
  SENT_TO_LAB
  RECEIVED
  FITTED
  CANCELLED
}

model DentalLabWorkOrder {
  id              String          @id @default(uuid())
  workOrderNo     String          @unique
  treatmentPlanId String
  patientId       String
  labName         String          // Nama Lab Eksternal
  labContact      String?
  description     String          // Deskripsi item yang dipesan (Crown, Gigi Palsu, dll)
  shade           String?         // Warna gigi (misal: A2)
  size            String?         // Ukuran/Mold
  estimatedDate   DateTime?       // Estimasi barang selesai
  sentDate        DateTime?       // Tanggal dikirim ke lab
  receivedDate    DateTime?       // Tanggal diterima dari lab
  status          WorkOrderStatus @default(DRAFT)
  notes           String?
  createdBy       String?         // userId yang membuat
  updatedBy       String?         // userId yang terakhir update
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  treatmentPlan   TreatmentPlan   @relation(fields: [treatmentPlanId], references: [id])
  patient         Patient         @relation(fields: [patientId], references: [id])

  @@index([treatmentPlanId])
  @@index([status])
  @@map("dental_lab_work_orders")
}
```

#### B. Backend Controller Baru (`dentalLab.controller.ts`)
- `GET /dental-lab/work-orders` — List semua WO dengan filter status
- `POST /dental-lab/work-orders` — Buat WO baru **(validasi: invoice terkait harus PARTIAL/PAID)**
- `PATCH /dental-lab/work-orders/:id/status` — Update status (SENT, RECEIVED, FITTED)
- *Saat RECEIVED* → emit notifikasi via Socket.IO ke role `NURSE`/`ADMIN`

#### C. Frontend Pages Baru
- `/admin/lab/external` — Halaman monitoring WO eksternal (tabel status, filter)
- Komponen detail WO di dalam panel Treatment Plans (tombol "Buat SPK" dengan guard disabled)

---

## Rekomendasi Strategi: Lakukan dalam 2 Sprint

### Sprint 1 (Quick Wins — Modifikasi Sistem yang Ada)
**Target: Selesai dalam 2 hari**
1. Tambah validasi Minimal DP di `SiteSetting`
2. Auto-complete Treatment Plan saat invoice terakhir `paid`
3. Tambah flag `requiresExternalLab` di Master Service
4. Update schema & jalankan migration

### Sprint 2 (Fitur Baru — Dental Lab Work Order)
**Target: Selesai dalam 3–5 hari**
1. Tambah model `DentalLabWorkOrder` + migration
2. Buat `dentalLab.controller.ts` + routing
3. Update Treatment Plan page: tambah section "SPK Lab" dengan guard
4. Buat halaman `/admin/lab/external` (Monitoring)
5. Integrasikan notifikasi via `Notification` model yang sudah ada

---

## Keputusan Desain yang Perlu Anda Tentukan

> [!IMPORTANT]
> **Pertanyaan 1**: Apakah "Buat SPK" hanya bisa dilakukan oleh Dokter/Perawat dari halaman Treatment Plan, atau juga bisa dari Kasir?

> [!IMPORTANT]
> **Pertanyaan 2**: Apakah SPK Lab perlu dicetak sebagai PDF fisik (dengan kop klinik), atau cukup sebagai tampilan digital di layar?

> [!WARNING]
> **Pertanyaan 3**: Modul Lab yang sudah ada (`/admin/lab`) adalah untuk lab internal (darah, urin). Apakah halaman SPK Lab Eksternal ini harus digabung ke halaman lab yang sama, atau dipisah sebagai menu baru?

> [!NOTE]
> **Catatan**: PRD Anda menyebut "notifikasi ke Admin". Sistem sudah punya model `Notification` dan Socket.IO (`io.to('clinic:...')`). Notifikasi sudah bisa diimplementasi tanpa perubahan arsitektur besar.





1. Menu Rangkaian Perawatan (Treatment Plans)
📍 Lokasi Menu: /admin/transactions/treatment-plans 👤 Aktor Utama: Dokter Gigi

Ini adalah titik awal pembuatan Surat Perintah Kerja (SPK). Dokter menggunakan menu ini setelah memeriksa pasien.

Flow Proses (Dokter):

Buka menu Treatment Plans dan pilih pasien yang sedang dirawat.
Di panel sebelah kanan, scroll ke bawah hingga menemukan section baru: "SPK Lab Eksternal" (ikon tabung reaksi 💧).
Pengecekan DP Otomatis (Guard):
Jika pasien belum membayar Down Payment (DP) ke kasir, tombol Buat SPK akan terkunci dan memunculkan notifikasi "Butuh DP dulu".
Dokter mengarahkan pasien ke Kasir untuk membayar DP.
Pembuatan SPK:
Setelah Kasir memproses DP, sistem akan membuka kunci otomatis.
Dokter menekan tombol "+ Buat SPK".
Dokter mengisi formulir detail lab (Nama Lab, Jenis Pekerjaan/Crown, Warna/Shade Gigi, Nomor Gigi, dan Catatan Medis).
Klik Simpan. SPK akan dibuat dengan status awal DRAFT.
2. Menu Kasir (Finance)
📍 Lokasi Menu: /admin/finance (Menu yang sudah ada sebelumnya) 👤 Aktor Utama: Kasir / Front Desk

Menu ini digunakan untuk membuka kunci pembuatan SPK.

Flow Proses (Kasir):

Pasien datang ke meja Kasir.
Kasir membuka menu Finance / Pembayaran.
Kasir mencari tagihan (Invoice) atas nama pasien tersebut.
Kasir memproses Partial Payment (DP) sejumlah yang disepakati (misal bayar Rp 500.000 dari total Rp 2.000.000).
Status Invoice berubah menjadi PARTIAL.
(Efek otomatis): Kunci pembuatan SPK di layar Dokter akan terbuka seketika.
3. Menu Monitoring Lab Eksternal
📍 Lokasi Menu: /admin/lab/external 👤 Aktor Utama: Perawat / Admin Klinik / Resepsionis

Ini adalah pusat komando / Dashboard khusus untuk mengelola lalu lintas barang (gigi palsu, crown, dll) yang dikirim ke lab luar.

Flow Proses (Admin / Perawat):

Buka menu Lab Eksternal.
Kirim ke Lab Fisik:
Admin melihat ada SPK berstatus DRAFT dari Dokter.
Admin mencetak surat pengantar fisik dengan menekan Ikon Print (Printer) di panel kanan. Kertas ini disertakan ke kurir/lab.
Admin mengubah status SPK di sistem menjadi "Kirim ke Lab" (Di Lab).
Penerimaan Barang:
Beberapa hari kemudian, barang dari Lab Eksternal tiba di klinik.
Admin mencari SPK tersebut, lalu mengubah statusnya menjadi "Terima Barang" (Diterima).
(Efek otomatis): Sistem akan memunculkan instruksi bahwa admin harus segera menghubungi pasien untuk mengatur jadwal kedatangan (fitting).
Pemasangan (Fitting) & Pelunasan:
Pasien datang kembali ke klinik untuk pemasangan gigi.
Pasien melakukan pelunasan sisa biaya di Kasir.
Dokter memasang gigi ke pasien.
Setelah selesai, Admin/Dokter menekan tombol "Tandai Dipasang" (FITTED). Siklus Work Order selesai.