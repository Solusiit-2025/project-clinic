import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export const resetTransactions = async (req: Request, res: Response) => {
  const { confirmationText, clinicId } = req.body;

  // Security check: Must be Super Admin (handled by middleware, but good to double check)
  if ((req as any).user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Hanya Super Admin yang dapat melakukan reset system.' });
  }

  // Double confirmation text
  if (confirmationText !== 'GOLIVE-CONFIRM-RESET') {
    return res.status(400).json({ message: 'Teks konfirmasi salah.' });
  }

  try {
    // Perform deletion in a specific order to avoid FK constraints
    await prisma.$transaction(async (tx) => {
      
      const clinicFilter = clinicId ? { clinicId } : {};
      const branchFilter = clinicId ? { branchId: clinicId } : {};

      // 1. Finance & Billing
      await tx.invoiceItem.deleteMany({ where: clinicId ? { invoice: { clinicId } } : {} });
      await tx.invoice.deleteMany({ where: clinicFilter });
      await tx.journalDetail.deleteMany({ where: clinicId ? { journalEntry: { clinicId } } : {} });
      await tx.journalEntry.deleteMany({ where: clinicFilter });
      await tx.expense.deleteMany({ where: clinicFilter });
      await tx.financialReport.deleteMany({ where: clinicFilter });

      // 2. Inventory & Stock
      await tx.inventoryMutation.deleteMany({ where: branchFilter });
      await tx.inventoryReturn.deleteMany({ where: branchFilter });
      await tx.inventoryAuditLog.deleteMany({ where: branchFilter });
      await tx.stockOpnameItem.deleteMany({ where: clinicId ? { session: { branchId: clinicId } } : {} });
      await tx.stockOpnameSession.deleteMany({ where: branchFilter });
      await tx.interBranchTransfer.deleteMany({ where: clinicId ? { OR: [{ sourceBranchId: clinicId }, { destBranchId: clinicId }] } : {} });
      await tx.procurementItem.deleteMany({ where: clinicId ? { procurement: { branchId: clinicId } } : {} });
      await tx.procurementPayment.deleteMany({ where: branchFilter });
      await tx.procurement.deleteMany({ where: branchFilter });
      
      // Stock reset (Start with empty warehouse)
      await tx.inventoryBatch.deleteMany({ where: branchFilter });
      await tx.inventoryStock.deleteMany({ where: branchFilter });

      // 3. Medical & Records
      await tx.vitalSign.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.prescriptionItemComponent.deleteMany({ where: clinicId ? { prescriptionItem: { prescription: { medicalRecord: { clinicId } } } } : {} });
      await tx.prescriptionItem.deleteMany({ where: clinicId ? { prescription: { medicalRecord: { clinicId } } } : {} });
      await tx.prescription.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecordAttachment.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecordService.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.radiologyOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.labOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.medicalRecord.deleteMany({ where: clinicFilter });

      // 4. Registration & Operational
      await tx.queueNumber.deleteMany({ where: clinicFilter });
      await tx.registration.deleteMany({ where: clinicFilter });
      await tx.appointmentService.deleteMany({ where: clinicId ? { appointment: { clinicId } } : {} });
      await tx.appointment.deleteMany({ where: clinicFilter });

      // 5. Assets (Optional: but often kept as master. Typically maintenance/transfers are reset)
      await tx.assetTransfer.deleteMany({ where: clinicId ? { OR: [{ fromClinicId: clinicId }, { toClinicId: clinicId }] } : {} });
      await tx.assetMaintenance.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });
      await tx.assetAuditLog.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });

      // Reset Account Balances to Zero
      await tx.chartOfAccount.updateMany({
        where: clinicFilter,
        data: { openingBalance: 0 }
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
