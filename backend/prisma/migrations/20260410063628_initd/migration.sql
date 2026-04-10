/*
  Warnings:

  - You are about to drop the column `category` on the `product_masters` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registrationId]` on the table `medical_records` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productCode,clinicId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,clinicId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[queueNo,clinicId,queueDate]` on the table `queue_numbers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNo,clinicId]` on the table `registrations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_doctorId_fkey";

-- DropIndex
DROP INDEX "product_masters_category_idx";

-- DropIndex
DROP INDEX "products_productCode_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "queue_numbers_queueNo_key";

-- DropIndex
DROP INDEX "registrations_registrationNo_key";

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "image" TEXT,
ADD COLUMN     "masterProductId" TEXT;

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "queueCode" TEXT;

-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "consultationDraft" JSONB,
ADD COLUMN     "labNotes" TEXT,
ADD COLUMN     "labResults" TEXT,
ADD COLUMN     "registrationId" TEXT,
ALTER COLUMN "appointmentId" DROP NOT NULL,
ALTER COLUMN "doctorId" DROP NOT NULL,
ALTER COLUMN "diagnosis" DROP NOT NULL;

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "clinicId" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "medicineCode" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "bpjsNumber" TEXT,
ADD COLUMN     "insuranceName" TEXT;

-- AlterTable
ALTER TABLE "product_masters" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "queue_numbers" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "doctorId" TEXT,
ADD COLUMN     "registrationId" TEXT;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "doctorId" TEXT;

-- CreateTable
CREATE TABLE "medical_record_services" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_record_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_record_services_medicalRecordId_idx" ON "medical_record_services"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_categoryName_key" ON "product_categories"("categoryName");

-- CreateIndex
CREATE INDEX "assets_masterProductId_idx" ON "assets"("masterProductId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_records_registrationId_key" ON "medical_records"("registrationId");

-- CreateIndex
CREATE INDEX "medicines_clinicId_idx" ON "medicines"("clinicId");

-- CreateIndex
CREATE INDEX "product_masters_categoryId_idx" ON "product_masters"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_clinicId_key" ON "products"("productCode", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_clinicId_key" ON "products"("sku", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "queue_numbers_queueNo_clinicId_queueDate_key" ON "queue_numbers"("queueNo", "clinicId", "queueDate");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registrationNo_clinicId_key" ON "registrations"("registrationNo", "clinicId");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_numbers" ADD CONSTRAINT "queue_numbers_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_numbers" ADD CONSTRAINT "queue_numbers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_services" ADD CONSTRAINT "medical_record_services_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_services" ADD CONSTRAINT "medical_record_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_masters" ADD CONSTRAINT "product_masters_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_masterProductId_fkey" FOREIGN KEY ("masterProductId") REFERENCES "product_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
