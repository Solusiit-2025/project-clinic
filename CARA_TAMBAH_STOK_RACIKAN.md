# 📦 Cara Menambahkan Stok Produk Racikan

## 🎯 Tujuan
Agar produk racikan bisa dipilih dokter di halaman resep (`/doctor/queue/[id]`), produk harus:
1. ✅ Sudah dibuat dari Formula BOM
2. ✅ Punya stok di Inventory

## 📋 Langkah-Langkah Lengkap

### Step 1: Buat Formula BOM Racikan
**URL:** `http://localhost:3004/admin/farmasi/formula-racikan`

1. Klik tombol **"Buat Formula Baru"**
2. Isi data formula:
   - **Nama Formula**: Contoh "Kapsul Flu Racik A"
   - **Kategori**: Pilih kategori (Flu & Pilek, Batuk, dll)
   - **Bentuk**: Pilih bentuk (Kapsul, Puyer, Tablet, dll)
   - **Qty Default**: Jumlah default per resep (misal: 10)
   - **Tuslah**: Biaya jasa racik (misal: Rp 5.000)
3. Tambahkan **Komponen Bahan Baku**:
   - Klik "Tambah Bahan"
   - Pilih obat dari dropdown
   - Isi quantity (misal: 1 tablet, 0.5 tablet)
   - Isi unit (tablet, kapsul, ml, gram)
4. Klik **"Simpan"**

**Hasil:** Formula BOM tersimpan di database

---

### Step 2: Buat Produk dari Formula
**URL:** `http://localhost:3004/admin/farmasi/formula-racikan`

**Opsi A: Per Formula**
1. Di tabel formula, cari formula yang baru dibuat
2. Klik tombol **📦 (Buat Produk)** berwarna hijau
3. Konfirmasi dialog
4. Alert sukses akan muncul dengan info:
   - Kode Master: `RACIK-XXXX`
   - Kode Produk: `RACIK-XXXX-YYYY`
   - Konfirmasi produk tersedia

**Opsi B: Bulk (Semua Formula)**
1. Klik tombol **"Buat Semua Produk"** di atas tabel
2. Konfirmasi dialog
3. Alert menampilkan berapa produk berhasil dibuat

**Hasil:** 
- ✅ ProductMaster dibuat (kode: `RACIK-XXXX`)
- ✅ Product instance dibuat untuk klinik (kode: `RACIK-XXXX-YYYY`)
- ✅ Produk muncul di Inventory dengan **stok 0**

---

### Step 3: Tambah Stok di Inventory
**URL:** `http://localhost:3004/admin/inventory`

#### Cara 1: Manual Update Stok
1. Buka halaman Inventory
2. Cari produk racikan dengan kode `RACIK-` atau nama formula
3. Klik tombol **"Edit"** atau **"Update Stok"**
4. Isi jumlah stok yang ingin ditambahkan
5. Simpan

#### Cara 2: Via Procurement (Pembelian)
1. Buka **Procurement** (`/admin/procurement`)
2. Buat Purchase Order baru
3. Tambahkan produk racikan ke PO
4. Isi quantity yang dibeli
5. Approve PO
6. Stok otomatis bertambah

#### Cara 3: Via Stock Opname
1. Buka **Stock Opname** (`/admin/inventory/stock-opname`)
2. Buat sesi stock opname baru
3. Scan/input produk racikan
4. Isi quantity fisik
5. Finalize → Stok terupdate

**Hasil:** 
- ✅ Produk racikan punya stok > 0
- ✅ Siap dipilih dokter!

---

### Step 4: Pilih di Resep Dokter
**URL:** `http://localhost:3004/doctor/queue/[id]`

1. Dokter buka halaman konsultasi pasien
2. Di bagian **"Resep Obat"**:
   - Ketik nama formula racikan di search box
   - Produk racikan akan muncul di dropdown
   - Klik untuk memilih
3. Isi detail resep:
   - Quantity
   - Dosage
   - Frequency
   - Duration
   - Instructions
4. Klik **"Simpan Konsultasi"**

**Hasil:** 
- ✅ Resep racikan tersimpan
- ✅ Stok bahan baku otomatis terpotong saat dispensing

---

## 🔍 Troubleshooting

### ❌ Produk tidak muncul di Inventory
**Penyebab:** Product instance belum dibuat untuk klinik

