import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// Helper function untuk format rupiah
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * POST /api/pharmacy/compound-formulas/:id/assemble
 * Rakit/produksi racikan dari bahan baku
 * 
 * Body: {
 *   quantity: 10,  // Jumlah unit racikan yang mau dibuat (misal: 10 puyer)
 *   clinicId: "uuid",
 *   notes: "Batch produksi pagi"
 * }
 * 
 * Proses:
 * 1. Validasi stok bahan baku cukup
 * 2. Kurangi stok bahan baku sesuai formula × quantity
 * 3. Tambah stok produk racikan
 * 4. Catat di inventory mutation
 */
export const assembleCompoundFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { quantity, clinicId, notes } = req.body
    const userId = (req as any).user?.id

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity harus lebih dari 0' })
    }

    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID wajib diisi' })
    }

    // 1. Ambil formula dengan komponen
    const formula = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: {
        productMaster: {
          include: {
            products: {
              where: { clinicId },
            },
          },
        },
        items: {
          include: {
            medicine: {
              include: {
                productMaster: {
                  include: {
                    products: {
                      where: { clinicId },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!formula) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan atau tidak aktif' })
    }

    // Auto-create ProductMaster dan Product jika belum ada
    let targetProduct = formula.productMaster?.products[0]
    
    if (!formula.productMaster || !targetProduct) {
      // Hitung harga beli berdasarkan komponen
      let totalPurchasePrice = 0
      for (const item of formula.items) {
        const productMaster = await prisma.productMaster.findFirst({
          where: { medicineId: item.medicineId },
        })
        if (productMaster && productMaster.purchasePrice) {
          totalPurchasePrice += productMaster.purchasePrice * item.quantity
        }
      }
      totalPurchasePrice += formula.tuslahPrice

      const finalSellingPrice = totalPurchasePrice * 1.3

      // Buat ProductMaster dan Product otomatis
      const createResult = await prisma.$transaction(async (tx) => {
        // Buat ProductMaster jika belum ada
        let productMasterId: string
        let productMasterCode: string
        let productMasterSku: string
        
        if (!formula.productMaster) {
          const count = await tx.productMaster.count({
            where: { masterCode: { startsWith: 'RACIK-' } },
          })
          const masterCode = `RACIK-${String(count + 1).padStart(4, '0')}`
          const sku = `SKU-${masterCode}`

          const newProductMaster = await tx.productMaster.create({
            data: {
              masterCode,
              sku,
              masterName: formula.formulaName,
              description: `Formula Racikan: ${formula.formulaCode}\nKategori: ${formula.category || '-'}\nBentuk: ${formula.dosageForm || '-'}`,
              compoundFormulaId: formula.id,
              defaultUnit: formula.dosageForm || 'pcs',
              purchaseUnit: formula.dosageForm || 'pcs',
              storageUnit: formula.dosageForm || 'pcs',
              usedUnit: formula.dosageForm || 'pcs',
              purchasePrice: totalPurchasePrice,
              sellingPrice: finalSellingPrice,
              minStock: 0,
              reorderPoint: 0,
              isActive: true,
            },
          })
          
          productMasterId = newProductMaster.id
          productMasterCode = newProductMaster.masterCode
          productMasterSku = newProductMaster.sku || `SKU-${newProductMaster.masterCode}`
        } else {
          productMasterId = formula.productMaster.id
          productMasterCode = formula.productMaster.masterCode
          productMasterSku = formula.productMaster.sku || `SKU-${formula.productMaster.masterCode}`
        }

        // Buat Product instance untuk klinik
        const productCode = `${productMasterCode}-${clinicId.substring(0, 4).toUpperCase()}`
        const product = await tx.product.create({
          data: {
            masterProductId: productMasterId,
            productCode,
            sku: `${productMasterSku}-${clinicId.substring(0, 4).toUpperCase()}`,
            productName: formula.formulaName,
            description: `Formula Racikan: ${formula.formulaCode}`,
            unit: formula.dosageForm || 'pcs',
            purchaseUnit: formula.dosageForm || 'pcs',
            storageUnit: formula.dosageForm || 'pcs',
            usedUnit: formula.dosageForm || 'pcs',
            quantity: 0,
            minimumStock: 0,
            reorderQuantity: 0,
            purchasePrice: totalPurchasePrice,
            sellingPrice: finalSellingPrice,
            isActive: true,
            clinicId,
          },
        })

        return product
      })

      targetProduct = createResult
    }

    // 2. Validasi stok bahan baku
    const insufficientStock: any[] = []
    const componentDetails: any[] = []

    for (const item of formula.items) {
      const requiredQty = item.quantity * quantity
      const componentProduct = item.medicine.productMaster?.products[0]

      if (!componentProduct) {
        insufficientStock.push({
          medicineName: item.medicine.medicineName,
          required: requiredQty,
          available: 0,
          message: 'Produk tidak ditemukan di klinik ini',
        })
        continue
      }

      const availableStock = componentProduct.quantity || 0

      componentDetails.push({
        productId: componentProduct.id,
        medicineName: item.medicine.medicineName,
        requiredQty,
        availableStock,
        unitQty: item.quantity,
      })

      if (availableStock < requiredQty) {
        insufficientStock.push({
          medicineName: item.medicine.medicineName,
          required: requiredQty,
          available: availableStock,
          shortage: requiredQty - availableStock,
        })
      }
    }

    // Jika ada stok tidak cukup, return error
    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: 'Stok bahan baku tidak mencukupi',
        insufficientStock,
      })
    }

    // 3. Proses assembly dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      const mutations: any[] = []

      // 3a. Kurangi stok bahan baku
      for (const component of componentDetails) {
        // Update stok produk bahan baku
        await tx.product.update({
          where: { id: component.productId },
          data: {
            quantity: {
              decrement: component.requiredQty,
            },
          },
        })

        // Catat mutation (keluar untuk assembly)
        const mutation = await tx.inventoryMutation.create({
          data: {
            productId: component.productId,
            branchId: clinicId,
            type: 'OUT',
            quantity: component.requiredQty,
            referenceType: 'ASSEMBLY',
            notes: `Digunakan untuk merakit ${quantity} unit ${formula.formulaName}${notes ? ` - ${notes}` : ''}`,
            userId: userId || 'system',
          },
        })

        mutations.push({
          type: 'OUT',
          productName: component.medicineName,
          quantity: component.requiredQty,
          mutationId: mutation.id,
        })
      }

      // 3b. Tambah stok produk racikan
      const updatedProduct = await tx.product.update({
        where: { id: targetProduct.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      })

      // Catat mutation (masuk dari assembly)
      const inMutation = await tx.inventoryMutation.create({
        data: {
          productId: targetProduct.id,
          branchId: clinicId,
          type: 'IN',
          quantity,
          referenceType: 'ASSEMBLY',
          notes: `Hasil rakitan dari formula ${formula.formulaCode}${notes ? ` - ${notes}` : ''}`,
          userId: userId || 'system',
        },
      })

      mutations.push({
        type: 'IN',
        productName: formula.formulaName,
        quantity,
        mutationId: inMutation.id,
      })

      // 3c. Buat Journal Entry untuk General Ledger
      // Hitung total cost bahan baku
      let totalRawMaterialCost = 0
      for (const component of componentDetails) {
        const componentProduct = await tx.product.findUnique({
          where: { id: component.productId },
          select: { purchasePrice: true },
        })
        if (componentProduct) {
          totalRawMaterialCost += componentProduct.purchasePrice * component.requiredQty
        }
      }

      // Tambahkan tuslah
      const totalProductionCost = totalRawMaterialCost + formula.tuslahPrice

      // Cari COA yang diperlukan
      const inventoryFinishedGoodsCOA = await tx.chartOfAccount.findFirst({
        where: { 
          clinicId: clinicId,
          code: { startsWith: '114' }, // Inventory Produk Jadi/Persediaan
          isActive: true,
        },
      })

      const inventoryRawMaterialCOA = await tx.chartOfAccount.findFirst({
        where: { 
          clinicId: clinicId,
          code: { startsWith: '115' }, // Inventory Bahan Baku
          isActive: true,
        },
      })

      const manufacturingOverheadCOA = await tx.chartOfAccount.findFirst({
        where: { 
          clinicId: clinicId,
          code: { startsWith: '515' }, // Manufacturing Overhead / Biaya Produksi
          isActive: true,
        },
      })

      let journalEntry = null
      const journalDetails: any[] = []

      // Validasi: Minimal harus ada COA untuk Finished Goods dan Raw Material
      if (inventoryFinishedGoodsCOA && inventoryRawMaterialCOA) {
        // Generate reference number
        const journalCount = await tx.journalEntry.count({
          where: { clinicId: clinicId },
        })
        const referenceNo = `ASSEMBLY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCount + 1).padStart(4, '0')}`

        // 1. Debit: Inventory Produk Jadi (Racikan) bertambah
        journalDetails.push({
          coaId: inventoryFinishedGoodsCOA.id,
          description: `Produksi ${quantity} unit ${formula.formulaName}`,
          debit: totalProductionCost,
          credit: 0,
        })

        // 2. Credit: Inventory Bahan Baku berkurang
        journalDetails.push({
          coaId: inventoryRawMaterialCOA.id,
          description: `Penggunaan bahan baku untuk ${quantity} unit ${formula.formulaName}`,
          debit: 0,
          credit: totalRawMaterialCost,
        })

        // 3. Credit: Manufacturing Overhead (Tuslah) jika ada
        if (formula.tuslahPrice > 0) {
          if (manufacturingOverheadCOA) {
            journalDetails.push({
              coaId: manufacturingOverheadCOA.id,
              description: `Biaya tuslah produksi ${quantity} unit ${formula.formulaName}`,
              debit: 0,
              credit: formula.tuslahPrice,
            })
          } else {
            // Fallback: jika COA overhead tidak ada, masukkan ke raw material
            journalDetails[1].credit += formula.tuslahPrice
            journalDetails[1].description += ` (termasuk tuslah ${formatRupiah(formula.tuslahPrice)})`
          }
        }

        // Buat Journal Entry
        journalEntry = await tx.journalEntry.create({
          data: {
            clinicId: clinicId,
            date: new Date(),
            description: `Assembly produk racikan: ${formula.formulaName} (${quantity} unit)`,
            referenceNo,
            entryType: 'ASSEMBLY',
            details: {
              create: journalDetails,
            },
          },
          include: {
            details: {
              include: {
                coa: true,
              },
            },
          },
        })
      }

      return {
        updatedProduct,
        mutations,
        journalEntry,
        totalProductionCost,
        totalRawMaterialCost,
      }
    })

    res.json({
      message: `Berhasil merakit ${quantity} unit ${formula.formulaName}`,
      formula: {
        id: formula.id,
        formulaCode: formula.formulaCode,
        formulaName: formula.formulaName,
      },
      production: {
        quantity,
        productId: targetProduct.id,
        productCode: targetProduct.productCode,
        newStock: result.updatedProduct.quantity,
        previousStock: targetProduct.quantity,
        autoCreated: targetProduct.quantity === 0 && result.updatedProduct.quantity === quantity, // Produk baru dibuat otomatis
      },
      componentsUsed: componentDetails.map((c) => ({
        medicineName: c.medicineName,
        quantityUsed: c.requiredQty,
        unitQuantity: c.unitQty,
      })),
      mutations: result.mutations,
      accounting: {
        journalEntry: result.journalEntry ? {
          referenceNo: result.journalEntry.referenceNo,
          totalAmount: result.totalProductionCost,
          rawMaterialCost: result.totalRawMaterialCost,
          tuslahCost: formula.tuslahPrice,
          entryType: result.journalEntry.entryType,
          details: result.journalEntry.details.map((d: any) => ({
            account: d.coa.accountName,
            accountCode: d.coa.code,
            debit: d.debit,
            credit: d.credit,
            description: d.description,
          })),
        } : null,
        message: result.journalEntry 
          ? `Journal Entry ${result.journalEntry.referenceNo} telah dibuat di General Ledger dengan ${result.journalEntry.details.length} baris jurnal`
          : 'Journal Entry tidak dibuat (COA Inventory Produk Jadi atau Bahan Baku tidak ditemukan)',
      },
    })
  } catch (error) {
    console.error('Error assembling compound formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * POST /api/pharmacy/compound-formulas/:id/check-assembly
 * Cek apakah bisa merakit racikan (validasi stok saja, tidak eksekusi)
 */
export const checkAssemblyFeasibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { quantity, clinicId } = req.body

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity harus lebih dari 0' })
    }

    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID wajib diisi' })
    }

    const formula = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: {
        productMaster: {
          include: {
            products: {
              where: { clinicId },
            },
          },
        },
        items: {
          include: {
            medicine: {
              include: {
                productMaster: {
                  include: {
                    products: {
                      where: { clinicId },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!formula) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan' })
    }

    if (!formula.productMaster) {
      return res.status(400).json({
        message: 'Produk untuk formula ini belum dibuat',
        canAssemble: false,
      })
    }

    const componentStatus: any[] = []
    let canAssemble = true

    for (const item of formula.items) {
      const requiredQty = item.quantity * quantity
      const componentProduct = item.medicine.productMaster?.products[0]
      const availableStock = componentProduct?.quantity || 0
      const isSufficient = availableStock >= requiredQty

      if (!isSufficient) {
        canAssemble = false
      }

      componentStatus.push({
        medicineName: item.medicine.medicineName,
        unitQuantity: item.quantity,
        requiredQty,
        availableStock,
        isSufficient,
        shortage: isSufficient ? 0 : requiredQty - availableStock,
      })
    }

    res.json({
      canAssemble,
      formula: {
        id: formula.id,
        formulaCode: formula.formulaCode,
        formulaName: formula.formulaName,
      },
      requestedQuantity: quantity,
      currentStock: formula.productMaster.products[0]?.quantity || 0,
      componentStatus,
      summary: {
        totalComponents: componentStatus.length,
        sufficientComponents: componentStatus.filter((c) => c.isSufficient).length,
        insufficientComponents: componentStatus.filter((c) => !c.isSufficient).length,
      },
    })
  } catch (error) {
    console.error('Error checking assembly feasibility:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}
