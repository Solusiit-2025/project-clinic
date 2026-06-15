import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Membatalkan pembayaran Jasa Medik untuk drg. Widya (PAY-622397)...");

  // 1. Find the Journal Entry
  const journalEntry = await prisma.journalEntry.findFirst({
    where: { 
      referenceNo: 'PAY-622397',
      description: { contains: 'drg. Widya' }
    }
  });

  if (journalEntry) {
    console.log(`Ditemukan Journal Entry: ${journalEntry.id}`);
    
    // Delete Details
    await prisma.journalDetail.deleteMany({
      where: { journalEntryId: journalEntry.id }
    });
    
    // Delete Entry
    await prisma.journalEntry.delete({
      where: { id: journalEntry.id }
    });
    console.log(`✅ Journal Entry PAY-622397 berhasil dihapus.`);
  } else {
    console.log("❌ Journal Entry PAY-622397 tidak ditemukan.");
  }

  // 2. Revert Doctor Commissions
  const drgWidya = await prisma.doctor.findFirst({
    where: { name: { contains: 'Widya' } }
  });

  if (drgWidya) {
    // Find commissions paid on 2026-06-15
    const targetDateStr = '2026-06-15';
    
    // In SQLite or MySQL, date comparisons can be tricky, so let's find all paid commissions and filter in memory if needed,
    // or just update where paidAt >= '2026-06-15 00:00:00' and paidAt < '2026-06-16 00:00:00'
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);
    
    // Update them back to 'unpaid'
    const updated = await prisma.doctorCommission.updateMany({
      where: {
        doctorId: drgWidya.id,
        status: 'paid',
        paidAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      data: {
        status: 'unpaid',
        paidAt: null
      }
    });

    console.log(`✅ Berhasil mengembalikan ${updated.count} komisi drg. Widya menjadi 'unpaid'.`);
  } else {
    console.log("❌ Dokter drg. Widya tidak ditemukan.");
  }

  console.log("Selesai memproses pembatalan pembayaran.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
