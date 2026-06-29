# Analisa & Masukan Aplikasi Klinik Yasfina

> Tanggal: 2026-06-27
> Sumber: Analisis struktur kode backend, frontend, dan database schema

---

## 📋 Ringkasan Aplikasi

Sistem Manajemen Klinik all-in-one yang komprehensif:

- 🏥 **Registrasi & Antrian Pasien** — Multi-department, queue number, appointment
- 👨‍⚕️ **Rekam Medis** — SOAP, ICD-10, odontogram, informed consent
- 💊 **Farmasi** — Resep, formula racikan, pembelian karyawan
- 📦 **Inventory** — Stok opname, mutasi, procurement, batch tracking, inter-branch transfer
- 💰 **Keuangan & Akuntansi** — COA, jurnal, cash transfer, opening balance, laba rugi
- 🔬 **Lab** — Internal (pemeriksaan) & Eksternal (rujukan)
- 🏢 **Asset Management** — Depresiasi, asuransi, maintenance, transfer
- 🤝 **Corporate Billing** — Billing perusahaan/asuransi
- 📊 **Dashboard & Laporan** — Real-time via Socket.IO

---

## 🔴 CRITICAL

### 1. God File: `backend/src/controllers/master.controller.ts` (104.8 KB)

**Masalah:** Satu file controller menangani SEMUA master data — Users, Patients, Doctors, Services, Medicines, Products, Assets, COA, dll.

**Risiko:**
- Sulit di-maintain, susah tracking bug
- Merge conflict tinggi kalau multi-dev
- Satu perubahan kecil bisa break fitur lain

**Saran — Pecah per entitas:**
```
controllers/master/
├── users.controller.ts
├── patients.controller.ts
├── doctors.controller.ts
├── services.controller.ts
├── medicines.controller.ts
├── products.controller.ts
├── assets.controller.ts
├── coa.controller.ts
├── departments.controller.ts
└── index.ts (re-export all)
```

---

### 2. Ukuran Controller Lain Juga Overlimit

| Controller | Baris | Ideal |
|---|---|---|
| `master.controller.ts` | ~104.8 KB | ~10 KB |
| `medicalRecord.controller.ts` | 50.8 KB | ~15 KB |
| `inventory.controller.ts` | 50.5 KB | ~15 KB |
| `finance.controller.ts` | 46.8 KB | ~15 KB |
| `assetManagement.controller.ts` | 36.3 KB | ~10 KB |
| `accounting.controller.ts` | 36.1 KB | ~10 KB |

**Saran — Terapkan Service Layer secara konsisten:**
```
controllers/
├── inventory.controller.ts   ← kecil, hanya routing
services/
├── inventory.service.ts      ← business logic di sini
```
Saat ini hanya ada 4 service files (`auth`, `inventory`, `inventoryLedger`, `siteSetting`). Sebagian besar business logic masih campur aduk di controller.

---

### 3. Frontend Pages Terlalu Besar

| Halaman | Baris |
|---|---|
| `transactions/treatment-plans/page.tsx` | **1,919** |
| `finance/page.tsx` | 1,482 |
| `inventory/stock-opname/page.tsx` | 1,471 |
| `lab/input/page.tsx` | 1,247 |
| `transactions/doctor/[id]/page.tsx` | 1,066 |
| `transactions/registration/page.tsx` | 1,059 |
| `farmasi/formula-racikan/page.tsx` | 1,013 |

**Saran — Pecah jadi komponen modular:**
```
treatment-plans/
├── components/
│   ├── TreatmentPlanList.tsx
│   ├── TreatmentPlanForm.tsx
│   ├── TreatmentPlanDetail.tsx
│   ├── VisitTimeline.tsx
│   └── VisitCard.tsx
├── hooks/
│   └── useTreatmentPlan.ts
└── page.tsx  ← ~150 baris, hanya wire components
```

---

### 4. Security Issue: CORS Socket.IO `origin: "*"`

**Lokasi:** `backend/src/index.ts` line 45-46

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: "*",   // ⚠️ HARUS diperbaiki!
  }
});
```

**Risiko:** Socket.IO bisa diakses dari origin manapun. Express CORS sudah benar (whitelist), tapi Socket.IO tidak.

**Perbaikan:**
```typescript
const FRONTEND_URLS = [
  process.env.FRONTEND_URL || 'http://localhost:3004',
  'https://yasfina-app.com',
  'http://localhost:3000',
  'http://127.0.0.1:3004'
];

const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URLS, methods: ["GET", "POST"] }
});
```

---

## 🟡 HIGH

### 5. Rate Limiting Belum Terpasang

`rateLimiter.ts` sudah ada di middleware tapi tidak dipanggil di `index.ts`. Backend rentan brute force attack.

### 6. Tidak Ada Validasi Request (Zod) di Route Level

Zod sudah ter-install (`"zod": "^4.4.3"`) baik di backend maupun frontend, tapi dari struktur kode, validasi tidak konsisten diterapkan.

### 7. Mismatch Port Development

- **Frontend `.env`:** `NEXT_PUBLIC_API_URL=http://localhost:5004`
- **Backend default:** `PORT=5000`
- **Frontend `.env.example`:** `NEXT_PUBLIC_API_URL=http://localhost:5004`

