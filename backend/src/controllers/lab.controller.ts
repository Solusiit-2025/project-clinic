import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

/**
 * Get all Lab Test Masters
 */
export const getLabTestMasters = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query
    const where: any = {}
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false

    const tests = await prisma.labTestMaster.findMany({
      where,
      include: { children: true, parents: true },
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
    const { code, name, category, unit, normalRangeText, minNormal, maxNormal, price, parentIds, childrenIds } = req.body
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
        isActive: true,
        parents: parentIds && parentIds.length > 0 ? { connect: parentIds.map((id: string) => ({ id })) } : undefined,
        children: childrenIds && childrenIds.length > 0 ? { connect: childrenIds.map((id: string) => ({ id })) } : undefined
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
    const { code, name, category, unit, normalRangeText, minNormal, maxNormal, price, isActive, parentIds, childrenIds } = req.body
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
        price: parseFloat(price) || 0,
        isActive,
        parents: { set: parentIds ? parentIds.map((id: string) => ({ id })) : [] },
        children: { set: childrenIds ? childrenIds.map((id: string) => ({ id })) : [] }
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
    
    const where: any = {}
    if (status === 'pending') {
      where.status = { in: ['pending', 'in_progress'] }
    } else if (status) {
      where.status = String(status)
    }

    if (clinicId) {
      where.OR = [
        { medicalRecord: { clinicId: String(clinicId) } },
        { registration: { clinicId: String(clinicId) } }
      ]
    }

    const orders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: { select: { name: true, medicalRecordNo: true } },
        doctor: { select: { name: true } },
        registration: { select: { isDirectLab: true, clinicId: true } },
        medicalRecord: {
          select: {
            id: true,
            clinicId: true,
            labNotes: true,
            clinic: true,
            consultationDraft: true
          }
        },
        attachments: true,
        results: {
          include: { testMaster: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    })

    console.log(`[Lab-Order-Debug] Found ${orders.length} orders for clinic ${clinicId}, status ${status}`)

    // Enrich each order with a summary of ordered tests
    const enriched = orders.map(order => {
      let orderedTests: string[] = []
      
      if (order.isDirectLab) {
        // For direct lab, test names are in the results relation
        orderedTests = (order.results as any[] || [])
          .map(r => r.testMaster?.name)
          .filter(Boolean)
      } else {
        // For doctor orders, tests are in consultation draft
        const draft = (order.medicalRecord as any)?.consultationDraft
        orderedTests = draft?.services
          ?.filter((s: any) => s.isLab)
          .map((s: any) => s.name) || []
      }

      return {
        ...order,
        labNotesSummary: (order.medicalRecord as any)?.labNotes || (order.isDirectLab ? 'Pemeriksaan Mandiri' : ''),
        orderedTestsSummary: orderedTests
      }
    })

    res.json(enriched)
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
          },
        },
        registration: {
          include: { clinic: true }
        },
        results: {
          include: { testMaster: true }
        },
        attachments: true
      }
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Attach doctor's lab notes and ordered tests to the response
    const enriched = {
      ...order,
      doctorInstructions: {
        labNotes: (order.medicalRecord as any)?.labNotes || (order.isDirectLab ? 'Pemeriksaan Mandiri' : ''),
        labResults: (order.medicalRecord as any)?.labResults || '',
        // Lab tests requested:
        orderedTests: order.isDirectLab 
          ? (order.results as any[]).map(r => ({ name: r.testMaster?.name, code: r.testMaster?.code }))
          : (
            (order.medicalRecord as any)?.consultationDraft?.services
              ?.filter((s: any) => s.isLab)
              .map((s: any) => ({ name: s.name, price: s.price, code: s.code })) ||
            []
          ),
      },
      // Fallback clinic info for direct lab
      clinic: (order as any).medicalRecord?.clinic || (order as any).registration?.clinic || null
    }

    res.json(enriched)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update Lab Results
 * When status = 'completed', also sync invoice items with actual testMaster prices
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
        },
        include: {
          medicalRecord: {
            select: { id: true, patientId: true, clinicId: true }
          },
          registration: {
            select: { id: true, patientId: true, clinicId: true }
          },
          patient: { select: { id: true } }
        }
      })

      // 4. SYNC INVOICE — Only when marking as COMPLETED (final send to doctor)
      if (status === 'completed' && results && Array.isArray(results) && results.length > 0) {
        const mr = updatedOrder.medicalRecord
        const reg = updatedOrder.registration
        const targetPatientId = updatedOrder.patientId
        const targetClinicId = mr?.clinicId || reg?.clinicId

        // NEW: Update Queue Status for Direct Lab to enable payment
        if (updatedOrder.isDirectLab && updatedOrder.registrationId) {
          await tx.queueNumber.updateMany({
            where: { registrationId: updatedOrder.registrationId },
            data: { status: 'completed' }
          })
          
          // Notify socket listeners
          const io = (req as any).app?.get('io')
          if (io && targetClinicId) {
            io.to(`clinic:${targetClinicId}`).emit('queue-updated', { type: 'STATUS_CHANGED', clinicId: targetClinicId })
          }
        }

        if (targetClinicId) {
          // Find the active invoice for this patient
          const invoice = await tx.invoice.findFirst({
            where: {
              patientId: targetPatientId,
              clinicId: targetClinicId,
              status: { in: ['unpaid', 'draft'] }
            },
            orderBy: { createdAt: 'desc' }
          })

          if (invoice) {
            // Find or create the LAB-GEN service used as a grouping service for invoice items
            let labService = await tx.service.findFirst({
              where: {
                OR: [
                  { serviceCode: 'LAB-GEN' },
                  { serviceName: { contains: 'Pemeriksaan Laboratorium', mode: 'insensitive' } }
                ],
                AND: {
                  OR: [{ clinicId: targetClinicId }, { clinic: { isMain: true } }]
                }
              }
            })
            if (!labService) {
              labService = await tx.service.create({
                data: {
                  serviceCode: 'LAB-GEN',
                  serviceName: 'Pemeriksaan Laboratorium',
                  price: 0,
                  isActive: true,
                  clinicId: targetClinicId
                }
              })
            }

            // Remove existing lab invoice items for this order (prevent duplicates on re-send)
            // We identify them by description containing the lab order no or by serviceId=LAB-GEN
            await tx.invoiceItem.deleteMany({
              where: {
                invoiceId: invoice.id,
                serviceId: labService.id
              }
            })

            // Re-insert accurate line items using actual testMaster prices
            let labTotal = 0
            for (const resItem of results) {
              const testMaster = await tx.labTestMaster.findUnique({
                where: { id: resItem.testMasterId }
              })
              if (testMaster) {
                const itemPrice = testMaster.price || 0
                const subtotal = itemPrice * 1
                await tx.invoiceItem.create({
                  data: {
                    invoiceId: invoice.id,
                    serviceId: labService.id,
                    description: testMaster.name,
                    quantity: 1,
                    price: itemPrice,
                    subtotal
                  }
                })
                labTotal += subtotal
              }
            }

            // Recalculate invoice total from all items
            const allItems = await tx.invoiceItem.findMany({
              where: { invoiceId: invoice.id }
            })
            const newSubtotal = allItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)

            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                subtotal: newSubtotal,
                total: newSubtotal
              }
            })

            console.log(`[Lab] Invoice ${invoice.id} updated with ${results.length} lab tests, total lab: Rp ${labTotal.toLocaleString('id-ID')}`)
          }
        }
      }

      return updatedOrder
    }, {
      timeout: 30000
    })
    
    res.json(result)
  } catch (e) {
    console.error('[Lab] updateLabResults error:', e)
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
