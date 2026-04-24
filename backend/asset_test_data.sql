-- Sample Data untuk Testing Asset Management
-- Jalankan query ini di PostgreSQL untuk membuat data testing

-- 1. Buat aset contoh untuk testing
INSERT INTO assets (id, asset_code, asset_name, asset_type, category, purchase_date, purchase_price, current_value, salvage_value, useful_life_years, depreciation_method, total_depreciated, condition, status, clinic_id, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'AST-001', 'Mesin USG 4D', 'equipment', 'medical', '2026-01-15', 500000000, 500000000, 50000000, 5, 'STRAIGHT_LINE', 0, 'excellent', 'active', (SELECT id FROM clinics LIMIT 1), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'AST-002', 'Komputer Server', 'computer', 'it', '2026-02-20', 25000000, 25000000, 5000000, 3, 'DECLINING_BALANCE', 0, 'good', 'active', (SELECT id FROM clinics LIMIT 1), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'AST-003', 'Mobil Ambulance', 'vehicle', 'transport', '2026-03-10', 350000000, 350000000, 70000000, 7, 'STRAIGHT_LINE', 0, 'good', 'active', (SELECT id FROM clinics LIMIT 1), NOW(), NOW());

-- 2. Buat maintenance records contoh
INSERT INTO asset_maintenance (id, asset_id, maintenance_date, maintenance_type, description, cost, performed_by, next_maintenance_date, notes, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2026-04-01', 'preventive', 'Kalibrasi dan pembersihan rutin', 1500000, 'Teknisi John', '2026-10-01', 'Maintenance 6 bulanan', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2026-03-15', 'corrective', 'Ganti harddisk dan upgrade RAM', 3500000, 'IT Support', '2026-09-15', 'Harddisk failure', NOW(), NOW());

-- 3. Buat insurance records contoh
INSERT INTO asset_insurance (id, asset_id, insurance_company, policy_number, coverage_amount, premium, start_date, end_date, renewal_date, contact_person, contact_phone, notes, created_at, updated_at)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Asuransi Sehat Sentosa', 'POL-MED-2026-001', 600000000, 6000000, '2026-01-01', '2026-12-31', '2026-11-30', 'Budi Santoso', '08123456789', 'Asuransi all-risk untuk alat medis', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Asuransi Jalan Aman', 'POL-VEH-2026-002', 400000000, 4000000, '2026-01-01', '2026-12-31', '2026-11-30', 'Siti Rahayu', '08234567890', 'Asuransi kendaraan komprehensif', NOW(), NOW());

-- 4. Update last_maintenance_date di assets
UPDATE assets SET last_maintenance_date = '2026-04-01' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE assets SET last_maintenance_date = '2026-03-15' WHERE id = '22222222-2222-2222-2222-222222222222';

-- 5. Buat audit logs contoh
INSERT INTO asset_audit_logs (id, asset_id, action, field_changed, old_value, new_value, changed_by, changed_at, notes)
VALUES 
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'CREATE', NULL, NULL, '{"assetCode":"AST-001","assetName":"Mesin USG 4D"}', 'system', NOW(), 'Asset created'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'MAINTENANCE', 'lastMaintenanceDate', NULL, '2026-04-01T00:00:00.000Z', 'system', NOW(), 'Maintenance recorded');

-- 6. Verifikasi data
SELECT 
  a.asset_code,
  a.asset_name,
  a.asset_type,
  a.purchase_price,
  a.current_value,
  a.total_depreciated,
  a.last_maintenance_date,
  COUNT(m.id) as maintenance_count,
  i.insurance_company,
  i.policy_number,
  COUNT(al.id) as audit_log_count
FROM assets a
LEFT JOIN asset_maintenance m ON a.id = m.asset_id
LEFT JOIN asset_insurance i ON a.id = i.asset_id
LEFT JOIN asset_audit_logs al ON a.id = al.asset_id
WHERE a.asset_code LIKE 'AST-%'
GROUP BY a.id, a.asset_code, a.asset_name, a.asset_type, a.purchase_price, a.current_value, a.total_depreciated, a.last_maintenance_date, i.insurance_company, i.policy_number
ORDER BY a.asset_code;