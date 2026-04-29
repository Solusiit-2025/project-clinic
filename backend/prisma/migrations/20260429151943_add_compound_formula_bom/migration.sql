-- ============================================================
-- Migration: add_compound_formula_bom
-- Tanggal: 2026-04-29
-- Deskripsi: Menambahkan Master Formula Racikan (Bill of Materials)
--            untuk mendukung template racikan standar yang dapat
--            digunakan ulang saat penulisan resep.
-- ============================================================

-- Tabel master formula racikan
CREATE TABLE "compound_formulas" (
    "id"                   TEXT NOT NULL,
    "formulaCode"          TEXT NOT NULL,
    "formulaName"          TEXT NOT NULL,
    "description"          TEXT,
    "category"             TEXT,
    "dosageForm"           TEXT,
    "defaultQty"           INTEGER NOT NULL DEFAULT 10,
    "defaultDosage"        TEXT,
    "defaultFrequency"     TEXT,
    "defaultDuration"      TEXT,
    "defaultInstructions"  TEXT,
    "tuslahPrice"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive"             BOOLEAN NOT NULL DEFAULT true,
    "clinicId"             TEXT,
    "createdBy"            TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,
    "deletedAt"            TIMESTAMP(3),

    CONSTRAINT "compound_formulas_pkey" PRIMARY KEY ("id")
);

-- Tabel komponen bahan baku formula
CREATE TABLE "compound_formula_items" (
    "id"          TEXT NOT NULL,
    "formulaId"   TEXT NOT NULL,
    "medicineId"  TEXT NOT NULL,
    "quantity"    DOUBLE PRECISION NOT NULL,
    "unit"        TEXT,
    "notes"       TEXT,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compound_formula_items_pkey" PRIMARY KEY ("id")
);

-- Kolom formulaId di prescription_items (referensi ke formula yang digunakan)
ALTER TABLE "prescription_items" ADD COLUMN "formulaId" TEXT;

-- Kolom unit di prescription_item_components (satuan bahan baku)
ALTER TABLE "prescription_item_components" ADD COLUMN "unit" TEXT;

-- Unique constraint pada formulaCode
CREATE UNIQUE INDEX "compound_formulas_formulaCode_key" ON "compound_formulas"("formulaCode");

-- Index untuk performa query
CREATE INDEX "compound_formulas_clinicId_idx"  ON "compound_formulas"("clinicId");
CREATE INDEX "compound_formulas_category_idx"  ON "compound_formulas"("category");
CREATE INDEX "compound_formulas_isActive_idx"  ON "compound_formulas"("isActive");
CREATE INDEX "compound_formula_items_formulaId_idx"  ON "compound_formula_items"("formulaId");
CREATE INDEX "compound_formula_items_medicineId_idx" ON "compound_formula_items"("medicineId");

-- Foreign keys
ALTER TABLE "compound_formulas"
    ADD CONSTRAINT "compound_formulas_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "compound_formula_items"
    ADD CONSTRAINT "compound_formula_items_formulaId_fkey"
    FOREIGN KEY ("formulaId") REFERENCES "compound_formulas"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compound_formula_items"
    ADD CONSTRAINT "compound_formula_items_medicineId_fkey"
    FOREIGN KEY ("medicineId") REFERENCES "medicines"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "prescription_items"
    ADD CONSTRAINT "prescription_items_formulaId_fkey"
    FOREIGN KEY ("formulaId") REFERENCES "compound_formulas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
