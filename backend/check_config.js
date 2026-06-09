const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
  try {
    const threshold = await prisma.siteSetting.findFirst({
      where: { key: 'volume_bonus_threshold' }
    });
    
    const fee = await prisma.siteSetting.findFirst({
      where: { key: 'volume_bonus_fee' }
    });
    
    console.log(`\n==========================================`);
    console.log(`Saat ini pengaturan di database adalah:`);
    console.log(`Threshold Pasien: ${threshold ? threshold.value : 'Belum di-set (menggunakan default sistem: 4)'}`);
    console.log(`Nominal Fee: ${fee ? fee.value : 'Belum di-set (menggunakan default sistem: 8750)'}`);
    console.log(`==========================================\n`);
  } catch (err) {
    console.error("Gagal query ke DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
