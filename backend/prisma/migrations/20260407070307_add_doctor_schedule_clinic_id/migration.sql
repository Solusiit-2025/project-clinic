-- AlterTable
ALTER TABLE "doctor_schedules" ADD COLUMN     "clinicId" TEXT;

-- CreateIndex
CREATE INDEX "doctor_schedules_clinicId_idx" ON "doctor_schedules"("clinicId");

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
