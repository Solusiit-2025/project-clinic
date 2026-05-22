/**
 * Seed Script: Contra-Revenue COA for Doctor Fee Sharing (Opsi C)
 * 
 * Akuntansi: Klinik & Dokter model SHARING PROFIT (bukan hubungan kerja)
 * Solusi:    Gunakan akun Kontra-Pendapatan (4-0xxx) bukan Beban (6-1xxx)
 * 
 * Struktur COA Baru:
 *   4-0000  Pengurang Pendapatan           [HEADER]
 *   4-0101  Bagian Jasa Dokter             [DETAIL, global]
 *   4-0101-K001  Bagian Jasa Dokter - K001 [DETAIL, per-klinik]
 *   4-0101-K002  Bagian Jasa Dokter - K002 [DETAIL, per-klinik]
 *
 * Jurnal Posting (setelah implementasi):
 *   Dr.  4-0101  Bagian Jasa Dokter    Rp. X  ← Kontra-Pendapatan (mengurangi Revenue)
 *   Cr.  2-1102  Hutang Jasa Medik     Rp. X
 *
 * Run: npx ts-node prisma/seed-contra-revenue-coa.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 [Contra-Revenue Seed] Memulai seed akun 4-0000 Pengurang Pendapatan...')

  // 1. Fetch all active clinics to create per-clinic accounts
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, code: true, name: true }
  })

  console.log(`   Found ${clinics.length} active clinic(s): ${clinics.map(c => c.code).join(', ')}`)

  // 2. Create Header Account: 4-0000 (Global, no clinicId)
  const header = await prisma.chartOfAccount.upsert({
    where: { code: '4-0000' },
    update: { name: 'Pengurang Pendapatan', isActive: true },
    create: {
      code: '4-0000',
      name: 'Pengurang Pendapatan',
      category: 'REVENUE',
      accountType: 'HEADER',
      clinicId: null, // Global header
      openingBalance: 0,
      isActive: true,
    }
  })
  console.log(`   ✅ Header: ${header.code} - ${header.name}`)

  // 3. Create Global Detail Account: 4-0101 (Bagian Jasa Dokter - Fallback)
  const globalDetail = await prisma.chartOfAccount.upsert({
    where: { code: '4-0101' },
    update: { name: 'Bagian Jasa Dokter (Profit Sharing)', parentId: header.id, isActive: true },
    create: {
      code: '4-0101',
      name: 'Bagian Jasa Dokter (Profit Sharing)',
      category: 'REVENUE',
      accountType: 'DETAIL',
      parentId: header.id,
      clinicId: null, // Global fallback
      openingBalance: 0,
      isActive: true,
    }
  })
  console.log(`   ✅ Global Detail: ${globalDetail.code} - ${globalDetail.name}`)

  // 4. Create Per-Clinic Detail Accounts: 4-0101-K001, 4-0101-K002, etc.
  for (const clinic of clinics) {
    const clinicCode = `4-0101-${clinic.code}`
    const clinicAccount = await prisma.chartOfAccount.upsert({
      where: { code: clinicCode },
      update: {
        name: `Bagian Jasa Dokter - ${clinic.code}`,
        parentId: header.id,
        clinicId: clinic.id,
        isActive: true
      },
      create: {
        code: clinicCode,
        name: `Bagian Jasa Dokter - ${clinic.code}`,
        category: 'REVENUE',
        accountType: 'DETAIL',
        parentId: header.id,
        clinicId: clinic.id,
        openingBalance: 0,
        isActive: true,
      }
    })
    console.log(`   ✅ Clinic Detail: ${clinicAccount.code} - ${clinicAccount.name} (${clinic.name})`)
  }

  // 5. Update System Account DOCTOR_FEE_EXPENSE → point to 4-0101 per clinic
  //    This is optional here - the system will auto-resolve via resolveSpecificCoa()
  //    But we log current state for awareness
  const currentDoctorFeeExpenseAccounts = await prisma.systemAccount.findMany({
    where: { key: 'DOCTOR_FEE_EXPENSE' },
    include: { coa: { select: { code: true, name: true } }, clinic: { select: { code: true } } }
  })

  if (currentDoctorFeeExpenseAccounts.length > 0) {
    console.log('\n   📋 Current DOCTOR_FEE_EXPENSE System Accounts:')
    for (const sa of currentDoctorFeeExpenseAccounts) {
      console.log(`      [${sa.clinic?.code || 'GLOBAL'}] → ${sa.coa.code} - ${sa.coa.name}`)
    }
    console.log('\n   ⚠️  PENTING: Update System Account DOCTOR_FEE_EXPENSE ke akun 4-0101-KXxx')
    console.log('      Caranya: Admin → Master → System Accounts → DOCTOR_FEE_EXPENSE → pilih 4-0101-KXxx')
  } else {
    // Auto-update: map DOCTOR_FEE_EXPENSE ke 4-0101 global jika belum ada
    console.log('\n   ℹ️  Tidak ada System Account DOCTOR_FEE_EXPENSE. Auto-mapping ke 4-0101...')
    
    await prisma.systemAccount.upsert({
      where: { key_clinicId: { key: 'DOCTOR_FEE_EXPENSE', clinicId: null as any } },
      update: { coaId: globalDetail.id, name: 'Bagian Jasa Dokter (Profit Sharing)' },
      create: {
        key: 'DOCTOR_FEE_EXPENSE',
        name: 'Bagian Jasa Dokter (Profit Sharing)',
        coaId: globalDetail.id,
        clinicId: null,
      }
    }).catch(() => {
      // Skip if unique constraint fails - means it exists with different structure
    })
  }

  // 6. Summary
  console.log('\n✅ [Contra-Revenue Seed] SELESAI!')
  console.log('\n📊 Ringkasan akun yang dibuat/diperbarui:')
  console.log('   4-0000  Pengurang Pendapatan                  [HEADER, REVENUE]')
  console.log('   4-0101  Bagian Jasa Dokter (Profit Sharing)   [DETAIL, REVENUE, Global]')
  for (const clinic of clinics) {
    console.log(`   4-0101-${clinic.code}  Bagian Jasa Dokter - ${clinic.code}  [DETAIL, REVENUE, ${clinic.name}]`)
  }
  console.log('\n📝 Langkah Selanjutnya (Manual):')
  console.log('   1. Buka Admin → Master → System Accounts')
  console.log('   2. Edit "DOCTOR_FEE_EXPENSE" → pilih akun 4-0101-KXxx (per klinik)')
  console.log('   3. Transaksi baru akan menggunakan akun 4-0101 sebagai Kontra-Pendapatan')
  console.log('   4. Laporan L/R akan otomatis menampilkan bagian dokter sebagai Pengurang Pendapatan')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
