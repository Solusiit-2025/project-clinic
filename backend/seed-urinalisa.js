const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const category = "URINALISA"
  
  // 1. Create main packages
  const urinalisaPackage = await prisma.labTestMaster.create({
    data: {
      code: "LAB-URI-PKG",
      name: "URINALISA LENGKAP",
      category: "PAKET LABORATORIUM",
      price: 150000, // example price
      isActive: true,
    }
  });

  const makroskopisPkg = await prisma.labTestMaster.create({
    data: {
      code: "LAB-URI-MAKRO",
      name: "Makroskopis",
      category: category,
      price: 0,
      isActive: true,
    }
  });

  const mikroskopisPkg = await prisma.labTestMaster.create({
    data: {
      code: "LAB-URI-MIKRO",
      name: "Mikroskopis",
      category: category,
      price: 0,
      isActive: true,
    }
  });

  // Link sub-packages to main package
  await prisma.labTestMaster.update({
    where: { id: urinalisaPackage.id },
    data: {
      children: {
        connect: [{ id: makroskopisPkg.id }, { id: mikroskopisPkg.id }]
      }
    }
  });

  const makroItems = [
    { code: "LAB-URI-WRNA", name: "Warna", normal: "Kuning" },
    { code: "LAB-URI-KJRN", name: "Kejernihan", normal: "Jernih" },
    { code: "LAB-URI-BJ", name: "Berat Jenis", normal: "1.005 - 1.025" },
    { code: "LAB-URI-PH", name: "Ph", normal: "4,8 - 7,4" },
    { code: "LAB-URI-PROT", name: "Protein", normal: "Negatif" },
    { code: "LAB-URI-GLU", name: "Glukosa", normal: "Negatif" },
    { code: "LAB-URI-KET", name: "Keton", normal: "Negatif" },
    { code: "LAB-URI-BIL", name: "Bilirubin", normal: "Negatif" },
    { code: "LAB-URI-URO", name: "Urobilinogen", normal: "0,2 - 1,0" },
    { code: "LAB-URI-BLD", name: "Darah Samar (Blood)", normal: "Negatif" },
    { code: "LAB-URI-NIT", name: "Nitrit", normal: "Negatif" },
    { code: "LAB-URI-LE", name: "Leukosit Esterase", normal: "Negatif" },
  ];

  const mikroItems = [
    { code: "LAB-URI-LEUK", name: "Leukosit", normal: "1 - 4" },
    { code: "LAB-URI-ERI", name: "Eritrosit", normal: "0 - 1" },
    { code: "LAB-URI-EPI", name: "Epitel", normal: "< 5" },
    { code: "LAB-URI-SIL", name: "Silinder", normal: "" },
    { code: "LAB-URI-HYA", name: "Hyaline", normal: "-" },
    { code: "LAB-URI-GRA", name: "Granula", normal: "-" },
    { code: "LAB-URI-KRI", name: "Kristal", normal: "-" },
    { code: "LAB-URI-BAK", name: "Bakteri", normal: "-" },
    { code: "LAB-URI-JAM", name: "Jamur", normal: "-" },
    { code: "LAB-URI-DLL", name: "Dll", normal: "-" },
  ];

  for (const item of makroItems) {
    const created = await prisma.labTestMaster.create({
      data: {
        code: item.code,
        name: item.name,
        category: category,
        normalRangeText: item.normal,
        price: 0,
        isActive: true,
      }
    });
    // Link to parent
    await prisma.labTestMaster.update({
      where: { id: makroskopisPkg.id },
      data: {
        children: {
          connect: { id: created.id }
        }
      }
    })
  }

  for (const item of mikroItems) {
    const created = await prisma.labTestMaster.create({
      data: {
        code: item.code,
        name: item.name,
        category: category,
        normalRangeText: item.normal,
        price: 0,
        isActive: true,
      }
    });
    // Link to parent
    await prisma.labTestMaster.update({
      where: { id: mikroskopisPkg.id },
      data: {
        children: {
          connect: { id: created.id }
        }
      }
    })
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
