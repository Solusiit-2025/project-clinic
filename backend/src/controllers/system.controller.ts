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
      await tx.payment.deleteMany({ where: clinicId ? { invoice: { clinicId } } : {} });
      await tx.corporatePayment.deleteMany({ where: clinicId ? { corporateInvoice: { clinicId } } : {} });
      await tx.corporateInvoice.deleteMany({ where: clinicFilter });
      await tx.doctorCommission.deleteMany({ where: clinicFilter });
      await tx.cashTransfer.deleteMany({ where: clinicFilter });
      await tx.openingBalanceItem.deleteMany({ where: clinicId ? { openingBalance: { clinicId } } : {} });
      await tx.openingBalance.deleteMany({ where: clinicFilter });
      await tx.invoiceItem.deleteMany({ where: clinicId ? { invoice: { clinicId } } : {} });
      await tx.invoice.deleteMany({ where: clinicFilter });
      await tx.journalDetail.deleteMany({ where: clinicId ? { journalEntry: { clinicId } } : {} });
      await tx.journalEntry.deleteMany({ where: clinicFilter });
      await tx.expense.deleteMany({ where: clinicFilter });
      await tx.financialReport.deleteMany({ where: clinicFilter });

      // 2. Inventory & Stock
      await tx.directMedicinePurchaseItem.deleteMany({ where: clinicId ? { directMedicinePurchase: { clinicId } } : {} });
      await tx.directMedicinePurchase.deleteMany({ where: clinicFilter });
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
      await tx.referral.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.radiologyOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      await tx.labResultDetail.deleteMany({ where: clinicId ? { order: { medicalRecord: { clinicId } } } : {} });
      await tx.labOrderAttachment.deleteMany({ where: clinicId ? { labOrder: { medicalRecord: { clinicId } } } : {} });
      await tx.labOrder.deleteMany({ where: clinicId ? { medicalRecord: { clinicId } } : {} });
      
      // If Reset ALL, also clear Treatment Plans
      if (!clinicId) {
        await tx.visit.deleteMany();
        await tx.treatmentPlanItem.deleteMany();
        await tx.treatmentPlan.deleteMany();
      }

      await tx.medicalRecord.deleteMany({ where: clinicFilter });

      // 4. Registration & Operational
      await tx.queueNumber.deleteMany({ where: clinicFilter });
      await tx.registration.deleteMany({ where: clinicFilter });
      await tx.appointmentService.deleteMany({ where: clinicId ? { appointment: { clinicId } } : {} });
      await tx.appointment.deleteMany({ where: clinicFilter });

      // 5. Assets (Maintenance & transfers are reset, but Asset master records are kept)
      await tx.assetTransfer.deleteMany({ where: clinicId ? { OR: [{ fromClinicId: clinicId }, { toClinicId: clinicId }] } : {} });
      await tx.assetMaintenance.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });
      await tx.assetAuditLog.deleteMany({ where: clinicId ? { asset: { clinicId } } : {} });

      // 6. Final Stock Cleanup (Ensure Product quantities are reset to 0)
      await tx.product.updateMany({
        where: clinicFilter,
        data: { quantity: 0 }
      });

      // 7. Finance Cleanup (Reset COA opening balances)
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

