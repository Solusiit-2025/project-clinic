import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING ASSET-TO-PRODUCT MIGRATION ---')
  
  try {
    const assets = await prisma.asset.findMany({
      include: {
        clinic: true,
        masterProduct: true
      }
    })

    console.log(`Found ${assets.length} existing assets to migrate.`)

    let mastersCreated = 0
    let productsCreated = 0
    let assetsLinked = 0

    for (const asset of assets) {
      if (asset.masterProductId) {
        console.log(`✓ Asset "${asset.assetName}" (Code: ${asset.assetCode}) is already linked. Skipping.`)
        continue
      }

      // 1. Identify or Create ProductMaster (Catalog)
      // Check if a ProductMaster with this name and category exists
      let masterProduct = await prisma.productMaster.findFirst({
        where: { masterName: asset.assetName, category: asset.category }
      })

      if (!masterProduct) {
        masterProduct = await prisma.productMaster.create({
          data: {
            masterName: asset.assetName,
            masterCode: asset.assetCode + '-MASTER',
            category: asset.category,
            description: asset.description || `Generated from asset ${asset.assetCode}`,
            isActive: true
          }
        })
        mastersCreated++
        console.log(`+ Created ProductMaster: "${masterProduct.masterName}"`)
      }

      // 2. Identify or Create Product (Clinic-specific Stock)
      if (asset.clinicId) {
        let product = await prisma.product.findFirst({
          where: { 
            masterProductId: masterProduct.id, 
            clinicId: asset.clinicId 
          }
        })

        if (!product) {
          product = await prisma.product.create({
            data: {
              masterProductId: masterProduct.id,
              clinicId: asset.clinicId,
              productName: asset.assetName,
              productCode: asset.assetCode + '-PC',
              sku: asset.assetCode + '-SKU',
              unit: 'Unit',
              purchaseUnit: 'Unit',
              storageUnit: 'Unit',
              usedUnit: 'Unit',
              quantity: 1, // At least one for this asset
              minimumStock: 0,
              reorderQuantity: 0,
              purchasePrice: asset.purchasePrice,
              sellingPrice: 0,
              isActive: true
            }
          })
          productsCreated++
          console.log(`  + Created Product Stock for Clinic: "${asset.clinic?.name}"`)
        } else {
            // Increment stock if it already exists
            await prisma.product.update({
                where: { id: product.id },
                data: { quantity: { increment: 1 } }
            })
        }
      }

      // 3. Link original Asset to the new ProductMaster
      await prisma.asset.update({
        where: { id: asset.id },
        data: { masterProductId: masterProduct.id }
      })
      assetsLinked++
    }

    console.log('--- MIGRATION COMPLETE ---')
    console.log(`Summary:`)
    console.log(`- Product Masters created: ${mastersCreated}`)
    console.log(`- Product Stocks created: ${productsCreated}`)
    console.log(`- Assets linked: ${assetsLinked}`)

  } catch (err) {
    console.error('Migration failed:', err)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
