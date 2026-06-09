import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Let's find all clinics
  const clinics = await prisma.clinic.findMany();
  
  for (const clinic of clinics) {
    const clinicId = clinic.id;
    console.log(`\n\n=== REKONSILIASI KLINIK: ${clinic.name} ===`);
    
    // 1. Hitung total nilai di Data Stock (InventoryStock)
    const stocks = await prisma.inventoryStock.findMany({
      where: { branchId: clinicId, onHandQty: { gt: 0 } },
      include: {
        product: { select: { purchasePrice: true } },
        batch: { select: { purchasePrice: true } }
      }
    });

    let totalStockValue = 0;
    for (const s of stocks) {
      const unitCost = s.batch?.purchasePrice ?? s.product?.purchasePrice ?? 0;
      totalStockValue += s.onHandQty * unitCost;
    }

    // 2. Hitung total saldo di COA 1-1301 (Persediaan Obat-obatan)
    const coaList = await prisma.chartOfAccount.findMany({
      where: { code: { startsWith: '1-1301' }, OR: [{ clinicId }, { clinicId: null }] }
    });

    let totalCoaValue = 0;
    
    for (const coa of coaList) {
      const journals = await prisma.journalDetail.findMany({
        where: { coaId: coa.id }
      });

      for (const j of journals) {
        totalCoaValue += Number(j.debit) - Number(j.credit);
      }
    }

    console.log(`Total Nilai Data Stock: Rp ${totalStockValue.toLocaleString('id-ID')}`);
    console.log(`Total Saldo COA Persediaan: Rp ${totalCoaValue.toLocaleString('id-ID')}`);

    const difference = totalStockValue - totalCoaValue;

    if (difference === 0) {
      console.log('SUDAH SINKRON 100%!');
      continue;
    }

    console.log(`Selisih: Rp ${difference.toLocaleString('id-ID')}`);
    console.log('Membuat Jurnal Penyesuaian secara otomatis...');

    let equityAcc = await prisma.chartOfAccount.findFirst({
      where: { code: { startsWith: '3-' }, clinicId }
    });
    if (!equityAcc) {
      equityAcc = await prisma.chartOfAccount.findFirst({
        where: { code: { startsWith: '5-' }, clinicId }
      });
    }

    if (!equityAcc) {
      console.error('Akun Penyeimbang (3-1001 atau 5-1101) tidak ditemukan');
      continue;
    }

    const primaryCoa = coaList.find(c => c.code.startsWith('1-1301')) || coaList[0];
    if (!primaryCoa) {
      console.error('Tidak ada COA persediaan');
      continue;
    }

    let debitId, creditId;
    if (difference > 0) {
      // COA kurang dari Stock -> Tambah COA (Debit Persediaan)
      debitId = primaryCoa.id;
      creditId = equityAcc.id;
    } else {
      // COA lebih besar dari Stock -> Kurangi COA (Kredit Persediaan)
      debitId = equityAcc.id;
      creditId = primaryCoa.id;
    }

    await prisma.journalEntry.create({
      data: {
        date: new Date(),
        description: `Rekonsiliasi Otomatis: Penyesuaian Nilai Data Stock vs COA`,
        referenceNo: `REC-${Date.now().toString().slice(-6)}`,
        entryType: 'SYSTEM',
        clinicId,
        details: {
          create: [
            {
              coaId: debitId,
              debit: Math.abs(difference),
              credit: 0,
              description: `Penyesuaian Nilai Persediaan`
            },
            {
              coaId: creditId,
              debit: 0,
              credit: Math.abs(difference),
              description: `Penyesuaian Nilai Persediaan`
            }
          ]
        }
      }
    });

    console.log('Jurnal Penyesuaian Berhasil Dibuat. Sekarang harusnya sinkron 100%!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
