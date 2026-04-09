-- Migration: Convert doctor.department string to doctor.departmentId relation

-- 1. Add departmentId column
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

-- 2. Add index for departmentId
CREATE INDEX IF NOT EXISTS "doctors_departmentId_idx" ON doctors("departmentId");

-- 3. Add foreign key constraint
DO $$ BEGIN
  ALTER TABLE doctors ADD CONSTRAINT "doctors_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Remove old department column (Optional: keep it for manual cleanup if needed, but for the task I'll remove it)
ALTER TABLE doctors DROP COLUMN IF EXISTS "department";
