-- Migration: Add Role enum to PostgreSQL
-- Safe migration - preserves existing data

-- Step 1: Create the enum type
CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'DOCTOR',
  'RECEPTIONIST',
  'FARMASI',
  'ACCOUNTING',
  'LOGISTIC',
  'STAFF'
);

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE "users" ADD COLUMN "role_new" "Role" NOT NULL DEFAULT 'STAFF';

-- Step 3: Migrate existing data - map old string values to new enum values
UPDATE "users" SET "role_new" = 
  CASE 
    WHEN LOWER("role") = 'superadmin' OR LOWER("role") = 'super_admin' THEN 'SUPER_ADMIN'::"Role"
    WHEN LOWER("role") = 'admin' THEN 'ADMIN'::"Role"
    WHEN LOWER("role") = 'doctor' THEN 'DOCTOR'::"Role"
    WHEN LOWER("role") = 'receptionist' THEN 'RECEPTIONIST'::"Role"
    WHEN LOWER("role") = 'farmasi' OR LOWER("role") = 'pharmacy' THEN 'FARMASI'::"Role"
    WHEN LOWER("role") = 'accounting' THEN 'ACCOUNTING'::"Role"
    WHEN LOWER("role") = 'logistic' THEN 'LOGISTIC'::"Role"
    ELSE 'STAFF'::"Role"
  END;

-- Step 4: Drop the old column
ALTER TABLE "users" DROP COLUMN "role";

-- Step 5: Rename the new column to 'role'
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";
