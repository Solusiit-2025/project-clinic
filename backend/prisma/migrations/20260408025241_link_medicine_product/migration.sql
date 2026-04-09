/*
  Warnings:

  - A unique constraint covering the columns `[medicineId]` on the table `product_masters` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "product_masters" ADD COLUMN     "medicineId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_masters_medicineId_key" ON "product_masters"("medicineId");

-- AddForeignKey
ALTER TABLE "product_masters" ADD CONSTRAINT "product_masters_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
