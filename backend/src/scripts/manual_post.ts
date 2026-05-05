import { prisma } from '../lib/prisma';

async function main() {
  const invoiceNo = 'INV-20260505-0002';
  
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNo },
    include: { items: { include: { service: { include: { serviceCategory: true, coa: true } } } } }
  });

  if (!invoice) throw new Error('Invoice not found');

  const targetClinicId = invoice.clinicId;
  const sysAccountKeys = ['CASH_ACCOUNT', 'BANK_ACCOUNT', 'ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', 'SERVICE_REVENUE', 'SALES_DISCOUNT'];
  const sysAccounts = await prisma.systemAccount.findMany({
      where: { key: { in: sysAccountKeys }, OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
      include: { coa: true },
      orderBy: { clinicId: 'desc' }
  });
  const getSysAcc = (key: string) => sysAccounts.find(s => s.key === key);

  const codesToFind = ['4-1101', '4-1102', '4-1201', '4-1301', '4-1401', '4-1501', '4-1199'];
  const coaAccounts = await prisma.chartOfAccount.findMany({
      where: { code: { in: codesToFind }, OR: [{ clinicId: targetClinicId }, { clinicId: null }] }
  });
  const getCoaByCode = (code: string) => coaAccounts.find(a => a.code === code);

  const revenueMap = new Map<string, { amount: number; coaName: string }>();
  for (const item of invoice.items) {
      const sName = (item.service?.serviceName || '').trim().toLowerCase();
      const cName = (item.service?.serviceCategory?.categoryName || '').trim().toLowerCase();
      const salesRevSys = getSysAcc('SALES_REVENUE');
      const serviceRevSys = getSysAcc('SERVICE_REVENUE');
      let targetCoa: any = null;

      if (item.service?.coaId) targetCoa = item.service.coa;
      if (!targetCoa) {
          if (cName.includes('obat') || cName.includes('farmasi') || sName.includes('obat')) targetCoa = salesRevSys?.coa;
          else if (cName.includes('lab') || cName.includes('tindakan') || sName.includes('konsul') || sName.includes('admin')) targetCoa = serviceRevSys?.coa;
      }
      if (!targetCoa) {
          if (sName.includes('obat')) targetCoa = salesRevSys?.coa || getCoaByCode('4-1301');
          else if (sName.includes('pendaftaran') || sName.includes('admin') || sName.includes('kartu')) targetCoa = getCoaByCode('4-1501');
          else if (sName.includes('lab') || sName.includes('diagnostik')) targetCoa = getCoaByCode('4-1401');
          else if (sName.includes('tindakan')) targetCoa = getCoaByCode('4-1201');
      }
      if (!targetCoa) targetCoa = serviceRevSys?.coa || getCoaByCode('4-1101');
      
      const current = revenueMap.get(targetCoa.id) || { amount: 0, coaName: targetCoa.name };
      revenueMap.set(targetCoa.id, { amount: current.amount + (item.subtotal || 0), coaName: current.coaName });
  }

  const arSysAcc = getSysAcc('ACCOUNTS_RECEIVABLE');
  const arAccount = arSysAcc?.coa || await prisma.chartOfAccount.findFirst({ where: { code: '1-1201', OR: [{ clinicId: targetClinicId }, { clinicId: null }] } });
  
  const discountSysAcc = getSysAcc('SALES_DISCOUNT');
  const discountAccount = discountSysAcc?.coa || getCoaByCode('4-1199');

  await prisma.$transaction(async (tx) => {
    await tx.journalEntry.create({
        data: {
            date: invoice.invoiceDate,
            description: `Pengakuan Piutang & Pendapatan - Inv #${invoice.invoiceNo}`,
            referenceNo: invoice.invoiceNo,
            entryType: 'SYSTEM',
            clinicId: targetClinicId!,
            details: {
                create: [
                    { coaId: arAccount!.id, debit: invoice.total, credit: 0, description: `Piutang Pelanggan - Invoice ${invoice.invoiceNo}` },
                    ...(invoice.discount > 0 ? [
                        { coaId: discountAccount?.id || arAccount!.id, debit: invoice.discount, credit: 0, description: `Potongan Harga - Inv ${invoice.invoiceNo}` }
                    ] : []),
                    ...Array.from(revenueMap.entries()).map(([coaId, data]) => ({
                        coaId, debit: 0, credit: data.amount, description: `Pendapatan ${data.coaName} - Inv ${invoice.invoiceNo}`
                    }))
                ]
            }
        }
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { isPosted: true, postedAt: new Date() }
    });
  });

  console.log('Successfully posted Indriyanti invoice to GL');
}

main().catch(console.error).finally(() => prisma.$disconnect());
