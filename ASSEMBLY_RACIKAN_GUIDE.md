# 🔧 Panduan Assembly/Produksi Racikan

## 📋 Overview

Fitur **Assembly Racikan** memungkinkan farmasi untuk merakit/memproduksi obat racikan dari bahan baku yang tersedia. Sistem akan:
- ✅ Otomatis memotong stok bahan baku
- ✅ Menambah stok produk racikan
- ✅ Mencatat inventory mutation (IN/OUT)
- ✅ Memberikan laporan keuangan yang akurat

## 🎯 Kapan Menggunakan Assembly?

### Skenario 1: Stok Racikan Habis
```
Situasi: Stok "Kapsul Flu Racik A" = 0
Solusi: Rakit 10 kapsul dari bahan baku
Hasil: Stok menjadi 10 kapsul
```

### Skenario 2: Produksi Batch
```
Situasi: Persiapan stok untuk minggu depan
Solusi: Rakit 50 puyer sekaligus
Hasil: Stok siap untuk dispensing
```

### Skenario 3: Custom Request
```
Situasi: Dokter minta racikan khusus
Solusi: Rakit sesuai kebutuhan
Hasil: Produk siap diresepkan
```

## 🚀 Cara Menggunakan

### Step 1: Buka Halaman Formula Racikan
```
URL: http://localhost:3004/admin/farmasi/formula-racikan
```

### Step 2: Klik Tombol "Rakit" (🔧)
- Cari formula yang ingin dirakit
- Klik tombol **🔧 (Rakit Produk)** berwarna ungu
- Modal assembly akan terbuka

### Step 3: Tentukan Jumlah
```
Input: Masukkan jumlah yang ingin dirakit
Contoh: 10 puyer, 20 kapsul, 5 botol sirup
```

### Step 4: Cek Ketersediaan Bahan Baku
- Klik tombol **"Cek Ketersediaan Bahan Baku"**
- Sistem akan validasi stok semua komponen
- Hasil ditampilkan:
  - ✅ **Hijau**: Bahan baku mencukupi
  - ❌ **Merah**: Bahan baku tidak cukup

### Step 5: Review Detail Bahan
Modal akan menampilkan:
```
✅ Paracetamol 500mg
   Dibutuhkan: 10 tablet
   Stok Tersedia: 50 tablet
   Status: Cukup

❌ CTM 4mg
   Dibutuhkan: 5 tablet
   Stok Tersedia: 2 tablet
   Status: Kurang 3 tablet
```

### Step 6: Rakit Produk
- Jika semua bahan cukup, klik **"Rakit Sekarang"**
- Konfirmasi dialog
- Sistem akan:
  1. Potong stok bahan baku
  2. Tambah stok produk racikan
  3. Catat mutation
  4. Tampilkan hasil

## 📊 Proses di Backend

### 1. Validasi Stok
```typescript
Formula: Kapsul Flu Racik A (10 unit)
Komponen:
- Paracetamol: 1 tablet × 10 = 10 tablet (Stok: 50) ✅
- CTM: 0.5 tablet × 10 = 5 tablet (Stok: 20) ✅
- Vitamin C: 1 tablet × 10 = 10 tablet (Stok: 30) ✅

Status: BISA DIRAKIT ✅
```

### 2. Eksekusi Assembly (Transaction)
```sql
BEGIN TRANSACTION;

-- Kurangi stok bahan baku
UPDATE products SET quantity = quantity - 10 WHERE id = 'paracetamol-id';
UPDATE products SET quantity = quantity - 5 WHERE id = 'ctm-id';
UPDATE products SET quantity = quantity - 10 WHERE id = 'vitc-id';

-- Catat mutation OUT (bahan baku keluar)
INSERT INTO inventory_mutations (type, quantity, notes) 
VALUES ('OUT', 10, 'Digunakan untuk merakit Kapsul Flu Racik A');

-- Tambah stok produk racikan
UPDATE products SET quantity = quantity + 10 WHERE id = 'racikan-id';

-- Catat mutation IN (produk racikan masuk)
INSERT INTO inventory_mutations (type, quantity, notes) 
VALUES ('IN', 10, 'Hasil rakitan dari formula FRM-001');

COMMIT;
```

