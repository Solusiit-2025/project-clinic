# Asset Management Extension

## Overview
Extension untuk sistem management asset yang mencakup:
1. **Maintenance Tracking** - Perawatan dan pemeliharaan aset
2. **Asset Transfer** - Transfer aset antar klinik
3. **Audit Trail** - Log perubahan aset
4. **Insurance Management** - Tracking asuransi aset
5. **Enhanced Depreciation** - Multiple depreciation methods

## Database Changes

### New Tables
1. **asset_maintenance** - Records perawatan aset
2. **asset_transfers** - Records transfer aset antar klinik
3. **asset_audit_logs** - Log perubahan aset
4. **asset_insurance** - Informasi asuransi aset

### Updated Tables
1. **assets** - Added relations to new tables
2. **clinics** - Added relations for asset transfers

## API Endpoints

### Base URL: `/api/assets`

### 1. Maintenance Management
```
GET    /:id/maintenance                    # Get maintenance records
POST   /:id/maintenance                    # Create maintenance record
PUT    /maintenance/:maintenanceId         # Update maintenance record
DELETE /maintenance/:maintenanceId         # Delete maintenance record
```

### 2. Transfer Management
```
GET    /:id/transfers                      # Get transfer records
POST   /:id/transfer                       # Create transfer request
PUT    /transfer/:transferId/approve       # Approve transfer
PUT    /transfer/:transferId/reject        # Reject transfer
```

### 3. Audit Logs
```
GET    /:id/audit-logs                     # Get audit logs
```

### 4. Insurance Management
```
GET    /:id/insurance                      # Get insurance info
POST   /:id/insurance                      # Create/update insurance
DELETE /:id/insurance                      # Delete insurance
```

### 5. Reports
```
GET    /reports/maintenance-schedule       # Upcoming maintenance
GET    /reports/expiring-insurance         # Expiring insurance
```

### 6. Finance Operations (Existing, Enhanced)
```
POST   /:id/depreciate                     # Record depreciation
POST   /depreciate-all                     # Batch depreciation
POST   /:id/dispose                        # Asset disposal
GET    /register                           # Asset register
POST   /sync-opening-balance               # Sync opening balance
```

## Depreciation Methods

### 1. Straight-Line Method (Default)
```
Formula: (Purchase Price - Salvage Value) / (Useful Life × 12)
Example: Asset Rp 100M, salvage Rp 10M, 5 years
         Monthly depreciation = (100M - 10M) / (5 × 12) = Rp 1.5M
```

### 2. Declining Balance Method
```
Formula: Book Value × Rate / 12
Default rate: 20% per year
Example: Asset Rp 100M, rate 20%
         Year 1 monthly: 100M × 0.2 / 12 = Rp 1.67M
         Year 2 monthly: (100M - 20M) × 0.2 / 12 = Rp 1.33M
```

## Workflow Examples

### 1. Maintenance Workflow
```
1. Asset purchased → status: active
2. Schedule preventive maintenance every 6 months
3. Record maintenance with cost and technician
4. System updates last_maintenance_date
5. Schedule next maintenance automatically
```

### 2. Transfer Workflow
```
1. Create transfer request (status: pending)
2. Asset status changes to: inactive
3. Approve transfer (status: approved)
4. Asset clinic_id updated to new clinic
5. Asset status changes back to: active
```

### 3. Depreciation Workflow
```
1. Monthly depreciation batch job
2. Calculate depreciation based on method
3. Create journal entry (Debit: Depreciation Expense, Credit: Accumulated Depreciation)
4. Update asset: total_depreciated, current_value
5. Create audit log
```

## Integration Points

### 1. With Accounting Module
- Depreciation creates journal entries
- Disposal creates gain/loss journal entries
- Insurance premiums can be linked to expenses

### 2. With Procurement Module
- Assets can be linked to procurement items
- Purchase creates asset and journal entry automatically

### 3. With Inventory Module
- Shared clinic/branch structure
- Similar audit logging system

## Testing Guide

