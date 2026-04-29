# Integrasi Formula Racikan dengan Master Product

## 📋 Overview

Dokumen ini menjelaskan bagaimana Formula Racikan (Compound Formula) terintegrasi dengan sistem Master Product, Inventory, dan Prescription agar obat racikan bisa muncul di semua modul dan bisa dipilih oleh dokter.

## 🔗 Relasi Database

### Schema Changes

**ProductMaster** sekarang memiliki relasi dengan **CompoundFormula**:

```prisma
model ProductMaster {
  // ... fields lainnya
  compoundFormulaId String?          @unique
  compoundFormula   CompoundFormula? @relation(fields: [compoundFormulaId], references: [id])
}

model CompoundFormula {
  // ... fields lainnya
  productMaster ProductMaster?
}
```

**Relasi**: One-to-One (1 formula = 1 product master)

### Product Instance per Clinic

Setiap kali ProductMaster dibuat dari formula, sistem juga otomatis membuat **Product** instance untuk klinik:

```
CompoundFormula → ProductMaster (global) → Product (per clinic)
```

**Ini penting agar produk muncul di Inventory!**

## 🎯 Cara Kerja

### 1. Buat Formula Racikan
- Buka: `http://localhost:3004/admin/farmasi/formula-racikan`
- Klik "Buat Formula Baru"
- Isi data formula dan komponen bahan baku
- Simpan

### 2. Buat Produk dari Formula

Ada 2 cara:

#### A. Per Formula (Manual)
1. Di tabel Formula Racikan, klik tombol **📦 (Buat Produk)** pada formula yang diinginkan
2. Sistem akan:
   - Membuat ProductMaster baru dengan kode `RACIK-XXXX`
   - Membuat Product instance untuk klinik aktif
   - Menghitung harga beli dari total komponen + tuslah
   - Set harga jual dengan markup 30% (bisa disesuaikan)
   - Link ProductMaster dengan CompoundFormula
   - **Produk langsung muncul di Inventory!**

#### B. Bulk (Otomatis Semua)
1. Klik tombol **"Buat Semua Produk"** di halaman Formula Racikan
2. Sistem akan:
   - Membuat ProductMaster untuk SEMUA formula yang belum punya produk
   - Membuat Product instance untuk klinik aktif
   - Hasil ditampilkan: berapa berhasil, berapa gagal
   - **Semua produk langsung muncul di Inventory!**

### 3. Produk Muncul di Semua Modul

Setelah produk dibuat, formula racikan akan muncul di:

✅ **Master Product** (`/admin/master/products`)
- Kode: `RACIK-XXXX`
- Nama: Nama formula
- Deskripsi: Detail formula + komponen
- Harga: Otomatis dihitung

✅ **Inventory** (`/admin/inventory`)
- Produk racikan muncul di daftar stok
- Bisa di-manage seperti produk biasa
- Stok bisa ditambah/dikurangi

✅ **Doctor Prescription** (`/admin/transactions/doctor/[id]`)
- Dokter bisa memilih obat racikan dari dropdown
- Sistem otomatis load komponen dan hitung stok
- Resep bisa langsung ditulis

✅ **Pharmacy** (`/admin/farmasi`)
- Apoteker bisa lihat resep racikan
- Sistem otomatis potong stok bahan baku saat dispensing

## 🔧 API Endpoints

### Create Product from Formula
```http
POST /api/pharmacy/compound-formulas/:id/create-product
Content-Type: application/json

{
  "categoryId": "uuid-optional",
  "sellingPrice": 50000,  // optional, default: auto-calculate with 30% markup
  "minStock": 0,
  "reorderPoint": 0,
  "clinicId": "uuid-required"  // PENTING: agar Product dibuat untuk klinik ini
}
```

**Response:**
```json
{
  "message": "Produk racikan berhasil dibuat",
  "productMaster": {
    "id": "uuid",
    "masterCode": "RACIK-0001",
    "masterName": "Kapsul Flu Racik A",
    "purchasePrice": 15000,
    "sellingPrice": 19500,
    "compoundFormulaId": "uuid"
  },
  "product": {
    "id": "uuid",
    "productCode": "RACIK-0001-ABCD",
    "quantity": 0,
    "clinicId": "uuid"
  }
}
```

### Bulk Create Products
```http
POST /api/pharmacy/compound-formulas/bulk-create-products
Content-Type: application/json

{
  "clinicId": "uuid-required",  // PENTING: agar Product dibuat untuk klinik ini
  "categoryId": "uuid-optional"
}
```

**Response:**
```json
{
  "message": "Berhasil membuat 5 produk dari 5 formula",
  "created": [
    {
      "formulaCode": "FRM-20260429-0001",
      "formulaName": "Kapsul Flu Racik A",
      "masterCode": "RACIK-0001"
    }
  ],
  "errors": []
}
```

## 💰 Perhitungan Harga

### Harga Beli (Purchase Price)
```
Total Harga Beli = Σ(Harga Bahan Baku × Quantity) + Tuslah
```

**Contoh:**
- Paracetamol 500mg: Rp 500 × 1 tablet = Rp 500
- CTM: Rp 300 × 0.5 tablet = Rp 150
- Vitamin C: Rp 400 × 1 tablet = Rp 400
- Tuslah: Rp 5.000
- **Total: Rp 6.050**