**Solusi:**
1. Pastikan saat "Buat Produk" menggunakan klinik yang aktif
2. Cek di database tabel `products` → harus ada row dengan `clinicId` yang sesuai
3. Jika tidak ada, hapus ProductMaster dan buat ulang

### ❌ Produk tidak muncul di dropdown dokter
**Penyebab:** Salah satu dari:
- Produk belum dibuat dari formula
- Stok masih 0 (tergantung setting)
- ProductMaster tidak aktif

**Solusi:**
1. Cek Inventory → produk harus ada
2. Cek stok → harus > 0 (atau sesuai setting)
3. Cek ProductMaster → `isActive` harus `true`
4. Refresh halaman dokter (Ctrl+F5)

### ❌ Stok tidak terpotong saat dispensing
**Penyebab:** Komponen bahan baku tidak terhubung dengan benar

**Solusi:**
1. Cek formula BOM → pastikan semua komponen valid
2. Cek stok bahan baku → harus cukup
3. Cek log backend untuk error

---

## 📊 Diagram Alur Lengkap

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BUAT FORMULA BOM                                         │
│    /admin/farmasi/formula-racikan                           │
│    → Isi nama, kategori, komponen                           │
│    → Simpan                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BUAT PRODUK                                              │
│    Klik "Buat Produk" atau "Buat Semua Produk"             │
│    → ProductMaster dibuat (RACIK-XXXX)                      │
│    → Product instance dibuat (RACIK-XXXX-YYYY)              │
│    → Produk muncul di Inventory (stok: 0)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TAMBAH STOK                                              │
│    /admin/inventory                                         │
│    → Cari produk RACIK-XXXX                                 │
│    → Update stok (misal: 100 unit)                          │
│    → Simpan                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PILIH DI RESEP DOKTER ✅                                 │
│    /doctor/queue/[id]                                       │
│    → Ketik nama racikan di search                           │
│    → Produk muncul di dropdown                              │
│    → Pilih dan isi detail resep                             │
│    → Simpan konsultasi                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

Sebelum produk racikan bisa dipilih dokter, pastikan:

- [ ] Formula BOM sudah dibuat
- [ ] Produk sudah dibuat dari formula (klik "Buat Produk")
- [ ] Produk muncul di Inventory
- [ ] Stok produk > 0 (atau sesuai setting)
- [ ] ProductMaster `isActive = true`
- [ ] Product `isActive = true`
- [ ] Klinik sesuai dengan klinik aktif dokter

---

## 🎯 Quick Test

**Test apakah produk racikan sudah siap:**

```bash
1. Buka /admin/inventory
2. Cari "RACIK-" di search box
3. Jika muncul → ✅ Produk sudah dibuat
4. Cek kolom stok → harus > 0
5. Buka /doctor/queue/[id]
6. Ketik nama racikan di search obat
7. Jika muncul di dropdown → ✅ BERHASIL!
```

---

## 💡 Tips

### Tip 1: Bulk Create untuk Efisiensi
Jika punya banyak formula, gunakan **"Buat Semua Produk"** sekali saja. Semua produk langsung dibuat dan muncul di Inventory.

### Tip 2: Set Stok Awal via Procurement
Lebih profesional menggunakan Procurement untuk mencatat pembelian awal, daripada manual update stok.

### Tip 3: Monitor Stok Bahan Baku
Pastikan stok bahan baku (komponen) cukup sebelum dokter meresepkan racikan. Sistem akan otomatis potong stok bahan baku saat dispensing.

### Tip 4: Gunakan Kategori
Beri kategori yang jelas pada formula (Flu, Batuk, Alergi, dll) agar mudah dicari dokter.

---

## 🚀 Automation (Optional)

Jika ingin otomatis create produk saat formula dibuat, bisa tambahkan hook di backend:

```typescript
// Di createCompoundFormula controller
// Setelah formula dibuat, langsung create product
const productMaster = await createProductFromFormula(formula.id, clinicId)
```

Tapi untuk kontrol lebih baik, disarankan tetap manual via tombol "Buat Produk".

---

## 📞 Support

Jika masih ada masalah:
1. Cek log backend untuk error
2. Cek database tabel `product_masters` dan `products`
3. Pastikan semua migration sudah dijalankan
4. Restart backend dan frontend

**Happy Prescribing! 💊**