### 3. Hasil
```
✅ Berhasil merakit 10 unit Kapsul Flu Racik A

Stok Baru: 10 unit
Stok Sebelumnya: 0 unit

Bahan Baku Terpotong:
- Paracetamol: 10 tablet
- CTM: 5 tablet
- Vitamin C: 10 tablet

Mutation ID: 
- OUT: mut-001, mut-002, mut-003
- IN: mut-004
```

## 💰 Laporan Keuangan

### Inventory Mutation Log
Setiap assembly tercatat di `inventory_mutations`:

```
| ID      | Type | Product         | Qty | Notes                    | Date       |
|---------|------|-----------------|-----|--------------------------|------------|
| mut-001 | OUT  | Paracetamol     | 10  | Untuk rakit Kapsul Flu   | 2026-04-29 |
| mut-002 | OUT  | CTM             | 5   | Untuk rakit Kapsul Flu   | 2026-04-29 |
| mut-003 | OUT  | Vitamin C       | 10  | Untuk rakit Kapsul Flu   | 2026-04-29 |
| mut-004 | IN   | Kapsul Flu      | 10  | Hasil rakitan FRM-001    | 2026-04-29 |
```

### Cost Tracking
```
Harga Bahan Baku:
- Paracetamol: Rp 500 × 10 = Rp 5.000
- CTM: Rp 300 × 5 = Rp 1.500
- Vitamin C: Rp 400 × 10 = Rp 4.000
- Tuslah: Rp 5.000
Total Cost: Rp 15.500

Harga Jual Produk: Rp 20.000
Profit Margin: Rp 4.500 (29%)
```

### Financial Report
Data mutation bisa digunakan untuk:
- **COGS (Cost of Goods Sold)**: Tracking biaya produksi
- **Inventory Valuation**: Nilai stok saat ini
- **Production Report**: Laporan produksi harian/bulanan
- **Profit Analysis**: Analisis keuntungan per produk

## 🔍 Validasi & Error Handling

### Error 1: Stok Tidak Cukup
```
❌ Stok bahan baku tidak mencukupi

Bahan yang kurang:
- CTM 4mg: Butuh 10, Tersedia 5, Kurang 5
- Vitamin C: Butuh 20, Tersedia 15, Kurang 5

Solusi:
1. Kurangi jumlah yang dirakit
2. Tambah stok bahan baku dulu
3. Ganti formula dengan bahan yang tersedia
```

### Error 2: Produk Belum Dibuat
```
❌ Produk untuk formula ini belum dibuat

Solusi:
1. Klik tombol "Buat Produk" (📦) dulu
2. Setelah produk dibuat, baru bisa rakit
```

### Error 3: Produk Tidak Ada di Klinik
```
❌ Produk untuk klinik ini belum dibuat

Solusi:
1. Pastikan clinicId benar
2. Buat produk dengan clinicId yang sesuai
```

## 📈 Best Practices

### 1. Batch Production
```
✅ BAIK: Rakit 50 unit sekaligus (efisien)
❌ BURUK: Rakit 1 unit berkali-kali (tidak efisien)
```

### 2. Stock Planning
```
Hitung kebutuhan mingguan:
- Rata-rata resep per hari: 5 unit
- Kebutuhan per minggu: 5 × 7 = 35 unit
- Rakit: 40-50 unit (buffer 20%)
```

### 3. Quality Control
```
Setelah assembly:
1. Cek fisik produk
2. Label dengan tanggal produksi
3. Catat expired date (ikuti bahan paling cepat expired)
4. Simpan di tempat yang sesuai
```

### 4. Documentation
```
Setiap assembly, catat:
- Tanggal & waktu produksi
- Nama petugas
- Batch number bahan baku
- Kondisi produk
- Catatan khusus
```

