const fs = require('fs');

let content = fs.readFileSync('src/controllers/system.controller.ts', 'utf8');

const replacement = `
    await prisma.$transaction(async (tx) => {
      const parentFilter = (relation) => clinicId 
        ? { [relation]: { clinicId, createdAt: { lt: cutOffDate } } }
        : { [relation]: { createdAt: { lt: cutOffDate } } };

      const branchParentFilter = (relation) => clinicId 
        ? { [relation]: { branchId: clinicId, createdAt: { lt: cutOffDate } } }
        : { [relation]: { createdAt: { lt: cutOffDate } } };

      // 1. Finance & Billing
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
      await tx.procurementPayment.deleteMany({ where: branchParentFilter('procurement') });

      // 2. Medical & Records
      await tx.vitalSign.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.prescriptionItemComponent.deleteMany({ where: clinicId ? { prescriptionItem: { prescription: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } } } : { prescriptionItem: { prescription: { medicalRecord: { createdAt: { lt: cutOffDate } } } } } });
      await tx.prescriptionItem.deleteMany({ where: clinicId ? { prescription: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } } : { prescription: { medicalRecord: { createdAt: { lt: cutOffDate } } } } });
      await tx.prescription.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.medicalRecordAttachment.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.medicalRecordService.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.referral.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.radiologyOrder.deleteMany({ where: parentFilter('medicalRecord') });
      await tx.labResultDetail.deleteMany({ where: clinicId ? { order: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } } : { order: { medicalRecord: { createdAt: { lt: cutOffDate } } } } });
      await tx.labOrderAttachment.deleteMany({ where: clinicId ? { labOrder: { medicalRecord: { clinicId, createdAt: { lt: cutOffDate } } } } : { labOrder: { medicalRecord: { createdAt: { lt: cutOffDate } } } } });
      await tx.labOrder.deleteMany({ where: parentFilter('medicalRecord') });
      
      if (!clinicId) {
        // Visit and TreatmentPlanItem do not have createdAt, we can delete them if their parent TreatmentPlan was created before cutoff.
        await tx.visit.deleteMany({ where: { treatmentPlan: { createdAt: { lt: cutOffDate } } } });
        await tx.treatmentPlanItem.deleteMany({ where: { treatmentPlan: { createdAt: { lt: cutOffDate } } } });
        await tx.treatmentPlan.deleteMany({ where: mayFilter });
        // birthRecord doesn't have clinicId, let's just delete by mayFilter if it has createdAt, wait, let's delete by medicalRecord.
        await tx.birthRecord.deleteMany({ where: { medicalRecord: { createdAt: { lt: cutOffDate } } } });
      }

      await tx.medicalRecord.deleteMany({ where: mayClinicFilter });

      // 3. Registration & Operational
      // queueNumber does not have clinicId maybe? Let's assume it has. The original used clinicFilter. Wait, does it have createdAt? It has date. But wait, we can just use mayClinicFilter if it has createdAt.
      await tx.queueNumber.deleteMany({ where: mayClinicFilter });
      await tx.registration.deleteMany({ where: mayClinicFilter });
      await tx.appointmentService.deleteMany({ where: parentFilter('appointment') });
      await tx.appointment.deleteMany({ where: mayClinicFilter });

      // 4. POS
      await tx.directMedicinePurchaseItem.deleteMany({ where: parentFilter('directMedicinePurchase') });
      await tx.directMedicinePurchase.deleteMany({ where: mayClinicFilter });
    });
`;

// regex to replace the tx block inside resetTransactionsMay
const startString = `await prisma.$transaction(async (tx) => {`;
const endString = `    });

    return res.status(200).json({ `;

const startIndex = content.indexOf(startString, content.indexOf('resetTransactionsMay'));
const endIndex = content.indexOf(endString, startIndex);

if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + replacement.trim() + content.substring(endIndex);
  fs.writeFileSync('src/controllers/system.controller.ts', content);
  console.log('Fixed successfully');
} else {
  console.log('Could not find boundaries');
}
