# Dashboard Khusus Farmasi

## Overview
Dashboard khusus untuk role **FARMASI** yang menampilkan informasi relevan tanpa data keuangan yang tidak perlu mereka ketahui.

## Fitur Dashboard Farmasi

### 1. **Statistik Real-time**
- **Menunggu Diramu** - Resep yang belum diproses
- **Sedang Diramu** - Resep dalam proses pengerjaan
- **Siap Diserahkan** - Resep yang sudah siap
- **Diserahkan Hari Ini** - Total resep yang sudah diserahkan

### 2. **Alert Banner Aktif**
Jika ada resep di antrian, muncul banner orange dengan:
- Total resep aktif
- Breakdown status (pending/preparing/ready)
- Quick link ke halaman antrian

### 3. **Antrian Resep**
- List 8 resep terbaru hari ini
- Informasi: nama pasien, nomor RM, nomor resep, dokter, jumlah item
- Status badge dengan color coding
- Click untuk detail resep

### 4. **Quick Actions**
Akses cepat ke:
- Antrian Farmasi
- Stok Obat
- Mutasi Stok
- Data Obat & Alkes

### 5. **Alert Stok Menipis**
- Produk dengan stok di bawah minimum
- Menampilkan nama, kode, stok saat ini vs minimum
- Auto-refresh setiap 30 detik

### 6. **Alert Mendekati Kadaluarsa**
- Batch yang kadaluarsa dalam 90 hari
- Menampilkan nama produk, batch number, sisa hari
- Color coding: merah (≤30 hari), kuning (>30 hari)

## Routing & Access Control

### Automatic Redirect
```typescript
// Di /admin/page.tsx
useEffect(() => {
  if (user?.role === 'FARMASI') {
    router.replace('/admin/farmasi')
  }
}, [user, router])
```

### Menu Sidebar Khusus
Role FARMASI hanya melihat 5 menu:
1. Dashboard → `/admin/farmasi`
2. Antrian Farmasi → `/admin/transactions/pharmacy`
3. Stok Obat → `/admin/inventory`
4. Mutasi Stok → `/admin/inventory/mutations`
5. Data Obat & Alkes → `/admin/master/medicines`

**Tidak ada akses ke:**
- ❌ Dashboard Admin (data keuangan)
- ❌ Billing & Pembayaran
- ❌ Laporan Keuangan
- ❌ Hutang Supplier
- ❌ Manajemen Aset
- ❌ Chart of Accounts
- ❌ Jurnal Umum

## API Endpoints yang Digunakan

```
GET /api/pharmacy/queues
    - Fetch semua resep aktif
    - Params: clinicId (via x-clinic-id header)

GET /api/inventory/stocks
    - Fetch stok produk
    - Params: branchId, limit
    - Returns: Stock[] dengan product, batch info
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ User Login (role: FARMASI)                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Admin Layout Check                                      │
│ - Authenticated? ✓                                      │
│ - Role in staffRoles? ✓ (FARMASI included)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ /admin/page.tsx                                         │
│ - Detect role === 'FARMASI'                            │
│ - router.replace('/admin/farmasi') ← REDIRECT          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ /admin/farmasi/page.tsx                                 │
│ - Fetch pharmacy queues                                 │
│ - Fetch inventory stocks                                │
│ - Compute stats & alerts                                │
│ - Auto-refresh every 30s                                │
└─────────────────────────────────────────────────────────┘
```

## Sidebar Behavior

```typescript
// Di Sidebar.tsx
const isFarmasi = user?.role === 'FARMASI'

if (isFarmasi) {
  // Render FARMASI_MENU only (5 items)
  // Brand icon: "F" with emerald gradient
  // No access to finance/asset/master sections
} else {
  // Render full menu with permission checks
}
```

## Security Features

### 1. **Frontend Guard**
- Redirect di `/admin/page.tsx`
- Conditional menu di `Sidebar.tsx`
- No finance data fetched

### 2. **Backend Permission**
- API endpoints tetap check role/permission
- Farmasi tidak bisa akses `/api/accounting/*`
- Farmasi tidak bisa akses `/api/assets/*`

### 3. **Data Isolation**
Dashboard farmasi hanya fetch:
- Pharmacy queues (resep)
- Inventory stocks (stok obat)
- Tidak fetch financial reports
- Tidak fetch supplier payables

## UI/UX Highlights

### Color Scheme
- **Primary**: Emerald/Teal (farmasi theme)
- **Pending**: Amber (menunggu)
- **Preparing**: Blue (sedang diramu)
- **Ready**: Emerald (siap)
- **Dispensed**: Gray (selesai)

### Responsive Design
- Mobile-first layout
- Grid adapts: 2 cols (mobile) → 4 cols (desktop)
- Cards stack vertically on mobile
- Touch-friendly buttons

### Auto-refresh
- Polling every 30 seconds
- Silent refresh (no loading spinner)
- Last updated timestamp

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast compliant

## Testing Checklist

### Functional Tests
- [ ] Login sebagai FARMASI → redirect ke `/admin/farmasi`
- [ ] Dashboard menampilkan stats yang benar
- [ ] Alert banner muncul jika ada resep aktif
- [ ] Stok menipis alert akurat
- [ ] Kadaluarsa alert akurat
- [ ] Quick actions link berfungsi
- [ ] Auto-refresh bekerja (30s)

### Access Control Tests
- [ ] FARMASI tidak bisa akses `/admin` (redirect)
- [ ] FARMASI tidak bisa akses `/admin/accounting/*`
- [ ] FARMASI tidak bisa akses `/admin/assets/*`
- [ ] Sidebar hanya tampilkan 5 menu
- [ ] Tidak ada menu keuangan di sidebar

### UI/UX Tests
- [ ] Responsive di mobile/tablet/desktop
- [ ] Loading state smooth
- [ ] Refresh button bekerja
- [ ] Status badge color correct
- [ ] Alert count badge akurat

## Future Enhancements

### Phase 2
- [ ] Grafik trend dispensing (harian/mingguan)
- [ ] Top 10 obat paling sering diresepkan
- [ ] Notifikasi push untuk resep baru
- [ ] Barcode scanner integration

### Phase 3
- [ ] Predictive stock alerts (ML-based)
- [ ] Automated reorder suggestions
- [ ] Drug interaction checker
- [ ] Patient counseling checklist

## Deployment Notes

### Files Changed
```
frontend/app/admin/farmasi/page.tsx          ← NEW (dashboard farmasi)
frontend/app/admin/page.tsx                  ← MODIFIED (add redirect)
frontend/components/admin/Sidebar.tsx        ← MODIFIED (farmasi menu)
frontend/FARMASI_DASHBOARD_README.md         ← NEW (this file)
```

### No Backend Changes Required
- Existing API endpoints sudah cukup
- Permission check sudah ada di backend
- No new database tables needed

### Environment Variables
No new env vars required.

### Dependencies
No new dependencies added.

## Support & Troubleshooting

### Issue: Farmasi masih bisa akses admin dashboard
**Solution**: Clear browser cache, logout, login ulang

### Issue: Menu tidak muncul
**Solution**: Check `user.role` di auth store, pastikan === 'FARMASI'

### Issue: Stats tidak akurat
**Solution**: Check API response dari `/pharmacy/queues` dan `/inventory/stocks`

### Issue: Auto-refresh tidak jalan
**Solution**: Check console untuk errors, pastikan `activeClinicId` ada

## Contact
- **Frontend**: Frontend Team
- **Backend**: Backend Team
- **Business**: Pharmacy Operations Team
