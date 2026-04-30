const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTuslahMapping() {
  console.log('--- Fixing Tuslah Revenue Mapping to Pusat Account ---');
  
  // 1. Ambil COA Pusat (4-1302-K001)
  const pusatCOA = await prisma.chartOfAccount.findFirst({
    where: { code: '4-1302-K001' }
  });

  if (!pusatCOA) {
    console.error('Akun 4-1302-K001 (Pusat) tidak ditemukan!');
    return;
  }

  // 2. Update SEMUA SystemAccount COMPOUND_SERVICE_REVENUE agar menunjuk ke Pusat
  const updated = await prisma.systemAccount.updateMany({
    where: { key: 'COMPOUND_SERVICE_REVENUE' },
    data: { coaId: pusatCOA.id }
  });

  console.log(`Berhasil memperbarui ${updated.count} pemetaan sistem ke akun Pusat: ${pusatCOA.name}`);

  // 3. Jika belum ada untuk klinik tertentu, buatkan (Opsional, tapi bagus untuk konsistensi)
  const clinics = await prisma.clinic.findMany();
  for (const clinic of clinics) {
    await prisma.systemAccount.upsert({
      where: { key_clinicId: { key: 'COMPOUND_SERVICE_REVENUE', clinicId: clinic.id } },
      update: { coaId: pusatCOA.id },
      create: {
        key: 'COMPOUND_SERVICE_REVENUE',
        name: 'Pendapatan Jasa Racik / Tuslah',
        coaId: pusatCOA.id,
        clinicId: clinic.id
      }
    });
  }

  console.log('Semua klinik sekarang memetakan Tuslah ke akun Pusat.');
  await prisma.$disconnect();
}

fixTuslahMapping();
