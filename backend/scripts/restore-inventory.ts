import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  try {
    const backupPath = path.join(__dirname, '../../backups/products_backup_1775645512011.json')
    const data = JSON.parse(await fs.readFile(backupPath, 'utf8'))

    console.log(`Loaded ${data.length} products from backup.`)

    // 1. Ensure "Klinik Utama" exists (using ID from first record if available, for consistency)
    const firstClinicId = data[0]?.clinicId || 'default-clinic-id'
    let clinic = await prisma.clinic.findUnique({ where: { id: firstClinicId } })
    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          id: firstClinicId,
          name: 'Klinik Yasfina Utama',
          code: 'K001',
          isMain: true,
          isActive: true
        }
      })
      console.log(`✅ Clinic created: ${clinic.name} (${clinic.id})`)
    }

    // 2. Ensure "Medicine" category exists
    let category = await prisma.productCategory.findUnique({ where: { categoryName: 'Medicine' } })
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          categoryName: 'Medicine',
          description: 'Kategori obat-obatan'
        }
      })
      console.log(`✅ Category created: ${category.categoryName}`)
    }

    // 3. Import Products and Masters
    console.log('Restoring products and masters...')
    let count = 0
    for (const item of data) {
      const {
        id,
        masterProductId,
        productCode,
        sku,
        productName,
        description,
        unit,
        purchaseUnit,
        storageUnit,
        usedUnit,
        quantity,
        minimumStock,
        reorderQuantity,
        purchasePrice,
        sellingPrice,
        isActive,
        clinicId
      } = item

      // Ensure Master exists
      let master = await prisma.productMaster.findUnique({ where: { id: masterProductId } })
      if (!master) {
        master = await prisma.productMaster.create({
          data: {
            id: masterProductId,
            masterCode: `MSTR-${productCode}`,
            masterName: productName,
            description: description,
            categoryId: category.id,
            isActive: true
          }
        })
      }

      // Create Product
      // Check if product with this code/clinic already exists (to avoid P2002)
      const existingProduct = await prisma.product.findFirst({
        where: { productCode, clinicId: clinic.id }
      })

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            id,
            masterProductId: master.id,
            productCode,
            sku,
            productName,
            description,
            unit,
            purchaseUnit,
            storageUnit,
            usedUnit,
            quantity: Number(quantity),
            minimumStock: Number(minimumStock),
            reorderQuantity: Number(reorderQuantity),
            purchasePrice: Number(purchasePrice),
            sellingPrice: Number(sellingPrice),
            clinicId: clinic.id,
            isActive: isActive === true
          }
        })
        count++
      }
    }

    console.log(`\n🎉 Success! Restored ${count} products to ${clinic.name}.`)

  } catch (error) {
    console.error('❌ Restore failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
