import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Memulai Pembersihan Saldo Awal COA ---')
  
  try {
    const result = await prisma.chartOfAccount.updateMany({
      data: {
        openingBalance: 0
      }
    })
    
    console.log(`Berhasil mereset ${result.count} akun. Semua openingBalance sekarang bernilai 0.`)
    console.log('Sekarang laporan hanya akan menggunakan mutasi dari Jurnal Buku Besar.')
  } catch (error) {
    console.error('Gagal mereset saldo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
