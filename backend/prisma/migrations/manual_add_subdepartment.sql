-- Migration: Add sub-department support (fixed version)

-- Step 1: Drop unique constraint on 'name'
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_name_key;

-- Step 2: Add columns if not exist
ALTER TABLE departments ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Step 3: Add index on parentId
CREATE INDEX IF NOT EXISTS "departments_parentId_idx" ON departments("parentId");

-- Step 4: Add foreign key (drop first if exists to avoid error)
DO $$ BEGIN
  ALTER TABLE departments ADD CONSTRAINT "departments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
