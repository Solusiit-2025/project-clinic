import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const coa4_0101_k001 = await prisma.chartOfAccount.findFirst({ where: { code: '4-0101-K001' } })
  const coa4_0101 = await prisma.chartOfAccount.findFirst({ where: { code: '4-0101' } })
  const target = coa4_0101_k001 || coa4_0101

  if (!target) { 
    console.log('❌ Akun 4-0101 tidak ditemukan! Jalankan seed-contra-revenue-coa.ts terlebih dahulu.')
    return 
  }

  const existing = await prisma.systemAccount.findMany({ 
    where: { key: 'DOCTOR_FEE_EXPENSE' }, 
    include: { coa: { select: { code: true, name: true } }, clinic: { select: { code: true } } } 
  })

  console.log('📋 Current DOCTOR_FEE_EXPENSE System Accounts:')
  for (const sa of existing) {
    console.log(`   [${sa.clinic?.code || 'GLOBAL'}] ${sa.coa.code} - ${sa.coa.name}`)
  }

  const targetCoa = coa4_0101_k001 || target
  console.log(`\n🔄 Updating → ${targetCoa.code} - ${targetCoa.name}...`)

  for (const sa of existing) {
    await prisma.systemAccount.update({
      where: { id: sa.id },
      data: { 
        coaId: targetCoa.id, 
        name: 'Bagian Jasa Dokter (Profit Sharing)' 
      }
    })
    console.log(`   ✅ [${sa.clinic?.code || 'GLOBAL'}] → ${targetCoa.code}`)
  }

  console.log('\n✅ System Account DOCTOR_FEE_EXPENSE berhasil diupdate ke akun 4-0101-K001!')
  console.log('   Transaksi BARU akan menggunakan akun 4-0101 (Contra-Revenue)')
  console.log('   Transaksi LAMA (6-1102) tetap ada, tapi di Laporan L/R dipindah ke Pengurang Pendapatan')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
