import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

/**
 * Get all Lab Test Masters
 */
export const getLabTestMasters = async (req: Request, res: Response) => {
  try {
    const tests = await prisma.labTestMaster.findMany({
      orderBy: { category: 'asc' }
    })
    res.json(tests)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Create Lab Test Master
 */
export const createLabTestMaster = async (req: Request, res: Response) => {
  try {
    const { code, name, category, unit, normalRangeText, minNormal, maxNormal, price } = req.body
    const test = await prisma.labTestMaster.create({
      data: {
        code,
        name,
        category,
        unit,
        normalRangeText,
        minNormal: minNormal ? parseFloat(minNormal) : null,
        maxNormal: maxNormal ? parseFloat(maxNormal) : null,
        price: parseFloat(price) || 0,
        isActive: true
      }
    })
    res.status(201).json(test)
  } catch (e) {
    res.status(400).json({ message: (e as Error).message })
  }
}

/**
 * Update Lab Test Master
 */
export const updateLabTestMaster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { code, name, category, unit, normalRangeText, minNormal, maxNormal, price, isActive } = req.body
    const test = await prisma.labTestMaster.update({
      where: { id },
      data: {
        code,
        name,
        category,
        unit,
        normalRangeText,
        minNormal: minNormal ? parseFloat(minNormal) : null,
        maxNormal: maxNormal ? parseFloat(maxNormal) : null,
        price: price ? parseFloat(price) : undefined,
        isActive
      }
    })
    res.json(test)
  } catch (e) {
    res.status(400).json({ message: (e as Error).message })
  }
}

/**
 * Delete Lab Test Master
 */
export const deleteLabTestMaster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.labTestMaster.delete({ where: { id } })
    res.json({ message: 'Lab test master deleted successfully' })
  } catch (e) {
    res.status(400).json({ message: (e as Error).message })
  }
}

/**
 * Get Pending Lab Orders
 */
export const getLabOrders = async (req: Request, res: Response) => {
  try {
    const status = req.query.status
    const clinicId = req.headers['x-clinic-id'] || req.query.clinicId
    
    const where: any = {
      ...(clinicId ? { medicalRecord: { clinicId: String(clinicId) } } : {})
    }

    if (status === 'pending') {
      where.status = { in: ['pending', 'in_progress'] }
    } else if (status) {
      where.status = String(status)
    }

    const orders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: { select: { name: true, medicalRecordNo: true } },
        doctor: { select: { name: true } },
        medicalRecord: {
          include: { clinic: true }
        },
        attachments: true
      },
      orderBy: { orderDate: 'desc' }
    })
    res.json(orders)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Get Lab Order Details with Results
 */
export const getLabOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const order = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        medicalRecord: {
          include: {
            services: { include: { service: true } },
            clinic: true
          }
        },
        results: {
          include: { testMaster: true }
        },
        attachments: true
      }
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update Lab Results
 */
export const updateLabResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params // labOrderId
    const { results, status = 'completed', clinicalNotes } = req.body // results: [{ testMasterId, resultValue, notes, isCritical }]
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing results for this order
      await tx.labResultDetail.deleteMany({ where: { labOrderId: id } })
      
      // 2. Create new results
      if (results && Array.isArray(results)) {
        for (const resItem of results) {
          await tx.labResultDetail.create({
            data: {
              labOrderId: id,
              testMasterId: resItem.testMasterId,
              resultValue: String(resItem.resultValue),
              notes: resItem.notes,
              isCritical: !!resItem.isCritical
            }
          })
        }
      }
      
      // 3. Update order status
      const updatedOrder = await tx.labOrder.update({
        where: { id },
        data: { 
          status,
          clinicalNotes,
          completedAt: status === 'completed' ? new Date() : null
        }
      })
      
      return updatedOrder
    })
    
    res.json(result)
  } catch (e) {
    res.status(400).json({ message: (e as Error).message })
  }
}

/**
 * Upload Lab Attachments
 */
export const uploadLabAttachments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params // labOrderId
    const files = req.files as Express.Multer.File[]

    console.log(`[Lab Upload] Uploading ${files?.length || 0} files for Order ID: ${id}`)

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const attachments = await Promise.all(
      files.map(file => {
        console.log(`[Lab Upload] Saving file: ${file.originalname} -> ${file.filename}`)
        return prisma.labOrderAttachment.create({
          data: {
            labOrderId: id,
            fileUrl: `/uploads/lab/${file.filename}`,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size
          }
        })
      })
    )

    res.status(201).json(attachments)
  } catch (e) {
    console.error('[Lab Upload Error]', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Delete Lab Attachment
 */
export const deleteLabAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const attachment = await prisma.labOrderAttachment.findUnique({ where: { id } })

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' })
    }

    console.log(`[Lab Delete] Deleting attachment ID: ${id}, Path: ${attachment.fileUrl}`)

    // Delete file from storage
    const filePath = path.join(process.cwd(), 'public', attachment.fileUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from DB
    await prisma.labOrderAttachment.delete({ where: { id } })

    res.json({ message: 'Attachment deleted successfully' })
  } catch (e) {
    console.error('[Lab Delete Error]', e)
    res.status(500).json({ message: (e as Error).message })
  }
}
