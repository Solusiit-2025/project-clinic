import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resetTransactions = async (req: Request, res: Response) => {
  const { confirmationText, clinicId } = req.body;

  // Security check: Must be Super Admin (handled by middleware, but good to double check)
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Hanya Super Admin yang dapat melakukan reset system.' });
  }

  // Double confirmation text
  if (confirmationText !== 'GOLIVE-CONFIRM-RESET') {
    return res.status(400).json({ message: 'Teks konfirmasi salah.' });
  }

  try {
    // Perform deletion in a specific order to avoid FK constraints
    await prisma.$transaction(async (tx) => {
      
      const filter = clinicId ? { clinicId } : {};

      // 1. Finance & Billing
      await tx.invoiceItem.deleteMany({ where: clinicId ? { invoice: { clinicId } } : {} });
      await tx.invoice.deleteMany({ where: filter });
      await tx.journalItem.deleteMany({ where: clinicId ? { journalEntry: { clinicId } } : {} });
      await tx.journalEntry.deleteMany({ where: filter });
      await tx.expense.deleteMany({ where: filter });
      await tx.financialReport.deleteMany({ where: filter });

      // 2. Inventory & Stock
      await tx.inventoryMutation.deleteMany({ where: filter });
      await tx.inventoryReturn.deleteMany({ where: filter });
      await tx.inventoryAuditLog.deleteMany({ where: filter });
      await tx.stockOpnameItem.deleteMany({ where: clinicId ? { session: { clinicId } } : {} });
      await tx.stockOpnameSession.deleteMany({ where: filter });
      await tx.interBranchTransfer.deleteMany({ where: clinicId ? { OR: [{ sourceClinicId: clinicId }, { destinationClinicId: clinicId }] } : {} });
      await tx.procurementItem.deleteMany({ where: clinicId ? { procurement: { clinicId } } : {} });
      await tx.procurementPayment.deleteMany({ where: clinicId ? { procurement: { clinicId } } : {} });
      await tx.procurement.deleteMany({ where: filter });
      
      // Stock reset (Start with empty warehouse)
      await tx.inventoryBatch.deleteMany({ where: filter });
      await tx.inventoryStock.deleteMany({ where: filter });

      // 3. Medical & Records
      await tx.vitalSign.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.prescriptionItemComponent.deleteMany({ where: clinicId ? { prescriptionItem: { prescription: { clinicId } } } : {} });
      await tx.prescriptionItem.deleteMany({ where: clinicId ? { prescription: { clinicId } } : {} });
      await tx.prescription.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecordAttachment.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecordService.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.radiologyOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.labOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecord.deleteMany({ where: filter });

      // 4. Registration & Operational
      await tx.queueNumber.deleteMany({ where: filter });
      await tx.registration.deleteMany({ where: filter });
      await tx.appointmentService.deleteMany({ where: clinicId ? { appointment: { clinicId } } : {} });
      await tx.appointment.deleteMany({ where: filter });

      // 5. Assets (Optional: but often kept as master. Typically maintenance/transfers are reset)
      await tx.assetTransfer.deleteMany({ where: clinicId ? { OR: [{ fromClinicId: clinicId }, { toClinicId: clinicId }] } : {} });
      await tx.assetMaintenance.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });
      await tx.assetAuditLog.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });

      // Reset Account Balances to Zero
      await tx.chartOfAccount.updateMany({
        where: filter,
        data: { balance: 0 }
      });
    });

    return res.status(200).json({ 
      message: clinicId 
        ? 'Data transaksi klinik ini berhasil direset untuk Go Live.' 
        : 'Seluruh data transaksi semua cabang berhasil direset untuk Go Live.' 
    });
  } catch (error: any) {
    console.error('Go Live Reset Error:', error);
    return res.status(500).json({ message: 'Gagal melakukan reset sistem: ' + error.message });
  }
};
