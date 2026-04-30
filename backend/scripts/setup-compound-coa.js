const { PrismaClient, AccountCategory, AccountType } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupCompoundCOA() {
  console.log('--- Setting up Compound Assembly COA & System Accounts ---');
  
  // 1. Ambil klinik (Bekasi)
  const clinic = await prisma.clinic.findFirst({ where: { name: { contains: 'Bekasi' } } });
  if (!clinic) {
    console.error('Klinik Bekasi tidak ditemukan!');
    return;
  }
  const clinicId = clinic.id;
  const suffix = '-K002'; // Sesuai data yang ada

  // 2. Ambil Parent Header (PENDAPATAN MEDIS)
  const revenueHeader = await prisma.chartOfAccount.findFirst({
    where: { code: '4-1000' }
  });
  
  if (!revenueHeader) {
    console.error('Header PENDAPATAN MEDIS (4-1000) tidak ditemukan!');
    return;
  }

  // 3. Create COA: Pendapatan Jasa Racik / Tuslah
  const tuslahCode = `4-1302${suffix}`;
  let tuslahCOA = await prisma.chartOfAccount.findFirst({
    where: { OR: [{ code: tuslahCode }, { name: { contains: 'Jasa Racik' }, clinicId }] }
  });

  if (!tuslahCOA) {
    tuslahCOA = await prisma.chartOfAccount.create({
      data: {
        code: tuslahCode,
        name: `Pendapatan Jasa Racik / Tuslah - Bekasi`,
        category: AccountCategory.REVENUE,
        accountType: AccountType.DETAIL,
        parentId: revenueHeader.id,
        clinicId: clinicId,
        isActive: true
      }
    });
    console.log(`COA Baru Dibuat: ${tuslahCOA.name} (${tuslahCOA.code})`);
  } else {
    console.log(`COA Sudah Ada: ${tuslahCOA.name} (${tuslahCOA.code})`);
  }

  // 4. Update/Create System Account: COMPOUND_SERVICE_REVENUE
  const systemKey = 'COMPOUND_SERVICE_REVENUE';
  const sysAcc = await prisma.systemAccount.upsert({
    where: { 
      key_clinicId: { key: systemKey, clinicId: clinicId } 
    },
    update: { coaId: tuslahCOA.id },
    create: {
      key: systemKey,
      name: 'Pendapatan Jasa Racik / Tuslah',
      coaId: tuslahCOA.id,
      clinicId: clinicId
    }
  });
  console.log(`System Account '${systemKey}' berhasil dipetakan ke ${tuslahCOA.name}`);

  // 5. Ensure INVENTORY_ACCOUNT is correct
  const invCOA = await prisma.chartOfAccount.findFirst({
    where: { code: `1-1301${suffix}`, clinicId }
  });
  
  if (invCOA) {
    await prisma.systemAccount.upsert({
      where: { key_clinicId: { key: 'INVENTORY_ACCOUNT', clinicId } },
      update: { coaId: invCOA.id },
      create: {
        key: 'INVENTORY_ACCOUNT',
        name: 'Persediaan Obat-obatan',
        coaId: invCOA.id,
        clinicId
      }
    });
    console.log(`System Account 'INVENTORY_ACCOUNT' dipastikan ke ${invCOA.name}`);
  }

  console.log('--- Setup Selesai ---');
  await prisma.$disconnect();
}

setupCompoundCOA();
