import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dental service categories...')
  const categories = [
    { name: 'Konservasi (Penambalan Gigi) - BASIC', desc: 'Penambalan Gigi dasar' },
    { name: 'Konservasi (Penambalan Gigi) - GIC & KOMPOSIT', desc: 'Penambalan Gigi menggunakan GIC & Komposit' },
    { name: 'Konservasi (Perawatan Saluran Akar)', desc: 'Perawatan Saluran Akar (PSA)' },
    { name: 'Konservasi (Estetik)', desc: 'Perawatan gigi estetik' },
    { name: 'Oral Surgery (Bedah Mulut)', desc: 'Bedah mulut minor' },
    { name: 'Periodontia (Jaringan Penyangga Gigi)', desc: 'Perawatan gusi dan jaringan penyangga gigi' },
    { name: 'Prosthodontia (Gigi Palsu)', desc: 'Pembuatan dan pemasangan gigi palsu' },
    { name: 'Orthodontic (Braces / Kawat Gigi)', desc: 'Perawatan kawat gigi' }
  ]

  for (const cat of categories) {
    const res = await prisma.serviceCategory.upsert({
      where: { categoryName: cat.name },
      update: { description: cat.desc },
      create: { categoryName: cat.name, description: cat.desc }
    })
    console.log(`Upserted: ${res.categoryName}`)
  }

  console.log('Finished seeding dental service categories!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