## 🎨 UI Features

### Button Actions (Lebih Besar & Tooltip)
```
🔍 Lihat Detail - Tooltip: "Lihat Detail"
🔧 Rakit Produk - Tooltip: "Rakit Produk dari Bahan Baku"
📦 Buat Produk - Tooltip: "Buat ProductMaster & Stok"
✏️ Edit - Tooltip: "Edit Formula"
🗑️ Hapus - Tooltip: "Hapus Formula"
```

### Modal Assembly
- **Input Quantity**: Jumlah yang ingin dirakit
- **Check Button**: Validasi stok bahan baku
- **Status Banner**: Hijau (cukup) / Merah (kurang)
- **Component List**: Detail setiap bahan dengan status
- **Stock Info**: Stok sebelum & sesudah assembly
- **Action Buttons**: Batal / Rakit Sekarang

### Visual Feedback
- ✅ **Hijau**: Bahan cukup, bisa rakit
- ❌ **Merah**: Bahan kurang, tidak bisa rakit
- 🔄 **Loading**: Sedang proses
- ✨ **Success**: Assembly berhasil

## 🔗 Integration

### Dengan Inventory
```
Assembly → Update Product.quantity
         → Create InventoryMutation (IN/OUT)
         → Update InventoryStock
```

### Dengan Financial
```
InventoryMutation → JournalEntry
                  → COGS Calculation
                  → Profit Analysis
```

### Dengan Pharmacy
```
Assembly → Stok Bertambah
        → Bisa Dispensing
        → Resep Terpenuhi
```

## 📝 API Endpoints

### Check Assembly Feasibility
```http
POST /api/pharmacy/compound-formulas/:id/check-assembly
Content-Type: application/json

{
  "quantity": 10,
  "clinicId": "uuid"
}

Response:
{
  "canAssemble": true,
  "componentStatus": [
    {
      "medicineName": "Paracetamol",
      "requiredQty": 10,
      "availableStock": 50,
      "isSufficient": true
    }
  ]
}
```

### Execute Assembly
```http
POST /api/pharmacy/compound-formulas/:id/assemble
Content-Type: application/json

{
  "quantity": 10,
  "clinicId": "uuid",
  "notes": "Produksi batch pagi"
}

Response:
{
  "message": "Berhasil merakit 10 unit Kapsul Flu Racik A",
  "production": {
    "quantity": 10,
    "newStock": 10,
    "previousStock": 0
  },
  "componentsUsed": [...],
  "mutations": [...]
}
```

## 🎯 Testing Checklist

- [ ] Buka halaman formula racikan
- [ ] Klik tombol "Rakit" (🔧)
- [ ] Input quantity
- [ ] Klik "Cek Ketersediaan"
- [ ] Verifikasi status bahan baku
- [ ] Klik "Rakit Sekarang"
- [ ] Cek alert sukses
- [ ] Verifikasi stok produk bertambah
- [ ] Verifikasi stok bahan baku berkurang
- [ ] Cek inventory mutation log
- [ ] Verifikasi laporan keuangan

## 🐛 Troubleshooting

### Assembly Gagal
**Cek:**
1. Stok bahan baku cukup?
2. Produk sudah dibuat?
3. ClinicId benar?
4. User punya permission?

### Stok Tidak Terpotong
**Cek:**
1. Transaction berhasil?
2. Log mutation ada?
3. Product ID benar?
4. Database constraint?

### Laporan Tidak Akurat
**Cek:**
1. Mutation tercatat semua?
2. Harga bahan baku benar?
3. Calculation logic benar?
4. Report query benar?

## 🎉 Hasil Akhir

Dengan fitur Assembly, farmasi bisa:
- ✅ Produksi racikan on-demand
- ✅ Otomatis potong stok bahan baku
- ✅ Tracking inventory mutation
- ✅ Laporan keuangan akurat
- ✅ Efisiensi operasional meningkat
- ✅ Kontrol stok lebih baik

**Happy Manufacturing! 💊🔧**
