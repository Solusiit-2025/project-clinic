import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// ============================================================
// MASTER FORMULA RACIKAN (Bill of Materials)
// ============================================================

/**
 * GET /api/pharmacy/compound-formulas
 * Ambil semua formula racikan, bisa filter per klinik atau global
 */
export const getCompoundFormulas = async (req: Request, res: Response) => {
  try {
    const { clinicId, category, isActive, search } = req.query

    const where: any = {
      deletedAt: null,
    }

    // Filter aktif/nonaktif
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Filter kategori
    if (category) {
      where.category = category as string
    }

    // Filter klinik: tampilkan formula global (clinicId null) + formula milik klinik ini
    if (clinicId) {
      where.OR = [
        { clinicId: clinicId as string },
        { clinicId: null }, // formula global
      ]
    }

    // Search by name or code
    if (search) {
      const searchCondition = {
        OR: [
          { formulaName: { contains: search as string, mode: 'insensitive' as const } },
          { formulaCode: { contains: search as string, mode: 'insensitive' as const } },
          { description: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }
      // Gabungkan dengan filter klinik jika ada
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition]
        delete where.OR
      } else {
        Object.assign(where, searchCondition)
      }
    }

    const formulas = await prisma.compoundFormula.findMany({
      where,
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                medicineName: true,
                genericName: true,
                dosageForm: true,
                strength: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        clinic: { select: { id: true, name: true, code: true } },
        productMaster: {
          include: {
            products: {
              where: clinicId ? { clinicId: clinicId as string } : undefined,
              select: {
                id: true,
                productCode: true,
                quantity: true,
                clinicId: true,
              },
            },
          },
        },
        _count: { select: { prescriptionItems: true } },
      },
      orderBy: [{ category: 'asc' }, { formulaName: 'asc' }],
    })

    res.json(formulas)
  } catch (error) {
    console.error('Error fetching compound formulas:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * GET /api/pharmacy/compound-formulas/:id
 * Detail satu formula racikan
 */
export const getCompoundFormulaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const formula = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                medicineName: true,
                genericName: true,
                dosageForm: true,
                strength: true,
                image: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        clinic: { select: { id: true, name: true, code: true } },
      },
    })

    if (!formula) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan' })
    }

    res.json(formula)
  } catch (error) {
    console.error('Error fetching compound formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * POST /api/pharmacy/compound-formulas
 * Buat formula racikan baru
 * Body: { formulaName, description, category, dosageForm, defaultQty, defaultDosage,
 *         defaultFrequency, defaultDuration, defaultInstructions, tuslahPrice,
 *         clinicId, items: [{ medicineId, quantity, unit, notes, sortOrder }] }
 */
export const createCompoundFormula = async (req: Request, res: Response) => {
  try {
    const {
      formulaName,
      description,
      category,
      dosageForm,
      defaultQty,
      defaultDosage,
      defaultFrequency,
      defaultDuration,
      defaultInstructions,
      tuslahPrice,
      clinicId,
      items = [],
    } = req.body

    const userId = (req as any).user?.id

    if (!formulaName) {
      return res.status(400).json({ message: 'Nama formula wajib diisi' })
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Formula harus memiliki minimal 1 bahan baku' })
    }

    // Validasi semua medicineId ada
    const medicineIds = items.map((i: any) => i.medicineId)
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, medicineName: true },
    })

    if (medicines.length !== medicineIds.length) {
      const foundIds = medicines.map((m) => m.id)
      const missing = medicineIds.filter((id: string) => !foundIds.includes(id))
      return res.status(400).json({ message: `Obat tidak ditemukan: ${missing.join(', ')}` })
    }

    // Generate formula code: FRM-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.compoundFormula.count()
    const formulaCode = `FRM-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const formula = await prisma.compoundFormula.create({
      data: {
        formulaCode,
        formulaName,
        description,
        category,
        dosageForm,
        defaultQty: defaultQty ? parseInt(defaultQty) : 10,
        defaultDosage,
        defaultFrequency,
        defaultDuration,
        defaultInstructions,
        tuslahPrice: tuslahPrice ? parseFloat(tuslahPrice) : 0,
        clinicId: clinicId || null,
        createdBy: userId,
        items: {
          create: items.map((item: any, index: number) => ({
            medicineId: item.medicineId,
            quantity: parseFloat(item.quantity),
            unit: item.unit || null,
            notes: item.notes || null,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                medicineName: true,
                genericName: true,
                dosageForm: true,
                strength: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    res.status(201).json(formula)
  } catch (error) {
    console.error('Error creating compound formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * PUT /api/pharmacy/compound-formulas/:id
 * Update formula racikan
 */
export const updateCompoundFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      formulaName,
      description,
      category,
      dosageForm,
      defaultQty,
      defaultDosage,
      defaultFrequency,
      defaultDuration,
      defaultInstructions,
      tuslahPrice,
      clinicId,
      isActive,
      items,
    } = req.body

    const existing = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan' })
    }

    // Jika items dikirim, validasi dan replace semua items
    if (items !== undefined) {
      if (items.length === 0) {
        return res.status(400).json({ message: 'Formula harus memiliki minimal 1 bahan baku' })
      }

      const medicineIds = items.map((i: any) => i.medicineId)
      const medicines = await prisma.medicine.findMany({
        where: { id: { in: medicineIds } },
        select: { id: true },
      })

      if (medicines.length !== medicineIds.length) {
        return res.status(400).json({ message: 'Satu atau lebih obat tidak ditemukan' })
      }
    }

    const formula = await prisma.$transaction(async (tx) => {
      // Hapus items lama jika ada items baru
      if (items !== undefined) {
        await tx.compoundFormulaItem.deleteMany({ where: { formulaId: id } })
      }

      return tx.compoundFormula.update({
        where: { id },
        data: {
          ...(formulaName !== undefined && { formulaName }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(dosageForm !== undefined && { dosageForm }),
          ...(defaultQty !== undefined && { defaultQty: parseInt(defaultQty) }),
          ...(defaultDosage !== undefined && { defaultDosage }),
          ...(defaultFrequency !== undefined && { defaultFrequency }),
          ...(defaultDuration !== undefined && { defaultDuration }),
          ...(defaultInstructions !== undefined && { defaultInstructions }),
          ...(tuslahPrice !== undefined && { tuslahPrice: parseFloat(tuslahPrice) }),
          ...(clinicId !== undefined && { clinicId: clinicId || null }),
          ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
          ...(items !== undefined && {
            items: {
              create: items.map((item: any, index: number) => ({
                medicineId: item.medicineId,
                quantity: parseFloat(item.quantity),
                unit: item.unit || null,
                notes: item.notes || null,
                sortOrder: item.sortOrder ?? index,
              })),
            },
          }),
        },
        include: {
          items: {
            include: {
              medicine: {
                select: {
                  id: true,
                  medicineName: true,
                  genericName: true,
                  dosageForm: true,
                  strength: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    })

    res.json(formula)
  } catch (error) {
    console.error('Error updating compound formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * DELETE /api/pharmacy/compound-formulas/:id
 * Soft delete formula racikan
 */
export const deleteCompoundFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { prescriptionItems: true } } },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan' })
    }

    // Cegah hapus jika masih dipakai di resep aktif
    if (existing._count.prescriptionItems > 0) {
      return res.status(400).json({
        message: `Formula ini sudah digunakan di ${existing._count.prescriptionItems} resep dan tidak dapat dihapus. Nonaktifkan saja.`,
      })
    }

    await prisma.compoundFormula.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })

    res.json({ message: 'Formula racikan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting compound formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * GET /api/pharmacy/compound-formulas/categories
 * Ambil daftar kategori yang sudah ada (untuk dropdown)
 */
export const getFormulaCategories = async (req: Request, res: Response) => {
  try {
    const { clinicId } = req.query

    const where: any = { deletedAt: null, isActive: true }
    if (clinicId) {
      where.OR = [{ clinicId: clinicId as string }, { clinicId: null }]
    }

    const formulas = await prisma.compoundFormula.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
    })

    const categories = formulas
      .map((f) => f.category)
      .filter(Boolean)
      .sort()

    res.json(categories)
  } catch (error) {
    console.error('Error fetching formula categories:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * POST /api/pharmacy/compound-formulas/:id/apply
 * Terapkan formula ke prescription item baru.
 * Mengembalikan data komponen yang sudah di-resolve dengan stok terkini.
 * Digunakan oleh dokter saat menulis resep.
 */
export const applyFormulaToItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { clinicId, quantity } = req.body

    const formula = await prisma.compoundFormula.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                medicineName: true,
                genericName: true,
                dosageForm: true,
                strength: true,
                image: true,
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

    const qty = quantity ? parseInt(quantity) : formula.defaultQty

    // Enrich dengan stok terkini per klinik
    const enrichedComponents = await Promise.all(
      formula.items.map(async (item) => {
        let availableStock = 0
        let sellingPrice = 0
        let productId = null

        if (clinicId) {
          const product = await prisma.product.findFirst({
            where: {
              masterProduct: { medicineId: item.medicineId },
              clinicId: clinicId as string,
              isActive: true,
            },
            select: {
              id: true,
              sellingPrice: true,
              usedUnit: true,
              inventoryStocks: {
                select: { onHandQty: true, reservedQty: true },
              },
            },
          })

          if (product) {
            productId = product.id
            sellingPrice = product.sellingPrice || 0
            const totalOnHand = product.inventoryStocks.reduce((s, st) => s + st.onHandQty, 0)
            const totalReserved = product.inventoryStocks.reduce((s, st) => s + st.reservedQty, 0)
            availableStock = Math.max(0, totalOnHand - totalReserved)
          }
        }

        // Hitung kebutuhan total = qty_per_unit × jumlah_racikan
        const requiredQty = item.quantity * qty

        return {
          medicineId: item.medicineId,
          medicine: item.medicine,
          quantity: item.quantity,       // qty per 1 unit racikan
          requiredQty,                   // qty total yang dibutuhkan
          unit: item.unit,
          notes: item.notes,
          sortOrder: item.sortOrder,
          availableStock,
          sellingPrice,
          productId,
          isStockSufficient: availableStock >= requiredQty,
        }
      })
    )

    // Hitung estimasi harga racikan
    const componentsCost = enrichedComponents.reduce(
      (sum, c) => sum + c.sellingPrice * c.requiredQty,
      0
    )
    const totalEstimatedPrice = componentsCost + formula.tuslahPrice

    res.json({
      formula: {
        id: formula.id,
        formulaCode: formula.formulaCode,
        formulaName: formula.formulaName,
        category: formula.category,
        dosageForm: formula.dosageForm,
        tuslahPrice: formula.tuslahPrice,
      },
      // Data siap pakai untuk PrescriptionItem
      prescriptionItemData: {
        isRacikan: true,
        racikanName: formula.formulaName,
        formulaId: formula.id,
        quantity: qty,
        dosage: formula.defaultDosage || '',
        frequency: formula.defaultFrequency || '',
        duration: formula.defaultDuration || '',
        instructions: formula.defaultInstructions || '',
        components: enrichedComponents,
      },
      summary: {
        totalComponents: enrichedComponents.length,
        componentsCost,
        tuslahPrice: formula.tuslahPrice,
        totalEstimatedPrice,
        hasInsufficientStock: enrichedComponents.some((c) => !c.isStockSufficient),
        insufficientItems: enrichedComponents
          .filter((c) => !c.isStockSufficient)
          .map((c) => ({
            medicineName: c.medicine.medicineName,
            required: c.requiredQty,
            available: c.availableStock,
          })),
      },
    })
  } catch (error) {
    console.error('Error applying formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * POST /api/pharmacy/compound-formulas/:id/create-product
 * Buat ProductMaster dari formula racikan (jika belum ada)
 * Dan/atau buat Product instance untuk klinik tertentu
 */
export const createProductFromFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { categoryId, sellingPrice, minStock, reorderPoint, clinicId } = req.body

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
            medicine: true,
          },
        },
      },
    })

    if (!formula) {
      return res.status(404).json({ message: 'Formula racikan tidak ditemukan atau tidak aktif' })
    }

    // Cek apakah sudah ada produk untuk klinik ini
    if (formula.productMaster?.products && formula.productMaster.products.length > 0) {
      return res.status(400).json({
        message: 'Produk untuk formula ini sudah dibuat di klinik ini',
        productMaster: formula.productMaster,
        product: formula.productMaster.products[0],
      })
    }

    // Hitung harga beli berdasarkan komponen
    let totalPurchasePrice = 0
    for (const item of formula.items) {
      // Ambil harga beli dari product master yang terhubung dengan medicine
      const productMaster = await prisma.productMaster.findFirst({
        where: { medicineId: item.medicineId },
      })
      if (productMaster && productMaster.purchasePrice) {
        totalPurchasePrice += productMaster.purchasePrice * item.quantity
      }
    }

    // Tambahkan biaya tuslah ke harga beli
    totalPurchasePrice += formula.tuslahPrice

    const finalSellingPrice = sellingPrice ? parseFloat(sellingPrice) : totalPurchasePrice * 1.3

    // Buat ProductMaster (jika belum ada) dan Product dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat ProductMaster jika belum ada
      let productMasterId: string
      let productMasterCode: string
      let productMasterSku: string
      let productMasterDescription: string
      
      if (!formula.productMaster) {
        // Generate master code: RACIK-XXXX
        const count = await tx.productMaster.count({
          where: { masterCode: { startsWith: 'RACIK-' } },
        })
        const masterCode = `RACIK-${String(count + 1).padStart(4, '0')}`

        // Generate SKU
        const sku = `SKU-${masterCode}`

        const newProductMaster = await tx.productMaster.create({
          data: {
            masterCode,
            sku,
            masterName: formula.formulaName,
            description: `${formula.description || ''}\n\nFormula Racikan: ${formula.formulaCode}\nKategori: ${formula.category || '-'}\nBentuk: ${formula.dosageForm || '-'}\n\nKomponen:\n${formula.items.map((item) => `- ${item.medicine.medicineName}: ${item.quantity} ${item.unit || 'unit'}`).join('\n')}`,
            categoryId: categoryId || null,
            compoundFormulaId: formula.id,
            defaultUnit: formula.dosageForm || 'pcs',
            purchaseUnit: formula.dosageForm || 'pcs',
            storageUnit: formula.dosageForm || 'pcs',
            usedUnit: formula.dosageForm || 'pcs',
            purchasePrice: totalPurchasePrice,
            sellingPrice: finalSellingPrice,
            minStock: minStock ? parseInt(minStock) : 0,
            reorderPoint: reorderPoint ? parseInt(reorderPoint) : 0,
            isActive: true,
          },
        })
        
        productMasterId = newProductMaster.id
        productMasterCode = newProductMaster.masterCode
        productMasterSku = newProductMaster.sku || `SKU-${newProductMaster.masterCode}`
        productMasterDescription = newProductMaster.description || ''
      } else {
        productMasterId = formula.productMaster.id
        productMasterCode = formula.productMaster.masterCode
        productMasterSku = formula.productMaster.sku || `SKU-${formula.productMaster.masterCode}`
        productMasterDescription = formula.productMaster.description || ''
      }

      // 2. Buat Product instance untuk klinik
      const productCode = `${productMasterCode}-${clinicId.substring(0, 4).toUpperCase()}`
      const product = await tx.product.create({
        data: {
          masterProductId: productMasterId,
          productCode,
          sku: `${productMasterSku}-${clinicId.substring(0, 4).toUpperCase()}`,
          productName: formula.formulaName,
          description: productMasterDescription,
          unit: formula.dosageForm || 'pcs',
          purchaseUnit: formula.dosageForm || 'pcs',
          storageUnit: formula.dosageForm || 'pcs',
          usedUnit: formula.dosageForm || 'pcs',
          quantity: 0, // Stok awal 0
          minimumStock: minStock ? parseInt(minStock) : 0,
          reorderQuantity: reorderPoint ? parseInt(reorderPoint) : 0,
          purchasePrice: totalPurchasePrice,
          sellingPrice: finalSellingPrice,
          isActive: true,
          clinicId,
        },
      })

      return { productMaster: formula.productMaster || { id: productMasterId, masterCode: productMasterCode }, product }
    })

    res.status(201).json({
      message: 'Produk racikan berhasil dibuat untuk klinik ini',
      productMaster: result.productMaster,
      product: result.product,
    })
  } catch (error) {
    console.error('Error creating product from formula:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * POST /api/pharmacy/compound-formulas/bulk-create-products
 * Buat ProductMaster untuk semua formula yang belum punya produk
 */
export const bulkCreateProductsFromFormulas = async (req: Request, res: Response) => {
  try {
    const { clinicId, categoryId } = req.body

    const where: any = {
      deletedAt: null,
      isActive: true,
      productMaster: null, // Hanya formula yang belum punya produk
    }

    if (clinicId) {
      where.OR = [{ clinicId: clinicId as string }, { clinicId: null }]
    }

    const formulas = await prisma.compoundFormula.findMany({
      where,
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    })

    if (formulas.length === 0) {
      return res.json({
        message: 'Tidak ada formula yang perlu dibuatkan produk',
        created: 0,
      })
    }

    const created = []
    const errors = []

    for (const formula of formulas) {
      try {
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

        // Generate master code
        const count = await prisma.productMaster.count({
          where: { masterCode: { startsWith: 'RACIK-' } },
        })
        const masterCode: string = `RACIK-${String(count + created.length + 1).padStart(4, '0')}`
        const sku: string = `SKU-${masterCode}`
        const finalSellingPrice = totalPurchasePrice * 1.3

        // Buat ProductMaster dan Product dalam transaction
        const result = await prisma.$transaction(async (tx) => {
          // 1. Buat ProductMaster
          const productMaster: any = await tx.productMaster.create({
            data: {
              masterCode,
              sku,
              masterName: formula.formulaName,
              description: `${formula.description || ''}\n\nFormula Racikan: ${formula.formulaCode}\nKategori: ${formula.category || '-'}\nBentuk: ${formula.dosageForm || '-'}\n\nKomponen:\n${formula.items.map((item) => `- ${item.medicine.medicineName}: ${item.quantity} ${item.unit || 'unit'}`).join('\n')}`,
              categoryId: categoryId || null,
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

          // 2. Buat Product instance untuk klinik (agar muncul di inventory)
          if (clinicId) {
            const productCode = `${masterCode}-${clinicId.substring(0, 4).toUpperCase()}`
            await tx.product.create({
              data: {
                masterProductId: productMaster.id,
                productCode,
                sku: `${sku}-${clinicId.substring(0, 4).toUpperCase()}`,
                productName: formula.formulaName,
                description: productMaster.description,
                unit: formula.dosageForm || 'pcs',
                purchaseUnit: formula.dosageForm || 'pcs',
                storageUnit: formula.dosageForm || 'pcs',
                usedUnit: formula.dosageForm || 'pcs',
                quantity: 0, // Stok awal 0
                minimumStock: 0,
                reorderQuantity: 0,
                purchasePrice: totalPurchasePrice,
                sellingPrice: finalSellingPrice,
                isActive: true,
                clinicId,
              },
            })
          }

          return productMaster
        })

        created.push({
          formulaCode: formula.formulaCode,
          formulaName: formula.formulaName,
          masterCode: result.masterCode,
        })
      } catch (error) {
        errors.push({
          formulaCode: formula.formulaCode,
          formulaName: formula.formulaName,
          error: (error as Error).message,
        })
      }
    }

    res.json({
      message: `Berhasil membuat ${created.length} produk dari ${formulas.length} formula`,
      created,
      errors,
    })
  } catch (error) {
    console.error('Error bulk creating products from formulas:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}