### 1. Unit Testing
```bash
# Test maintenance endpoint
curl -X POST "http://localhost:3004/api/assets/{id}/maintenance" \
  -H "Authorization: Bearer {token}" \
  -d '{"maintenanceDate":"2026-04-25","maintenanceType":"preventive","description":"Test"}'

# Test transfer endpoint
curl -X POST "http://localhost:3004/api/assets/{id}/transfer" \
  -H "Authorization: Bearer {token}" \
  -d '{"toClinicId":"{clinicId}","transferDate":"2026-04-26"}'
```

### 2. Integration Testing
1. Create asset with purchase
2. Record maintenance
3. Transfer asset to another clinic
4. Record depreciation
5. Dispose asset
6. Verify all audit logs

### 3. Data Validation
```sql
-- Check data integrity
SELECT 
  a.asset_code,
  COUNT(m.id) as maintenance_count,
  COUNT(t.id) as transfer_count,
  COUNT(al.id) as audit_count
FROM assets a
LEFT JOIN asset_maintenance m ON a.id = m.asset_id
LEFT JOIN asset_transfers t ON a.id = t.asset_id
LEFT JOIN asset_audit_logs al ON a.id = al.asset_id
GROUP BY a.id
ORDER BY a.asset_code;
```

## Frontend Implementation Notes

### 1. Asset Detail Page
- Add tabs for: Maintenance, Transfers, Audit Logs, Insurance
- Show maintenance schedule
- Show insurance expiry warning

### 2. Asset List Page
- Add filters for: needs maintenance, expiring insurance
- Add export for asset register

### 3. Reports Page
- Maintenance schedule report
- Expiring insurance report
- Depreciation schedule report

## Security Considerations

### 1. Authorization
- Maintenance: Staff, Logistic roles
- Transfers: Admin, Logistic roles
- Depreciation: Accounting role
- Insurance: Admin, Accounting roles

### 2. Audit Trail
- All changes logged with user and timestamp
- No direct database updates allowed
- All operations through API endpoints

### 3. Data Validation
- Validate dates (not in future for maintenance)
- Validate amounts (positive values)
- Validate clinic IDs (exist in database)

## Performance Considerations

### 1. Indexing
```sql
-- Important indexes
CREATE INDEX idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX idx_asset_maintenance_date ON asset_maintenance(maintenance_date);
CREATE INDEX idx_asset_transfers_status ON asset_transfers(status);
CREATE INDEX idx_asset_audit_logs_asset_id ON asset_audit_logs(asset_id);
CREATE INDEX idx_asset_insurance_end_date ON asset_insurance(end_date);
```

### 2. Batch Operations
- Use `depreciate-all` for monthly batch
- Use pagination for audit logs
- Cache frequently accessed data

### 3. Monitoring
- Monitor maintenance schedule alerts
- Monitor insurance expiry alerts
- Monitor depreciation completion

## Deployment Checklist

### Pre-Deployment
- [ ] Backup existing database
- [ ] Run database migration
- [ ] Test all endpoints
- [ ] Update API documentation
- [ ] Train users on new features

### Post-Deployment
- [ ] Monitor error logs
- [ ] Verify data integrity
- [ ] Collect user feedback
- [ ] Optimize performance if needed

## Troubleshooting

### Common Issues
1. **Migration fails** - Check Prisma schema validation
2. **API errors** - Check authentication and authorization
3. **Data inconsistencies** - Run data validation queries
4. **Performance issues** - Check database indexes

### Support Contacts
- Database: DBA Team
- API: Backend Team
- Frontend: Frontend Team
- Business: Asset Management Team

## Changelog

### v1.0.0 (Initial Release)
- Added maintenance tracking
- Added asset transfer workflow
- Added audit trail system
- Added insurance management
- Enhanced depreciation methods
- Added comprehensive reports

### Future Enhancements
- Barcode/QR code integration
- Mobile app for asset scanning
- Predictive maintenance AI
- Integration with IoT sensors
- Advanced reporting and analytics