Konsistensikan port development untuk menghindari confusion.

### 8. Tidak Ada Unit Test / E2E Test

Tidak ditemukan folder `__tests__`, `*.spec.ts`, atau `*.test.ts` baik di backend maupun frontend. Tidak ada config Jest/Vitest.

### 9. Tidak Ada Error Boundary di Frontend

Tidak ditemukan komponen Error Boundary di struktur `components/`. Error di page bisa menyebabkan white screen tanpa recovery.

---

## 🟡 MEDIUM

### 10. DB Schema: Status String vs Enum Tidak Konsisten

Banyak model pakai `String` untuk status yang seharusnya `Enum`:

```prisma
status String @default("DRAFT")      // Procurement — rawan typo
status String @default("unpaid")     // Invoice
status String @default("waiting")    // QueueNumber
```

Sementara sebagian model sudah pakai Enum:
- ✅ `Role` — SUPER_ADMIN, ADMIN, DOCTOR, dll
- ✅ `VisitStatus` — BELUM, BERJALAN, SELESAI
- ✅ `TreatmentPlanStatus` — ACTIVE, COMPLETED
- ✅ ✅ `WorkOrderStatus` — DRAFT, PENDING_DP, dll

**Saran:** Konsistenkan semua field status ke Enum untuk type safety.

### 11. `Patient.age` Disimpan Manual

```prisma
age Float?
```

Usia pasien seharusnya **dihitung** dari `dateOfBirth` setiap kali di-query, bukan disimpan. Data usia akan stale/wrong seiring waktu.

### 12. Soft Deleted Belum Konsisten

| Model | Punya `deletedAt` | Konsisten |
|---|---|---|
| `User` | ✅ | ✗ (tidak cascade ke relasi) |
| `Patient` | ✅ | ✗ |
| `Clinic` | ✅ | ✗ |
| `Product` | ✅ | ✗ |
| `CompoundFormula` | ✅ | ✗ |
| `Invoice` | ✗ | - |
| `Procurement` | ✗ | - |

Saran: Implementasi soft delete pattern yang konsisten atau hapus dari yang tidak terpakai.

### 13. Upload Limit: `express.json({ limit: '50mb' })`

Limit sangat besar (50MB). Kecuali memang ada upload file besar via JSON (base64), ini bisa jadi DoS vector. Kurangi ke ukuran yang lebih realistis atau gunakan upload via multer (sudah ada middleware `upload.middleware.ts`).

---

## 🟢 SUDAH BAGUS

### Arsitektur:
- ✅ Multi-clinic/branch architecture dengan pemisahan data via `clinicId`
- ✅ Prisma ORM — schema rapi, relasi well-defined, index di field query
- ✅ 24 route files — modular routing sudah baik
- ✅ Socket.IO untuk real-time notification/queue

### Auth:
- ✅ Cookie-based JWT auth (HttpOnly cookie) + Bearer fallback
- ✅ Role-based permission per module via `RolePermission` table
- ✅ Middleware `auth.middleware.ts` solid — ada token expiry handling

### Database:
- ✅ Soft delete & audit trail di beberapa model kritis
- ✅ UUID untuk primary key (scalable)
- ✅ Relasi @onDelete: Cascade untuk menjaga integritas
- ✅ Unique constraints di business key (productCode + clinicId, dll)

### Inventory:
- ✅ Batch tracking + expiry date management
- ✅ Stock opname system dengan diff tracking
- ✅ Multi-unit conversion (purchase → storage → used)
- ✅ Inter-branch transfer

### Finance:
- ✅ Double-entry accounting (COA, jurnal, debit/credit)
- ✅ Chart of Accounts dengan hierarki (parent → children)
- ✅ Integration COA ke service, expense, dll

### Feature Innovation:
- ✅ **Compound Formula** (Formula Racikan) — standarisasi resep
- ✅ **Treatment Plan multi-Visit** — rangkaian perawatan bertahap
- ✅ **Guest Doctor System** — dokter tamu tanpa akun penuh
- ✅ **Dental Lab Work Order** — SPK laboratorium gigi eksternal

---

## 🎯 Rekomendasi Prioritas

| Prioritas | Aksi | Dampak | Estimasi |
|---|---|---|---|
| **🔥 P1** | Fix CORS Socket.IO `origin: "*"` | Security | 5 menit |
| **🔥 P1** | Pasang rate limiter global | Security | 10 menit |
| **🔥 P1** | Pecah `master.controller.ts` | Maintainability | 2-3 jam |
| **🔸 P2** | Pecah halaman frontend > 1000 baris | Maintainability | 4-5 jam |
| **🔸 P2** | Konsistenkan service layer | Code quality | 3-4 jam |
| **🔸 P2** | Zod validation di route level | Bug prevention | 2-3 jam |
| **🔸 P2** | Frontend error boundary | UX stability | 1 jam |
| **🔹 P3** | Enum konsisten untuk status | Type safety | 1-2 jam |
| **🔹 P3** | Ganti `Patient.age` jadi computed | Data integrity | 30 menit |
| **🔹 P3** | Setup unit test framework | Reliability | 4-5 jam |
| **🔹 P3** | Konsistenkan port development | DX | 10 menit |

---

*Analysis generated from codebase structure, package dependencies, Prisma schema, and backend entry point.*