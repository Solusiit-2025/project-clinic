import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const search = ''
    const targetClinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c' // From user logs

    console.log('Testing getProductMasters with clinicId:', targetClinicId)

    const products = await prisma.productMaster.findMany({
      where: {
        products: {
          some: {
            clinicId: targetClinicId
          }
        }
      },
      include: { 
        productCategory: true,
        medicine: true,
        products: { 
          where: { clinicId: targetClinicId },
          include: {
            inventoryStocks: true
          }
        }
      },
      take: 5
    })

    console.log(`Found ${products.length} products`)

    const result = products.map(p => {
      const branchProduct = p.products[0]
      const totalStock = branchProduct?.inventoryStocks.reduce((acc, curr: any) => acc + curr.onHandQty, 0) || 0
      
      return {
        masterName: p.masterName,
        stock: totalStock,
        unit: branchProduct?.usedUnit || branchProduct?.unit || 'Unit'
      }
    })

    console.log('Result sample:', JSON.stringify(result, null, 2))
  } catch (e) {
    console.error('ERROR during test:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
