/*
  Warnings:

  - You are about to drop the column `departmentId` on the `doctors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_departmentId_fkey";

-- DropIndex
DROP INDEX "doctors_departmentId_idx";

-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "departmentId";

-- AlterTable
ALTER TABLE "queue_numbers" ADD COLUMN     "callCounter" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "_DoctorAllDepts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DoctorAllDepts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DoctorAllDepts_B_index" ON "_DoctorAllDepts"("B");

-- AddForeignKey
ALTER TABLE "_DoctorAllDepts" ADD CONSTRAINT "_DoctorAllDepts_A_fkey" FOREIGN KEY ("A") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorAllDepts" ADD CONSTRAINT "_DoctorAllDepts_B_fkey" FOREIGN KEY ("B") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
