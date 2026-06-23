import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getJakartaDateString } from '../utils/date'

// ──────────────────────────────────────────────
//  DENTAL LAB WORK ORDER — SPK Lab Eksternal
//  Berbeda dari LabOrder (lab medis internal).
//  SPK ini khusus untuk dental lab gigi eksternal
//  (Crown, Gigi Palsu, Veneer, dll).
// ──────────────────────────────────────────────

const WO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_DP: 'Menunggu DP',
  SENT_TO_LAB: 'Dikirim ke Lab',
  RECEIVED: 'Diterima dari Lab',
  FITTED: 'Sudah Dipasang',
  CANCELLED: 'Dibatalkan',
}

/**
 * GET /api/dental-lab/work-orders
 * List semua Work Order dengan filter
 */
export const getWorkOrders = async (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate, treatmentPlanId, doctorId, page = '1', limit = '20' } = req.query
    const clinicId = (req as any).clinicId

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 20
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      ...(status ? { status: String(status) } : {}),
      ...(treatmentPlanId ? { treatmentPlanId: String(treatmentPlanId) } : {}),
      ...(doctorId ? { doctorId: String(doctorId) } : {}),
      ...(search ? {
        OR: [
          { workOrderNo: { contains: String(search), mode: 'insensitive' } },
          { patient: { name: { contains: String(search), mode: 'insensitive' } } },
          { labName: { contains: String(search), mode: 'insensitive' } },
          { itemDescription: { contains: String(search), mode: 'insensitive' } },
        ]
      } : {}),
      ...(startDate ? { createdAt: { gte: new Date(String(startDate)) } } : {}),
      ...(endDate ? { createdAt: { lte: new Date(String(endDate) + 'T23:59:59') } } : {}),
    }

    const [total, workOrders] = await Promise.all([
      prisma.dentalLabWorkOrder.count({ where }),
      prisma.dentalLabWorkOrder.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          patient: {
            select: { id: true, name: true, medicalRecordNo: true, phone: true }
          },
          treatmentPlan: {
            select: {
              id: true,
              description: true,
              totalAmount: true,
              status: true,
              invoices: {
                select: { id: true, status: true, total: true, amountPaid: true }
              },
              visits: {
                orderBy: { visitDate: 'asc' },
                select: {
                  id: true,
                  visitDate: true,
                  status: true,
                  order: true,
                  services: {
                    select: {
                      id: true,
                      quantity: true,
                      price: true,
                      subtotal: true,
                      adjustedPrice: true,
                      service: { select: { id: true, serviceName: true, category: true } }
                    }
                  }
                }
              }
            }
          },
          doctor: {
            select: { id: true, name: true, specialization: true }
          },
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    res.json({
      data: workOrders,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (e) {
    console.error('[getWorkOrders] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * GET /api/dental-lab/work-orders/:id
 * Detail satu Work Order
 */
export const getWorkOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const wo = await prisma.dentalLabWorkOrder.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNo: true, phone: true, address: true, dateOfBirth: true }
        },
        treatmentPlan: {
          include: {
            invoices: {
              include: {
                items: true,
                payments: { orderBy: { paymentDate: 'desc' } }
              }
            },
            items: true,
            visits: {
              orderBy: { order: 'asc' },
              include: {
                services: {
                  include: {
                    service: { select: { id: true, serviceName: true, category: true } }
                  }
                }
              }
            }
          }
        },
        doctor: true,
        attachments: true
      }
    })

    if (!wo) return res.status(404).json({ message: 'Work Order tidak ditemukan' })

    res.json(wo)
  } catch (e) {
    console.error('[getWorkOrderById] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * POST /api/dental-lab/work-orders
 * Buat Work Order baru.
 * GUARD: Invoice dari Treatment Plan harus sudah minimal PARTIAL (ada DP).
 * Hanya bisa dilakukan oleh Dokter.
 */
export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const {
      treatmentPlanId,
      labName,
      labContact,
      labAddress,
      itemDescription,
      shade,
      size,
      toothNumber,
      estimatedDate,
      labFee,
      notes,
      jobType,
      material,
      stage,
      doctorId
    } = req.body

    // if itemDescription is not provided, combine jobType and material
    const finalItemDescription = itemDescription || `${jobType || ''} - ${material || ''}`.trim()

    const createdBy = (req as any).user?.id

    if (!treatmentPlanId || !labName || !finalItemDescription) {
      return res.status(400).json({ message: 'Treatment Plan, Nama Lab, dan Deskripsi Item wajib diisi' })
    }

    // 1. Fetch Treatment Plan beserta invoices-nya
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: {
        invoices: {
          select: { id: true, status: true, amountPaid: true, total: true }
        }
      }
    })

    if (!plan) {
      return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })
    }

    if (plan.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Treatment Plan sudah selesai. Tidak dapat membuat Work Order baru.' })
    }

    // 2. Tentukan Status Awal SPK berdasarkan Pembayaran DP
    const totalPaid = plan.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)
    const hasPayment = totalPaid > 0
    const hasPartialOrPaidInvoice = plan.invoices.some(inv =>
      inv.status === 'partial' || inv.status === 'paid'
    )

    // Jika belum bayar DP, SPK tetap bisa dibuat tapi statusnya 'DRAFT' (atau 'PENDING_DP')
    // Jika sudah bayar DP, status langsung 'SENT_TO_LAB'
    let initialStatus = 'PENDING_DP'
    if (hasPayment || hasPartialOrPaidInvoice) {
      initialStatus = 'SENT_TO_LAB'
    }

    // 3. Generate Work Order Number
    const dateStr = getJakartaDateString().replace(/-/g, '')
    let nextNum = 1
    const lastWO = await prisma.dentalLabWorkOrder.findFirst({
      where: { workOrderNo: { startsWith: `SPK-${dateStr}-` } },
      orderBy: { workOrderNo: 'desc' }
    })
    if (lastWO) {
      const parts = lastWO.workOrderNo.split('-')
      const lastNum = parseInt(parts[parts.length - 1])
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }

    let workOrderNo = ''
    let isUnique = false
    while (!isUnique) {
      workOrderNo = `SPK-${dateStr}-${nextNum.toString().padStart(4, '0')}`
      const existing = await prisma.dentalLabWorkOrder.findUnique({ where: { workOrderNo } })
      if (!existing) isUnique = true
      else nextNum++
    }

    // 4. Proses Attachments jika ada
    const attachments = (req.files as Express.Multer.File[]) || []
    const attachmentData = attachments.map(file => ({
      fileUrl: `/uploads/dental-lab/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype
    }))

    // 5. Buat Work Order
    const workOrder = await prisma.dentalLabWorkOrder.create({
      data: {
        workOrderNo,
        treatmentPlanId,
        patientId: plan.patientId,
        labName,
        labContact: labContact || null,
        labAddress: labAddress || null,
        itemDescription: finalItemDescription,
        jobType: jobType || null,
        material: material || null,
        stage: stage || null,
        doctorId: doctorId || null,
        shade: shade || null,
        size: size || null,
        toothNumber: toothNumber || null,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        labFee: parseFloat(labFee) || 0,
        notes: notes || null,
        status: initialStatus as any,
        createdBy: createdBy || null,
        attachments: {
          create: attachmentData
        }
      },
      include: {
        patient: {
          select: { name: true, medicalRecordNo: true, phone: true }
        },
        treatmentPlan: {
          select: { description: true }
        },
        doctor: {
          select: { id: true, name: true, specialization: true }
        },
        attachments: true
      }
    })

    console.log(`[DentalLab] Work Order ${workOrderNo} dibuat untuk pasien ${plan.patientId}`)
    res.status(201).json(workOrder)
  } catch (e) {
    console.error('[createWorkOrder] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * PUT /api/dental-lab/work-orders/:id
 * Update Work Order. Hanya bisa jika status DRAFT atau PENDING_DP
 */
export const updateWorkOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { labName, labContact, labAddress, itemDescription, shade, size, toothNumber, estimatedDate, labFee, notes, jobType, material, stage } = req.body

    const wo = await prisma.dentalLabWorkOrder.findUnique({ where: { id } })
    if (!wo) return res.status(404).json({ message: 'Work Order tidak ditemukan' })

    if (wo.status !== 'DRAFT' && wo.status !== 'PENDING_DP') {
       return res.status(400).json({ message: `Hanya SPK berstatus DRAFT atau Menunggu DP yang bisa diubah. Status saat ini: ${wo.status}` })
    }

    const updated = await prisma.dentalLabWorkOrder.update({
      where: { id },
      data: {
        labName,
        labContact: labContact || null,
        labAddress: labAddress || null,
        itemDescription,
        jobType: jobType || null,
        material: material || null,
        stage: stage || null,
        shade: shade || null,
        size: size || null,
        toothNumber: toothNumber || null,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        labFee: parseFloat(labFee) || 0,
        notes: notes || null,
      }
    })
    res.json(updated)
  } catch (e) {
    console.error('[updateWorkOrder] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * PATCH /api/dental-lab/work-orders/:id/status
 * Update status Work Order. Alur: DRAFT → SENT_TO_LAB → RECEIVED → FITTED
 * Saat status RECEIVED: trigger notifikasi ke Nurse/Admin.
 */
export const updateWorkOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, sentDate, receivedDate, fittedDate, notes } = req.body
    const updatedBy = (req as any).user?.id
    const clinicId = (req as any).clinicId

    const validStatuses = ['DRAFT', 'SENT_TO_LAB', 'RECEIVED', 'FITTED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` })
    }

    const wo = await prisma.dentalLabWorkOrder.findUnique({
      where: { id },
      include: {
        patient: { select: { name: true } },
        treatmentPlan: { select: { description: true } }
      }
    })
    if (!wo) return res.status(404).json({ message: 'Work Order tidak ditemukan' })

    // Update data tambahan berdasarkan status
    const updateData: any = {
      status,
      updatedBy: updatedBy || null,
      notes: notes !== undefined ? notes : wo.notes,
    }

    if (status === 'SENT_TO_LAB') {
      updateData.sentDate = sentDate ? new Date(sentDate) : new Date()
    }
    if (status === 'RECEIVED') {
      updateData.receivedDate = receivedDate ? new Date(receivedDate) : new Date()
    }
    if (status === 'FITTED') {
      updateData.fittedDate = fittedDate ? new Date(fittedDate) : new Date()
    }

    const updated = await prisma.dentalLabWorkOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { name: true, medicalRecordNo: true } },
        treatmentPlan: { select: { description: true } }
      }
    })

    // 🔔 TRIGGER NOTIFIKASI — Saat barang diterima dari lab
    if (status === 'RECEIVED' && clinicId) {
      try {
        // Simpan notifikasi ke database
        await prisma.notification.create({
          data: {
            clinicId,
            targetRole: 'NURSE',
            title: '📦 Barang dari Lab Sudah Tiba!',
            message: `Barang Lab untuk pasien ${wo.patient.name} (${wo.workOrderNo}) sudah diterima. Silakan hubungi pasien untuk jadwal pemasangan.`,
            type: 'LAB_RECEIVED',
            referenceId: wo.id,
            isRead: false,
          }
        })

        // Emit Socket.IO untuk real-time notification
        const io = (req as any).app?.get('io')
        if (io) {
          io.to(`clinic:${clinicId}`).emit('dental-lab-received', {
            type: 'LAB_RECEIVED',
            workOrderId: wo.id,
            workOrderNo: wo.workOrderNo,
            patientName: wo.patient.name,
            description: wo.treatmentPlan?.description,
            message: `Barang Lab untuk ${wo.patient.name} sudah tiba!`
          })
          console.log(`[DentalLab] 🔔 Notifikasi dikirim ke clinic:${clinicId}`)
        }
      } catch (notifErr) {
        // Jangan gagalkan update WO jika notifikasi error
        console.error('[DentalLab] Notifikasi gagal, tapi WO tetap diupdate:', notifErr)
      }
    }

    console.log(`[DentalLab] WO ${wo.workOrderNo} status → ${status} (by: ${updatedBy})`)
    res.json(updated)
  } catch (e) {
    console.error('[updateWorkOrderStatus] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * DELETE /api/dental-lab/work-orders/:id
 * Hapus Work Order. Hanya bisa jika status DRAFT.
 */
export const deleteWorkOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const wo = await prisma.dentalLabWorkOrder.findUnique({ where: { id } })
    if (!wo) return res.status(404).json({ message: 'Work Order tidak ditemukan' })

    if (wo.status !== 'DRAFT') {
      return res.status(400).json({
        message: `Work Order tidak bisa dihapus karena status sudah "${WO_STATUS_LABELS[wo.status]}". Hanya Work Order berstatus DRAFT yang bisa dihapus.`
      })
    }

    await prisma.dentalLabWorkOrder.delete({ where: { id } })
    res.json({ message: 'Work Order berhasil dihapus' })
  } catch (e) {
    console.error('[deleteWorkOrder] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * GET /api/dental-lab/work-orders/:id/print-data
 * Ambil semua data yang diperlukan untuk mencetak SPK (termasuk info klinik).
 */
export const getWorkOrderPrintData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const clinicId = (req as any).clinicId

    const [wo, clinic] = await Promise.all([
      prisma.dentalLabWorkOrder.findUnique({
        where: { id },
        include: {
          patient: true,
          treatmentPlan: {
            include: {
              items: true,
              invoices: {
                select: { invoiceNo: true, status: true, total: true, amountPaid: true }
              }
            }
          },
          doctor: true,
          attachments: true
        }
      }),
      clinicId ? prisma.clinic.findUnique({ where: { id: clinicId } }) : null
    ])

    if (!wo) return res.status(404).json({ message: 'Work Order tidak ditemukan' })

    res.json({ workOrder: wo, clinic })
  } catch (e) {
    console.error('[getWorkOrderPrintData] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * GET /api/dental-lab/stats
 * Summary statistik untuk dashboard monitoring
 */
export const getWorkOrderStats = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.query
    const baseWhere: any = doctorId ? { doctorId: String(doctorId) } : {}

    const [draft, pending, sent, received, fitted, total] = await Promise.all([
      prisma.dentalLabWorkOrder.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.dentalLabWorkOrder.count({ where: { ...baseWhere, status: 'PENDING_DP' } }),
      prisma.dentalLabWorkOrder.count({ where: { ...baseWhere, status: 'SENT_TO_LAB' } }),
      prisma.dentalLabWorkOrder.count({ where: { ...baseWhere, status: 'RECEIVED' } }),
      prisma.dentalLabWorkOrder.count({ where: { ...baseWhere, status: 'FITTED' } }),
      prisma.dentalLabWorkOrder.count({ where: baseWhere }),
    ])

    res.json({ draft, pending, sent, received, fitted, total })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