export const resetTransactionsMay = async (req: Request, res: Response) => {
  const { confirmationText, clinicId } = req.body;

  // Security check: Must be Super Admin
  if ((req as any).user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Hanya Super Admin yang dapat melakukan reset system.' });
  }

  // Double confirmation text
  if (confirmationText !== 'RESET-MEI') {
    return res.status(400).json({ message: 'Teks konfirmasi salah. Harap ketik RESET-MEI' });
  }

  try {
    const cutOffDate = new Date('2026-05-31T17:00:00.000Z'); // 1 Juni 2026 WIB
    
    // Ensure the cutoff date is valid
    const mayFilter = {
      createdAt: { lt: cutOffDate }
    };
    
    const mayClinicFilter = clinicId ? { clinicId, ...mayFilter } : mayFilter;
    const parentFilter = (parent: string) => clinicId 
      ? { [parent]: { clinicId, createdAt: { lt: cutOffDate } } }
      : { [parent]: { createdAt: { lt: cutOffDate } } };

    await prisma.$transaction(async (tx) => {
      // 1. Finance & Billing (Hapus tagihan dan pembayaran MEI)
      await tx.payment.deleteMany({ where: parentFilter('invoice') });
      await tx.corporatePayment.deleteMany({ where: parentFilter('corporateInvoice') });
      await tx.corporateInvoice.deleteMany({ where: mayClinicFilter });
      await tx.doctorCommission.deleteMany({ where: mayClinicFilter });
      await tx.cashTransfer.deleteMany({ where: mayClinicFilter });
      await tx.openingBalanceItem.deleteMany({ where: parentFilter('openingBalance') });
      await tx.openingBalance.deleteMany({ where: mayClinicFilter });
      await tx.invoiceItem.deleteMany({ where: parentFilter('invoice') });
      await tx.invoice.deleteMany({ where: mayClinicFilter });
      await tx.journalDetail.deleteMany({ where: parentFilter('journalEntry') });
      await tx.journalEntry.deleteMany({ where: mayClinicFilter });
      await tx.expense.deleteMany({ where: mayClinicFilter });
      await tx.financialReport.deleteMany({ where: mayClinicFilter });
      
      const procurementFilter = clinicId 
        ? { procurement: { branchId: clinicId, createdAt: { lt: cutOffDate } } }
        : { procurement: { createdAt: { lt: cutOffDate } } };
      await tx.procurementPayment.deleteMany({ where: procurementFilter });

      // 2. Medical & Records (Hapus rekam medis MEI)
      await tx.vitalSign.deleteMany({ where: parentFilter('medicalRecord') });
      
      const prescriptionItemComponentFilter = clinicId 
        ? { prescriptionItem: { prescription: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } } }
        : { prescriptionItem: { prescription: { medicalRecord: { createdAt: { lt: cutOffDate } } } } };
      await tx.prescriptionItemComponent.deleteMany({ where: prescriptionItemComponentFilter });
      
      const prescriptionItemFilter = clinicId 
        ? { prescription: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } }
        : { prescription: { medicalRecord: { createdAt: { lt: cutOffDate } } } };
      await tx.prescriptionItem.deleteMany({ where: prescriptionItemFilter });
      
      await tx.prescription.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.medicalRecordAttachment.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.medicalRecordService.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.referral.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.radiologyOrder.deleteMany({ where: parentFilter('medicalRecord') });
      
      const labResultFilter = clinicId 
        ? { order: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } }
        : { order: { medicalRecord: { createdAt: { lt: cutOffDate } } } };
      await tx.labResultDetail.deleteMany({ where: labResultFilter });
      
      const labAttachmentFilter = clinicId 
        ? { labOrder: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } }
        : { labOrder: { medicalRecord: { createdAt: { lt: cutOffDate } } } };
      await tx.labOrderAttachment.deleteMany({ where: labAttachmentFilter });
      
      await tx.labOrder.deleteMany({ where: parentFilter('medicalRecord') });
      
      if (!clinicId) {
        await tx.visit.deleteMany({ where: { treatmentPlan: mayFilter } });
        await tx.treatmentPlanItem.deleteMany({ where: { treatmentPlan: mayFilter } });
        await tx.treatmentPlan.deleteMany({ where: mayFilter });
        await tx.birthRecord.deleteMany({ where: { medicalRecord: mayFilter } });
      }

      await tx.medicalRecord.deleteMany({ where: mayClinicFilter });

      // 3. Registration & Operational (Hapus antrean MEI)
      await tx.queueNumber.deleteMany({ where: mayClinicFilter });
      await tx.registration.deleteMany({ where: mayClinicFilter });
      await tx.appointmentService.deleteMany({ where: parentFilter('appointment') });
      await tx.appointment.deleteMany({ where: mayClinicFilter });

      // 4. POS (Hapus penjualan bebas MEI)
      await tx.directMedicinePurchaseItem.deleteMany({ where: parentFilter('directMedicinePurchase') });
      await tx.directMedicinePurchase.deleteMany({ where: mayClinicFilter });

      // NOTE: We intentionally DO NOT delete InventoryStock, InventoryMutation, InventoryBatch, Procurement, etc.
      // This preserves all stock levels and their source of truth!
    });

    return res.status(200).json({ 
      message: clinicId 
        ? 'Data transaksi bulan Mei untuk klinik ini berhasil direset. Stok Obat AMAN.' 
        : 'Seluruh data transaksi bulan Mei untuk semua cabang berhasil direset. Stok Obat AMAN.' 
    });
  } catch (error: any) {
    console.error('Reset May Error:', error);
    return res.status(500).json({ message: 'Gagal melakukan reset transaksi Mei: ' + error.message });
  }
};

export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.rolePermission.findMany();
    return res.status(200).json(permissions);
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal memuat konfigurasi hak akses: ' + error.message });
  }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;
    // permissions is expected to be an array of objects: { role: Role, module: string, canAccess: boolean }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Format data tidak valid' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Identify roles and modules being updated
      const rolesToUpdate = Array.from(new Set(permissions.map((p: any) => p.role)))
      const modulesToUpdate = Array.from(new Set(permissions.map((p: any) => p.module)))

      // 2. Clear existing records for this role-module set to avoid conflicts
      await tx.rolePermission.deleteMany({
        where: {
          role: { in: rolesToUpdate as any },
          module: { in: modulesToUpdate }
        }
      })

      // 3. Bulk insert new permissions
      await tx.rolePermission.createMany({
        data: permissions.map((p: any) => ({
          role: p.role,
          module: p.module,
          canAccess: p.canAccess
        }))
      })
    });

    return res.status(200).json({ message: 'Konfigurasi hak akses berhasil disimpan' });
  } catch (error: any) {
    console.error('Update Role Permissions Error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan konfigurasi: ' + error.message });
  }
};
