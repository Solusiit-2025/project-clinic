import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING PRODUCT CATEGORY MIGRATION ---')
  
  try {
    // 1. Fetch all product masters that have a category but no categoryId
    const products = await prisma.productMaster.findMany({
      where: {
        AND: [
          { category: { not: null } },
          { categoryId: null }
        ]
      }
    })

    console.log(`Found ${products.length} products to migrate.`)

    const categoryMap = new Map<string, string>()
    let categoriesCreated = 0
    let productsUpdated = 0

    for (const product of products) {
      const catName = product.category as string
      
      let catId = categoryMap.get(catName)

      // If category not in map, find or create in DB
      if (!catId) {
        let dbCat = await prisma.productCategory.findUnique({
          where: { categoryName: catName }
        })

        if (!dbCat) {
          dbCat = await prisma.productCategory.create({
            data: {
              categoryName: catName,
              description: `Generated from existing data: ${catName}`
            }
          })
          categoriesCreated++
          console.log(`+ Created ProductCategory: "${catName}"`)
        }
        
        catId = dbCat.id
        categoryMap.set(catName, catId)
      }

      // Update product with categoryId
      await prisma.productMaster.update({
        where: { id: product.id },
        data: { categoryId: catId }
      })
      productsUpdated++
    }

    console.log('--- MIGRATION COMPLETE ---')
    console.log(`Summary:`)
    console.log(`- Product Categories created: ${categoriesCreated}`)
    console.log(`- Product Masters updated with IDs: ${productsUpdated}`)

  } catch (err) {
    console.error('Migration failed:', err)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