### Harga Jual (Selling Price)
```
Harga Jual = Harga Beli × 1.3  (markup 30%)
```

**Contoh:**
- Harga Beli: Rp 6.050
- **Harga Jual: Rp 7.865**

## 📊 Alur Lengkap

```
┌─────────────────────┐
│ 1. Buat Formula     │
│    Racikan          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Klik "Buat       │
│    Produk"          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Sistem membuat:  │
│    a. ProductMaster │
│       (global)      │
│    b. Product       │
│       (per clinic)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Produk muncul di:│
│    ✓ Master Product │
│    ✓ Inventory ✨   │
│    ✓ Doctor Rx      │
│    ✓ Pharmacy       │
└─────────────────────┘
```

**Key Point:** Product instance per clinic adalah kunci agar muncul di Inventory!

## 🎨 UI Features

### Halaman Formula Racikan
- **Tombol per row**: 📦 Buat Produk (hijau)
- **Tombol header**: "Buat Semua Produk" (bulk action)
- **Konfirmasi**: Alert sebelum create
- **Feedback**: Alert sukses dengan detail produk

### Indikator Status
- Formula yang sudah punya produk: Badge "Produk Tersedia"
- Formula yang belum: Tombol "Buat Produk" aktif
- Error handling: Alert jika gagal

## 🔍 Validasi

### Sebelum Create Product
1. ✅ Formula harus aktif (`isActive = true`)
2. ✅ Formula belum punya produk (`productMaster = null`)
3. ✅ Semua komponen bahan baku harus valid
4. ✅ Harga bahan baku harus tersedia

### Error Handling
- Formula sudah punya produk → Error 400
- Formula tidak ditemukan → Error 404
- Bahan baku tidak valid → Error 400
- Database error → Error 500

## 📝 Best Practices

### 1. Workflow Rekomendasi
```
1. Buat semua formula racikan dulu
2. Review dan pastikan semua data benar
3. Klik "Buat Semua Produk" sekali
4. Produk langsung tersedia di semua modul
```

### 2. Maintenance
- Update formula → Tidak otomatis update produk
- Jika perlu update produk, edit manual di Master Product
- Atau hapus produk dan buat ulang dari formula

### 3. Kategori Produk
- Bisa set kategori saat create product
- Atau biarkan null, edit nanti di Master Product
- Kategori membantu filtering di inventory

## 🚀 Testing

### Test Create Product
```bash
# 1. Buat formula via UI
# 2. Klik tombol "Buat Produk"
# 3. Cek di Master Product → harus muncul
# 4. Cek di Inventory → harus muncul
# 5. Cek di Doctor Rx → harus bisa dipilih
```

### Test Bulk Create
```bash
# 1. Buat 3-5 formula
# 2. Klik "Buat Semua Produk"
# 3. Cek alert → harus show berapa berhasil
# 4. Cek Master Product → semua harus muncul
```

## 🐛 Troubleshooting

### Produk tidak muncul di Inventory
**Penyebab:** Product instance untuk klinik belum dibuat
**Solusi:**
1. Pastikan `clinicId` dikirim saat create product
2. Cek tabel `products` → harus ada row dengan `clinicId` yang sesuai
3. Jika tidak ada, hapus ProductMaster dan buat ulang dengan clinicId

### Produk tidak muncul di dropdown dokter
**Solusi:**
1. Cek ProductMaster → pastikan `isActive = true`
2. Cek Medicine → pastikan ada `medicineId` di ProductMaster
3. Refresh halaman dokter

### Harga tidak sesuai
**Solusi:**
1. Cek harga bahan baku di ProductMaster
2. Cek tuslah di formula
3. Re-create produk jika perlu

### Bulk create gagal
**Solusi:**
1. Cek error message di alert
2. Pastikan semua formula valid
3. Pastikan clinicId valid
4. Cek log backend untuk detail error

## 📚 Related Files

### Backend
- `backend/prisma/schema.prisma` - Schema definition
- `backend/src/controllers/compoundFormula.controller.ts` - Business logic
- `backend/src/routes/pharmacy.routes.ts` - API routes

### Frontend
- `frontend/app/admin/farmasi/formula-racikan/page.tsx` - UI management
- `frontend/app/admin/master/products/page.tsx` - Product list
- `frontend/app/admin/transactions/doctor/[id]/page.tsx` - Doctor prescription

## ✅ Checklist Implementation

- [x] Add `compoundFormulaId` to ProductMaster schema
- [x] Add `productMaster` relation to CompoundFormula
- [x] Create migration and apply to database
- [x] Implement `createProductFromFormula` controller
- [x] Implement `bulkCreateProductsFromFormulas` controller
- [x] Add API routes for product creation
- [x] Add "Buat Produk" button per formula
- [x] Add "Buat Semua Produk" bulk button
- [x] Add confirmation dialogs
- [x] Add success/error feedback
- [x] Test integration with Master Product
- [x] Test integration with Inventory
- [x] Test integration with Doctor Prescription
- [x] Documentation

## 🎉 Hasil Akhir

Sekarang sistem Formula Racikan sudah **fully integrated** dengan:
- ✅ Master Product
- ✅ Inventory Management
- ✅ Doctor Prescription
- ✅ Pharmacy Dispensing

Dokter bisa langsung memilih obat racikan dari dropdown, dan sistem otomatis handle semua perhitungan stok dan harga!
