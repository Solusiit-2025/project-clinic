import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const labData = [
    // HEMATOLOGI
    { code: 'HEM-01', name: 'Hemoglobin', category: 'HEMATOLOGI', normalRangeText: '(L = 13 - 16) (P = 12 - 14)' },
    { code: 'HEM-02', name: 'Hematokrit', category: 'HEMATOLOGI', normalRangeText: '(L = 40 - 48) (P = 36 - 44)' },
    { code: 'HEM-03', name: 'Leukosit', category: 'HEMATOLOGI', normalRangeText: '(4.000 - 10.000)' },
    { code: 'HEM-04', name: 'Trombosit', category: 'HEMATOLOGI', normalRangeText: '(150.000 - 450.000)' },
    { code: 'HEM-05', name: 'Eritrosit', category: 'HEMATOLOGI', normalRangeText: '(L = 4,4 - 5,9) (P = 3,8 - 5,2)' },
    { code: 'HEM-06', name: 'LED', category: 'HEMATOLOGI', normalRangeText: '(L = <10) (P = <15)' },
    { code: 'HEM-07', name: 'MCV', category: 'HEMATOLOGI', normalRangeText: '(80 - 100)' },
    { code: 'HEM-08', name: 'MCH', category: 'HEMATOLOGI', normalRangeText: '(26 - 34)' },
    { code: 'HEM-09', name: 'MCHC', category: 'HEMATOLOGI', normalRangeText: '(32 - 36)' },
    { code: 'HEM-10', name: 'Hitung Jenis Leukosit - Basofil', category: 'HEMATOLOGI', normalRangeText: '0 - 1' },
    { code: 'HEM-11', name: 'Hitung Jenis Leukosit - Eosinofil', category: 'HEMATOLOGI', normalRangeText: '0 - 3' },
    { code: 'HEM-12', name: 'Hitung Jenis Leukosit - Batang', category: 'HEMATOLOGI', normalRangeText: '2 - 6' },
    { code: 'HEM-13', name: 'Hitung Jenis Leukosit - Segmen', category: 'HEMATOLOGI', normalRangeText: '50 - 70' },
    { code: 'HEM-14', name: 'Hitung Jenis Leukosit - Limfosit', category: 'HEMATOLOGI', normalRangeText: '20 - 40' },
    { code: 'HEM-15', name: 'Hitung Jenis Leukosit - Monosit', category: 'HEMATOLOGI', normalRangeText: '2 - 8' },
    { code: 'HEM-16', name: 'Masa Pendarahan', category: 'HEMATOLOGI', normalRangeText: '(2 - 6 menit)' },
    { code: 'HEM-17', name: 'Masa Pembekuan', category: 'HEMATOLOGI', normalRangeText: '(5 - 15 menit)' },

    // KIMIA DARAH
    // Lemak
    { code: 'KIM-01', name: 'Kolesterol Total', category: 'KIMIA DARAH', normalRangeText: '(< 200)' },
    { code: 'KIM-02', name: 'HDL Kolesterol', category: 'KIMIA DARAH', normalRangeText: '(> 50)' },
    { code: 'KIM-03', name: 'LDL Kolesterol', category: 'KIMIA DARAH', normalRangeText: '(< 100)' },
    { code: 'KIM-04', name: 'Trigliserida', category: 'KIMIA DARAH', normalRangeText: '(< 150)' },
    // Karbohidrat
    { code: 'KIM-05', name: 'Glukosa Puasa', category: 'KIMIA DARAH', normalRangeText: '(70 - 110)' },
    { code: 'KIM-06', name: 'Glukosa 2pp', category: 'KIMIA DARAH', normalRangeText: '(70 - 140)' },
    { code: 'KIM-07', name: 'Glukosa Sewaktu', category: 'KIMIA DARAH', normalRangeText: '(70 - 200)' },
    // Faal Hati
    { code: 'KIM-08', name: 'SGOT', category: 'KIMIA DARAH', normalRangeText: '(< 37)' },
    { code: 'KIM-09', name: 'SGPT', category: 'KIMIA DARAH', normalRangeText: '(< 40)' },
    // Faal Ginjal
    { code: 'KIM-10', name: 'Asam Urat', category: 'KIMIA DARAH', normalRangeText: '(L = 3,4 - 6,7) (P = 2,5 - 5,7)' },
    { code: 'KIM-11', name: 'Ureum', category: 'KIMIA DARAH', normalRangeText: '(15 - 40)' },
    { code: 'KIM-12', name: 'Creatinin', category: 'KIMIA DARAH', normalRangeText: '(L = 0,70 - 1,30) (P = 0,50 - 1,20)' },

    // SEROLOGI
    { code: 'SER-01', name: 'Widal O', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-02', name: 'Widal H', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-03', name: 'S. Typhi', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-04', name: 'S. Parathypi A', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-05', name: 'S. Parathypi B', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-06', name: 'S. Parathypi C', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-07', name: 'HBsAg', category: 'SEROLOGI', normalRangeText: '(Non Reaktif)' },
    { code: 'SER-08', name: 'HCG', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-09', name: 'Golongan Darah', category: 'SEROLOGI', normalRangeText: '' },
    { code: 'SER-10', name: 'Rhesus', category: 'SEROLOGI', normalRangeText: '' },

    // URINALISA - Makroskopis
    { code: 'URI-01', name: 'Warna', category: 'URINALISA', normalRangeText: '(Kuning)' },
    { code: 'URI-02', name: 'Kejernihan', category: 'URINALISA', normalRangeText: '(Jernih)' },
    { code: 'URI-03', name: 'Berat Jenis', category: 'URINALISA', normalRangeText: '(1.005 - 1.025)' },
    { code: 'URI-04', name: 'Ph', category: 'URINALISA', normalRangeText: '(4,8 - 7,4)' },
    { code: 'URI-05', name: 'Protein', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-06', name: 'Glukosa', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-07', name: 'Keton', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-08', name: 'Bilirubin', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-09', name: 'Urobilinogen', category: 'URINALISA', normalRangeText: '(0,2 - 1,0)' },
    { code: 'URI-10', name: 'Darah Samar (Blood)', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-11', name: 'Nitrit', category: 'URINALISA', normalRangeText: '(Negatif)' },
    { code: 'URI-12', name: 'Leukosit Esterase', category: 'URINALISA', normalRangeText: '(Negatif)' },

    // URINALISA - Mikroskopis
    { code: 'URI-13', name: 'Leukosit (Mikroskopis)', category: 'URINALISA', normalRangeText: '(1 - 4)' },
    { code: 'URI-14', name: 'Eritrosit (Mikroskopis)', category: 'URINALISA', normalRangeText: '(0 - 1)' },
    { code: 'URI-15', name: 'Epitel', category: 'URINALISA', normalRangeText: '(< 5)' },
    { code: 'URI-16', name: 'Silinder', category: 'URINALISA', normalRangeText: '' },
    { code: 'URI-17', name: 'Hyaline', category: 'URINALISA', normalRangeText: '(-)' },
    { code: 'URI-18', name: 'Granula', category: 'URINALISA', normalRangeText: '(-)' },
    { code: 'URI-19', name: 'Kristal', category: 'URINALISA', normalRangeText: '(-)' },
    { code: 'URI-20', name: 'Bakteri', category: 'URINALISA', normalRangeText: '(-)' },
    { code: 'URI-21', name: 'Jamur', category: 'URINALISA', normalRangeText: '(-)' },
    { code: 'URI-22', name: 'Dll', category: 'URINALISA', normalRangeText: '(-)' },
  ]

  for (const item of labData) {
    const exists = await prisma.labTestMaster.findFirst({
      where: {
        OR: [
          { code: item.code },
          { name: item.name }
        ]
      }
    })

    if (exists) {
      await prisma.labTestMaster.update({
        where: { id: exists.id },
        data: {
          code: item.code, // in case we found by name
          name: item.name,
          category: item.category,
          normalRangeText: item.normalRangeText,
          price: exists.price > 0 ? exists.price : 0
        }
      })
      console.log(`Updated: ${item.name}`)
    } else {
      await prisma.labTestMaster.create({
        data: {
          code: item.code,
          name: item.name,
          category: item.category,
          normalRangeText: item.normalRangeText,
          price: 0,
          isActive: true
        }
      })
      console.log(`Created: ${item.name}`)
    }
  }

  console.log('Lab Master sync completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
