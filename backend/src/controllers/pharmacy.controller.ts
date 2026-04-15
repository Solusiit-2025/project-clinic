import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { InventoryService } from '../services/inventory.service'

const prisma = new PrismaClient()

/**
 * Get active pharmacy queues / prescriptions
 */
export const getPharmacyQueues = async (req: Request, res: Response) => {
  try {
    const { clinicId, date } = req.query
    
    // Create query filters
    const whereClause: any = {}
    
    // If clinicId is provided, filter by patient's clinic via medical record or registration
    if (clinicId) {
       // Assuming clinic context is obtained via medicalRecord's clinic
       whereClause.medicalRecord = {
           clinicId: clinicId as string
       }
    }
    
    if (date) {
      const targetDate = new Date(date as string)
      targetDate.setHours(0, 0, 0, 0)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)
      
      whereClause.prescriptionDate = {
        gte: targetDate,
        lt: nextDate
      }
    } else {
      // Default to today if no date specified
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      whereClause.prescriptionDate = {
        gte: today
      }
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, name: true, medicalRecordNo: true, gender: true } },
        doctor: { select: { id: true, name: true } },
        items: { include: { medicine: true, components: { include: { medicine: true } } } }
      },
      orderBy: [
        { dispenseStatus: 'asc' }, // usually 'pending', 'preparing', 'ready', 'dispensed'
        { prescriptionDate: 'desc' }
      ]
    })
    
    res.json(prescriptions)
  } catch (error) {
    console.error('Error fetching pharmacy queues:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * Get single prescription details
 */
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        medicalRecord: {
           include: {
              clinic: true,
              registration: true
           }
        },
        items: { include: { medicine: true, components: { include: { medicine: true } } } }
      }
    })
    
    if (!prescription) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' })
    }
    
    res.json(prescription)
  } catch (error) {
    console.error('Error fetching prescription details:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * Update Dispense Status and handle inventory deduction when "dispensed"
 */
export const updateDispenseStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, counselingGiven } = req.body
    const pharmacistId = (req as any).user?.id // Assuming pharmacist handles this

    if (!['pending', 'preparing', 'ready', 'dispensed'].includes(status)) {
       return res.status(400).json({ message: 'Status tidak valid' })
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { 
         items: { 
           include: { 
             medicine: true,
             components: {
               include: {
                 medicine: true
               }
             }
           } 
         },
         medicalRecord: true
      }
    })

    if (!prescription) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' })
    }

    // Attempting to finish dispensing
    if (status === 'dispensed' && prescription.dispenseStatus !== 'dispensed') {
      const clinicId = prescription.medicalRecord?.clinicId

      await prisma.$transaction(async (tx) => {
         // Deduct Stock
         for (const item of prescription.items) {
             
             // Core deduction handler using FIFO
             const deductItem = async (medicineId: string, medicineName: string, reqQty: number) => {
                const product = await tx.product.findFirst({
                   where: { 
                     masterProduct: {
                       medicineId: medicineId 
                     },
                     clinicId: clinicId 
                   }
                })

                if (!product) {
                   throw new Error(`Produk untuk obat ${medicineName} tidak ditemukan di klinik ini.`)
                }

                // Use the new InventoryService for FIFO deduction
                await InventoryService.deductStock(tx, {
                    productId: product.id,
                    branchId: clinicId as string,
                    quantity: reqQty,
                    userId: pharmacistId || 'SYSTEM',
                    referenceType: 'PHARMACY_DISPENSING',
                    referenceId: id,
                    notes: `Dispensing for Prescription ${prescription.prescriptionNo}`
                });
             }

             if (item.isRacikan) {
                // Loop components and deduct
                for (const comp of (item as any).components) {
                   if (comp.medicine) {
                        const requiredQty = comp.quantity * item.quantity;
                        await deductItem(comp.medicine.id, comp.medicine.medicineName, requiredQty)
                   }
                }
             } else {
                 // Standard medication
                 const medicine = item.medicine
                 if (medicine && clinicId) {
                    await deductItem(medicine.id, medicine.medicineName, item.quantity as number)
                 }
             }
         }

         // Mark prescription as dispensed
         await tx.prescription.update({
           where: { id },
           data: {
             dispenseStatus: 'dispensed',
             pharmacistId: pharmacistId,
             counselingGiven: !!counselingGiven,
             dispenseDate: new Date()
           }
         })
      })
      return res.json({ message: 'Resep berhasil di-dispense dan stok obat telah dikurangi.' })
    }

    // Just update status (e.g. pending -> preparing -> ready)
    const updated = await prisma.prescription.update({
      where: { id },
      data: { dispenseStatus: status }
    })

    res.json({ message: 'Status resep berhasil diperbarui.', prescription: updated })
  } catch (error) {
    console.error('Error updating dispense status:', error)
    res.status(500).json({ message: (error as Error).message })
  }
}
