import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const parent = await prisma.labTestMaster.findFirst({
    where: { 
      name: { contains: 'HITUNG JENIS LEUKOSIT', mode: 'insensitive' }
    }
  })
  
  if (!parent) {
    console.log("Parent 'Hitung Jenis Leukosit' not found.")
    return
  }

  console.log("Found parent:", parent.name, parent.code)

  const childrenNames = ['Basofil', 'Eosinofil', 'Batang', 'Segmen', 'Limfosit', 'Monosit']
  
  for (const childName of childrenNames) {
    const child = await prisma.labTestMaster.findFirst({
      where: { 
        name: { contains: childName, mode: 'insensitive' },
        category: 'HEMATOLOGI'
      }
    })
    
    if (child) {
      await prisma.labTestMaster.update({
        where: { id: child.id },
        data: {
          parents: {
            connect: { id: parent.id }
          }
        }
      })
      console.log(`Connected ${child.name} to ${parent.name}`)
    } else {
      console.log(`Child ${childName} not found`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
