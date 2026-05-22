/**
 * ══════════════════════════════════════════════════════════════════════════
 * MIGRASI DATA: Reklasifikasi Jurnal 6-1102* → 4-0101 (Contra-Revenue)
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * TUJUAN:
 *   Memindahkan SEMUA entri jurnal yang menggunakan akun dengan prefix 6-1102
 *   (misal: 6-1102, 6-1102-K001, 6-1102-K002, dst) ke akun 4-0101-K001
 *   (Bagian Jasa Dokter / Contra-Revenue).
 *
 * AKUN SUMBER (semua diproses):
 *   6-1102        Beban Jasa Medik / Doctor Fee Expense
 *   6-1102-K001   Beban Jasa Medis Dokter - Pusat
 *   6-1102-K002   (dan seterusnya jika ada)
 *
 * DAMPAK:
 *   - Akun 6-1102* pada JournalDetail → 4-0101-K001
 *   - Deskripsi diperbarui: "Beban Jasa Medik" → "Bagian Jasa Dokter (Profit Sharing)"
 *   - Tidak ada perubahan NOMINAL (Debit/Credit tetap sama)
 *   - Tidak ada perubahan tanggal / referensi jurnal
 *   - Data AMAN: Saldo neraca tetap balance
 *
 * CARA RUN:
 *   DRY RUN (preview saja):  npx ts-node prisma/migrate-reclassify-doctor-fee.ts
 *   EKSEKUSI:                npx ts-node prisma/migrate-reclassify-doctor-fee.ts --execute
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const isDryRun = !process.argv.includes('--execute')

async function main() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  MIGRASI: Reklasifikasi Jurnal Jasa Medik Dokter')
  console.log(`  MODE: ${isDryRun ? '🔍 DRY RUN (Preview Only — tidak ada perubahan)' : '🔥 EXECUTE (Data akan diubah!)'}`)
  console.log('══════════════════════════════════════════════════════════════\n')

  // 1. Temukan SEMUA akun sumber ber-prefix 6-1102
  const sourceAccounts = await prisma.chartOfAccount.findMany({
    where: { code: { startsWith: '6-1102' } },
    orderBy: { code: 'asc' }
  })

  // Prioritas target: 4-0101-K001, lalu 4-0101 global
  const targetAccount = 
    await prisma.chartOfAccount.findFirst({ where: { code: '4-0101-K001' } }) ||
    await prisma.chartOfAccount.findFirst({ where: { code: '4-0101' } })

  if (sourceAccounts.length === 0) {
    console.log('⚠️  Tidak ada akun dengan prefix 6-1102 di database.')
    console.log('   Kemungkinan sudah dipindahkan atau belum pernah ada.')
    return
  }

  if (!targetAccount) {
    console.log('❌ Akun target 4-0101 tidak ditemukan!')
    console.log('   Jalankan dulu: npx ts-node prisma/seed-contra-revenue-coa.ts')
    return
  }

  console.log(`📋 Akun Sumber (${sourceAccounts.length} akun):`)
  for (const src of sourceAccounts) {
    console.log(`   [${src.code}] ${src.name} (${src.category})`)
  }
  console.log(`📋 Akun Tujuan  : [${targetAccount.code}] ${targetAccount.name} (${targetAccount.category})`)

  // 2. Temukan semua JournalDetail dari SEMUA akun sumber (6-1102*)
  const sourceIds = sourceAccounts.map(s => s.id)
  const sourceCodeMap = new Map(sourceAccounts.map(s => [s.id, s.code]))

  const affectedDetails = await prisma.journalDetail.findMany({
    where: {
      coaId: { in: sourceIds }
    },
    include: {
      journalEntry: {
        select: {
          id: true,
          date: true,
          description: true,
          referenceNo: true,
          entryType: true,
          clinicId: true
        }
      }
    },
    orderBy: {
      journalEntry: { date: 'asc' }
    }
  })

  if (affectedDetails.length === 0) {
    console.log('\n✅ Tidak ada data yang perlu dimigrasikan.')
    console.log('   Semua jurnal sudah bersih atau belum ada transaksi dengan 6-1102.')
    return
  }

  // 3. Hitung total dan tampilkan preview
  const totalDebit = affectedDetails.reduce((sum, d) => sum + d.debit, 0)
  const totalCredit = affectedDetails.reduce((sum, d) => sum + d.credit, 0)

  console.log(`\n📊 Data yang akan dimigrasikan: ${affectedDetails.length} baris jurnal`)
  console.log(`   Total Debit : Rp ${totalDebit.toLocaleString('id-ID')}`)
  console.log(`   Total Credit: Rp ${totalCredit.toLocaleString('id-ID')}`)

  console.log(`\n┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐`)
  console.log(`│ PREVIEW DATA YANG AKAN DIMIGRASIKAN                                                                 │`)
  console.log(`├────────────────┬────────────┬──────────────────┬─────────────────────────────────────┬───────────────┤`)
  console.log(`│ Tanggal        │ Kode Akun  │ Referensi        │ Deskripsi                           │ Nominal (IDR) │`)
  console.log(`├────────────────┼────────────┼──────────────────┼─────────────────────────────────────┼───────────────┤`)

  for (const detail of affectedDetails) {
    const date = new Date(detail.journalEntry.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const srcCode = (sourceCodeMap.get(detail.coaId) || '?').padEnd(10)
    const ref = (detail.journalEntry.referenceNo || '-').substring(0, 16).padEnd(16)
    const desc = (detail.description || detail.journalEntry.description || '-').substring(0, 36).padEnd(36)
    const amount = detail.debit > 0 
      ? detail.debit.toLocaleString('id-ID').padStart(13)
      : `(${detail.credit.toLocaleString('id-ID')})`.padStart(13)
    console.log(`│ ${date} │ ${srcCode} │ ${ref} │ ${desc} │ ${amount} │`)
  }

  console.log(`├────────────────┴────────────┴──────────────────┴─────────────────────────────────────┴───────────────┤`)
  console.log(`│ TOTAL: ${affectedDetails.length} baris  →  Rp ${totalDebit.toLocaleString('id-ID').padStart(25)} │`)
  console.log(`└─────────────────────────────────────────────────────────────────────────────────────────────────────┘`)

  // 4. Eksekusi atau tampilkan instruksi
  if (isDryRun) {
    console.log('\n⚠️  INI HANYA DRY RUN — TIDAK ADA DATA YANG DIUBAH')
    console.log('\n   Untuk mengeksekusi migrasi, jalankan:')
    console.log('   npx ts-node prisma/migrate-reclassify-doctor-fee.ts --execute\n')
    return
  }

  // 5. EKSEKUSI MIGRASI
  console.log('\n🔥 MENGEKSEKUSI MIGRASI...')

  await prisma.$transaction(async (tx) => {
    let successCount = 0

    for (const detail of affectedDetails) {
      // Buat deskripsi baru yang menggantikan "Beban" dengan "Bagian"
      const oldDesc = detail.description || ''
      const newDesc = oldDesc
        .replace(/Beban Jasa Medik Dokter/gi, 'Bagian Jasa Dokter (Profit Sharing)')
        .replace(/Beban Jasa Medik/gi, 'Bagian Jasa Dokter (Profit Sharing)')
        .replace(/Doctor Fee Expense/gi, 'Doctor Fee - Profit Sharing')

      await tx.journalDetail.update({
        where: { id: detail.id },
        data: {
          coaId: targetAccount.id,
          description: newDesc || `Bagian Jasa Dokter (Profit Sharing) - ${detail.journalEntry.referenceNo || ''}`
        }
      })
      successCount++
      process.stdout.write(`   ✅ Migrated ${successCount}/${affectedDetails.length}: ${detail.journalEntry.referenceNo || detail.id.substring(0, 8)}\r`)
    }

    console.log(`\n\n   ✅ Selesai: ${successCount} baris berhasil dimigrasikan`)
  })

  // 5. Verifikasi setelah migrasi
  const remaining = await prisma.journalDetail.count({
    where: { coaId: { in: sourceIds } }
  })
  const migrated = await prisma.journalDetail.count({
    where: { coaId: targetAccount.id }
  })

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  HASIL MIGRASI')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  ✅ Berhasil dimigrasikan ke 4-0101: ${migrated} baris`)
  console.log(`  🔍 Sisa di 6-1102 (jika ada)     : ${remaining} baris`)
  
  if (remaining > 0) {
    console.log('\n  ⚠️  Masih ada data di 6-1102 yang tidak bisa dimigrasikan.')
    console.log('     Kemungkinan dari transaksi lain (bukan invoice dokter).')
  } else {
    console.log('\n  🎉 SEMUA DATA BERHASIL DIMIGRASIKAN!')
    console.log('  Laporan L/R sekarang akan menampilkan akun 4-0101 sebagai Pengurang Pendapatan.')
  }

  console.log('\n  📌 Langkah selanjutnya:')
  console.log('     1. Buka Laporan L/R: http://localhost:3006/admin/finance/reports/profit-loss')
  console.log('     2. Pastikan section "Pengurang Pendapatan" muncul dengan saldo yang benar')
  console.log('     3. Pastikan "Beban Operasional" sudah tidak mengandung jasa dokter')
  console.log('══════════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
