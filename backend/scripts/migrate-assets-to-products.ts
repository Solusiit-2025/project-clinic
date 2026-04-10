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

      // 0. Ensure ProductCategory exists (ProductMaster now uses categoryId)
      let productCategory = await prisma.productCategory.findUnique({
        where: { categoryName: asset.category }
      })

      if (!productCategory) {
        productCategory = await prisma.productCategory.create({
          data: {
            categoryName: asset.category,
            description: `Auto-generated from Asset migration`
          }
        })
        console.log(`+ Created new category: "${asset.category}"`)
      }

      // 1. Identify or Create ProductMaster (Catalog)
      // Check if a ProductMaster with this name and categoryId exists
      let masterProduct = await prisma.productMaster.findFirst({
        where: { 
          masterName: asset.assetName, 
          categoryId: productCategory.id 
        }
      })

      if (!masterProduct) {
        masterProduct = await prisma.productMaster.create({
          data: {
            masterName: asset.assetName,
            masterCode: asset.assetCode + '-MASTER',
            categoryId: productCategory.id,
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
            productCode: asset.assetCode + '-PC',
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
            // Update master link if needed
            await prisma.product.update({
                where: { id: product.id },
                data: { masterProductId: masterProduct.id }
            })
            console.log(`  ✓ Product Stock already exists for: "${asset.clinic?.name}". Linked to Master.`)
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
