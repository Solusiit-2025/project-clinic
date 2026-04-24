# Asset Management Extension - Testing Guide

## Database Changes Applied
✅ **Model baru ditambahkan:**
1. `AssetMaintenance` - Tracking perawatan aset
2. `AssetTransfer` - Transfer aset antar klinik
3. `AssetAuditLog` - Audit trail perubahan
4. `AssetInsurance` - Tracking asuransi

✅ **Fungsi depresiasi diperbaiki:**
- Straight-Line Method (sudah ada)
- Declining Balance Method (tambahan baru)

## Endpoint Baru yang Tersedia

### 1. Asset Maintenance
```
GET    /api/assets/:id/maintenance          # Get semua maintenance record
POST   /api/assets/:id/maintenance         # Buat maintenance record baru
PUT    /api/assets/maintenance/:maintenanceId  # Update maintenance record
DELETE /api/assets/maintenance/:maintenanceId  # Hapus maintenance record
```

### 2. Asset Transfer
```
GET    /api/assets/:id/transfers            # Get semua transfer record
POST   /api/assets/:id/transfer             # Buat transfer request
PUT    /api/assets/transfer/:transferId/approve  # Approve transfer
PUT    /api/assets/transfer/:transferId/reject    # Reject transfer
```

### 3. Asset Audit Logs
```
GET    /api/assets/:id/audit-logs           # Get audit logs
```

### 4. Asset Insurance
```
GET    /api/assets/:id/insurance            # Get info asuransi
POST   /api/assets/:id/insurance            # Create/update asuransi
DELETE /api/assets/:id/insurance            # Hapus info asuransi
```

### 5. Asset Reports
```
GET    /api/assets/reports/maintenance-schedule  # Jadwal maintenance mendatang
GET    /api/assets/reports/expiring-insurance   # Aset dengan asuransi hampir habis
```

### 6. Asset Finance (sudah ada, diperbaiki)
```
POST   /api/assets/:id/depreciate           # Catat penyusutan per aset
POST   /api/assets/depreciate-all            # Catat penyusutan semua aset
POST   /api/assets/:id/dispose              # Penghapusan aset
GET    /api/assets/register                 # Daftar aset + nilai buku
POST   /api/assets/sync-opening-balance    # Sync saldo awal aset
```

## Testing dengan Curl

### 1. Test Maintenance Tracking
```bash
# Get maintenance records
curl -X GET "http://localhost:3004/api/assets/{assetId}/maintenance" \
  -H "Authorization: Bearer {token}"

# Create maintenance record
curl -X POST "http://localhost:3004/api/assets/{assetId}/maintenance" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "maintenanceDate": "2026-04-25",
    "maintenanceType": "preventive",
    "description": "Pembersihan dan kalibrasi",
    "cost": 500000,
    "performedBy": "John Doe",
    "nextMaintenanceDate": "2026-10-25",
    "notes": "Maintenance rutin 6 bulanan"
  }'
```

### 2. Test Asset Transfer
```bash
# Create transfer request
curl -X POST "http://localhost:3004/api/assets/{assetId}/transfer" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "toClinicId": "{targetClinicId}",
    "transferDate": "2026-04-26",
    "transferValue": 15000000,
    "reason": "Pemindahan ke cabang baru",
    "notes": "Aset dipindahkan untuk kebutuhan operasional"
  }'

# Approve transfer
curl -X PUT "http://localhost:3004/api/assets/transfer/{transferId}/approve" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "admin-user-id"
  }'
```

### 3. Test Insurance Tracking
```bash
# Create/update insurance
curl -X POST "http://localhost:3004/api/assets/{assetId}/insurance" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "insuranceCompany": "Asuransi ABC",
    "policyNumber": "POL-2026-001",
    "coverageAmount": 20000000,
    "premium": 2000000,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "renewalDate": "2026-11-30",
    "contactPerson": "Budi Santoso",
    "contactPhone": "08123456789",
    "notes": "Asuransi all-risk"
  }'
```

### 4. Test Depreciation (Declining Balance Method)
```bash
# Catat penyusutan dengan declining balance
curl -X POST "http://localhost:3004/api/assets/{assetId}/depreciate" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2026-04",
    "amount": 1500000,
    "notes": "Penyusutan declining balance 20%"
  }'
```

### 5. Test Reports
```bash
# Get maintenance schedule (30 hari ke depan)
curl -X GET "http://localhost:3004/api/assets/reports/maintenance-schedule?daysAhead=30" \
  -H "Authorization: Bearer {token}"

# Get expiring insurance (60 hari ke depan)
curl -X GET "http://localhost:3004/api/assets/reports/expiring-insurance?daysAhead=60" \
  -H "Authorization: Bearer {token}"
```

## Fitur Baru yang Diimplementasikan

### ✅ **Maintenance Tracking**
- Record semua jenis maintenance (preventive, corrective, emergency)
- Tracking biaya maintenance
- Scheduling maintenance berikutnya
- Update otomatis `lastMaintenanceDate` di asset

### ✅ **Asset Transfer**
- Workflow transfer antar klinik (pending → approved → completed)
- Audit trail lengkap
- Update otomatis clinicId dan status asset
- Nilai transfer berdasarkan nilai buku

### ✅ **Audit Trail**
- Log semua perubahan: UPDATE, DEPRECIATE, TRANSFER, DISPOSE, MAINTENANCE
- Menyimpan oldValue dan newValue
- Tracking user yang melakukan perubahan

### ✅ **Insurance Management**
- One-to-one relation dengan asset
- Tracking policy number, coverage, premium
- Renewal date reminder
- Contact information

### ✅ **Enhanced Depreciation**
- Multiple methods: Straight-Line dan Declining Balance
- Perhitungan otomatis berdasarkan nilai buku
- Protection against over-depreciation

### ✅ **Comprehensive Reports**
- Maintenance schedule report
- Expiring insurance report
- Asset register dengan nilai buku

## Status Sistem
- ✅ Database schema updated
- ✅ Prisma Client regenerated
- ✅ Controllers created
- ✅ Routes configured
- ✅ Ready for testing

## Langkah Selanjutnya
1. **Test endpoint** dengan Postman/curl
2. **Integrasi frontend** untuk fitur baru
3. **Monitoring** di production
4. **Training** untuk user