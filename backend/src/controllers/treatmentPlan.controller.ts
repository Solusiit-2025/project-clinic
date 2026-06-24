import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// ==================== TREATMENT PLAN ====================

export const getTreatmentPlans = async (req: Request, res: Response) => {
  try {
    const clinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const { search, status, patientId, page = '1', limit = '10' } = req.query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 10
    const skip = (pageNum - 1) * limitNum

    const simpleWhere: any = {
      ...(patientId ? { patientId: String(patientId) } : {}),
      ...(status ? { status: String(status) } : {}),
      // #3: Filter by clinicId via invoices relation (skip for admin-view / main clinic)
      ...(clinicId && !isAdminView && !patientId ? {
        invoices: { some: { clinicId: String(clinicId) } }
      } : {}),
      ...(search ? {
        OR: [
          { description: { contains: String(search), mode: 'insensitive' } },
          { patient: { name: { contains: String(search), mode: 'insensitive' } } },
          { patient: { medicalRecordNo: { contains: String(search), mode: 'insensitive' } } },
        ]
      } : {}),
    }

    const [total, plans] = await Promise.all([
      prisma.treatmentPlan.count({ where: simpleWhere }),
      prisma.treatmentPlan.findMany({
        where: simpleWhere,
        skip,
        take: limitNum,
        include: {
          patient: {
            select: { id: true, name: true, medicalRecordNo: true, phone: true, gender: true, dateOfBirth: true }
          },
          doctor: {
            select: { id: true, name: true }
          },
          visits: {
            orderBy: { order: 'asc' },
            include: { services: true }
          },
          invoices: {
            include: {
              items: true,
              payments: { orderBy: { paymentDate: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
          },
          items: true,
          // #15: Include workOrders to avoid N+1 API calls from frontend
          workOrders: {
            include: { invoiceItems: true },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // On-the-fly aggregation for total cost
    const plansWithTotal = plans.map(p => {
      let calcTotal = 0;
      p.visits.forEach(v => {
        v.services.forEach(s => {
          calcTotal += Number(s.adjustedPrice ?? s.subtotal)
        })
      });
      return { ...p, calculatedTotalAmount: calcTotal };
    });

    res.json({
      data: plansWithTotal,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (e) {
    console.error('[getTreatmentPlans] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const getTreatmentPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNo: true, phone: true, gender: true, dateOfBirth: true, address: true }
        },
        doctor: {
          select: { name: true }
        },
        visits: {
          orderBy: { order: 'asc' },
          include: {
            services: { include: { service: true } },
            statusLogs: { orderBy: { changedAt: 'desc' } }
          }
        },
        invoices: {
          include: {
            items: {
              include: {
                service: { select: { id: true, serviceCode: true, serviceName: true } }
              }
            },
            payments: { orderBy: { paymentDate: 'desc' } }
          },
          orderBy: { createdAt: 'desc' }
        },
        items: true,
        workOrders: {
          include: { invoiceItems: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!plan) {
      return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })
    }

    let calculatedTotalAmount = 0;
    plan.visits.forEach(v => {
      v.services.forEach(s => {
        calculatedTotalAmount += Number(s.adjustedPrice ?? s.subtotal);
      });
    });

    res.json({ ...plan, calculatedTotalAmount })
  } catch (e) {
    console.error('[getTreatmentPlanById] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const createTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const { patientId, description, items, doctorId } = req.body

    if (!patientId || !description) {
      return res.status(400).json({ message: 'Patient ID dan deskripsi perawatan wajib diisi' })
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return res.status(404).json({ message: 'Pasien tidak ditemukan' })
    }

    const itemsList = Array.isArray(items) ? items : []
    const totalAmount = itemsList.reduce((sum: number, item: any) => {
      return sum + ((Number(item.quantity) || 1) * (Number(item.price) || 0))
    }, 0)

    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        doctorId: doctorId || null,
        description,
        totalAmount,
        items: {
          create: itemsList.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0)
          }))
        }
      },
      include: {
        items: true
      }
    })

    res.status(201).json({ plan })
  } catch (e) {
    console.error('[createTreatmentPlan] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { description } = req.body

    const plan = await prisma.treatmentPlan.findUnique({ where: { id } })
    if (!plan) return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data: { description }
    })

    res.json(updated)
  } catch (e) {
    console.error('[updateTreatmentPlan] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const deleteTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: { visits: true, invoices: { include: { payments: true } }, workOrders: true }
    })

    if (!plan) return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })

    const hasPayments = plan.invoices.some(inv => inv.payments.length > 0)
    if (hasPayments) {
      return res.status(400).json({ message: 'Tidak dapat menghapus, karena sudah ada pembayaran' })
    }

    // #5: Check for work orders before deleting
    if (plan.workOrders.length > 0) {
      return res.status(400).json({ message: 'Tidak dapat menghapus, karena sudah ada SPK Lab Eksternal. Hapus SPK terlebih dahulu.' })
    }

    await prisma.$transaction(async (tx) => {
      for (const inv of plan.invoices) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } })
        await tx.invoice.delete({ where: { id: inv.id } })
      }
      
      // Hapus data kunjungan (beserta relasinya)
      for (const visit of plan.visits) {
        await tx.visitService.deleteMany({ where: { visitId: visit.id } })
        await tx.visitStatusLog.deleteMany({ where: { visitId: visit.id } })
        await tx.visit.delete({ where: { id: visit.id } })
      }

      await tx.treatmentPlanItem.deleteMany({ where: { treatmentPlanId: id } })
      await tx.treatmentPlan.delete({ where: { id } })
    })

    res.json({ message: 'Treatment Plan berhasil dihapus' })
  } catch (e) {
    console.error('[deleteTreatmentPlan] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

// ==================== VISIT MANAGEMENT (TAHAPAN) ====================

export const addVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { services, visitDate, notes } = req.body
    
    // services: array of { serviceId, price, quantity }

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: { visits: { orderBy: { order: 'desc' }, take: 1 } }
    })

    if (!plan) {
      return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })
    }

    if (plan.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Treatment Plan sudah selesai' })
    }

    const nextOrder = (plan.visits[0]?.order || 0) + 1

    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          treatmentPlanId: id,
          order: nextOrder,
          visitDate: visitDate ? new Date(visitDate) : null,
          notes: notes || null,
          status: 'BELUM'
        }
      })
      
      if (services && Array.isArray(services)) {
        for (const svc of services) {
           const subtotal = (Number(svc.price) || 0) * (Number(svc.quantity) || 1);
           await tx.visitService.create({
             data: {
               visitId: visit.id,
               serviceId: svc.serviceId,
               price: Number(svc.price),
               quantity: Number(svc.quantity) || 1,
               subtotal
             }
           })
        }
      }
      
      return tx.visit.findUnique({
        where: { id: visit.id },
        include: { services: { include: { service: true } } }
      })
    });

    res.status(201).json(result)
  } catch (e) {
    console.error('[addVisit] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateVisitServices = async (req: Request, res: Response) => {
  try {
    const { id, visitId } = req.params
    const { services } = req.body // full replacement array of { serviceId, price, quantity }

    const visit = await prisma.visit.findUnique({ where: { id: visitId, treatmentPlanId: id } })
    if (!visit) return res.status(404).json({ message: 'Tahap tidak ditemukan' })
    if (visit.status === 'SELESAI') return res.status(409).json({ message: 'Tidak dapat merubah layanan pada tahap yang sudah Selesai' })

    await prisma.$transaction(async (tx) => {
      await tx.visitService.deleteMany({ where: { visitId } });
      if (services && Array.isArray(services)) {
        for (const svc of services) {
           const subtotal = (Number(svc.price) || 0) * (Number(svc.quantity) || 1);
           await tx.visitService.create({
             data: {
               visitId,
               serviceId: svc.serviceId,
               price: Number(svc.price),
               quantity: Number(svc.quantity) || 1,
               subtotal
             }
           })
        }
      }
    })
    
    res.json({ message: 'Tindakan berhasil diperbarui' })
  } catch (e) {
    console.error('[updateVisitServices] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateVisitSchedule = async (req: Request, res: Response) => {
  try {
    const { id, visitId } = req.params
    const { visitDate } = req.body

    const visit = await prisma.visit.findUnique({ where: { id: visitId, treatmentPlanId: id } })
    if (!visit) return res.status(404).json({ message: 'Tahap tidak ditemukan' })
    if (visit.status === 'SELESAI') return res.status(409).json({ message: 'Tahap sudah Selesai' })

    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: { visitDate: visitDate ? new Date(visitDate) : null }
    })
    res.json(updated)
  } catch (e) {
    console.error('[updateVisitSchedule] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateVisitStatus = async (req: Request, res: Response) => {
  try {
    const { id, visitId } = req.params
    const { status } = req.body // BELUM, BERJALAN, SELESAI
    const user = (req as any).user;

    const visit = await prisma.visit.findUnique({ where: { id: visitId, treatmentPlanId: id } })
    if (!visit) return res.status(404).json({ message: 'Tahap tidak ditemukan' })
    if (visit.status === status) return res.json(visit);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.visit.update({
        where: { id: visitId },
        data: { status }
      });
      await tx.visitStatusLog.create({
        data: {
          visitId,
          fromStatus: visit.status as any,
          toStatus: status,
          changedBy: user?.name || 'System'
        }
      })
      return updated;
    })
    res.json(result)
  } catch (e) {
    console.error('[updateVisitStatus] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateVisitAdjustment = async (req: Request, res: Response) => {
  try {
    const { id, visitId } = req.params
    const { adjustments } = req.body 
    // adjustments = array of { visitServiceId, adjustedPrice, adjustmentReason }
    const user = (req as any).user;

    const visit = await prisma.visit.findUnique({ where: { id: visitId, treatmentPlanId: id } })
    if (!visit) return res.status(404).json({ message: 'Tahap tidak ditemukan' })
    
    await prisma.$transaction(async (tx) => {
      for (const adj of adjustments) {
        if (!adj.adjustmentReason) {
           throw new Error('Alasan penyesuaian (adjustmentReason) wajib diisi untuk tindakan ID ' + adj.visitServiceId);
        }
        await tx.visitService.update({
          where: { id: adj.visitServiceId },
          data: {
            adjustedPrice: Number(adj.adjustedPrice),
            adjustmentReason: adj.adjustmentReason,
            adjustedBy: user?.name || 'System',
            adjustedAt: new Date()
          }
        })
      }
    });

    res.json({ message: 'Penyesuaian harga berhasil' })
  } catch (e) {
    console.error('[updateVisitAdjustment] Error:', e)
    res.status(400).json({ message: (e as Error).message })
  }
}

export const deleteVisit = async (req: Request, res: Response) => {
  try {
    const { id, visitId } = req.params
    const visit = await prisma.visit.findUnique({ where: { id: visitId, treatmentPlanId: id } })
    if (!visit) return res.status(404).json({ message: 'Tahap tidak ditemukan' })
    
    if (visit.status === 'SELESAI') {
      return res.status(409).json({ message: 'Tahap yang sudah SELESAI tidak dapat dihapus' })
    }

    await prisma.visit.delete({ where: { id: visitId } })
    res.json({ message: 'Tahap berhasil dihapus' })
  } catch (e) {
    console.error('[deleteVisit] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['ACTIVE', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Status harus ACTIVE atau COMPLETED' })
    }

    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { name: true, medicalRecordNo: true } },
        visits: { orderBy: { order: 'asc' } },
        invoices: { include: { payments: true } }
      }
    })

    res.json(plan)
  } catch (e) {
    console.error('[updateStatus] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { items } = req.body
    const clinicId = (req as any).clinicId

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id }
    })

    if (!plan) return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Item tagihan tidak boleh kosong' })
    }

    const { getJakartaDateString } = require('../utils/date')
    const dateStr = getJakartaDateString().replace(/-/g, '')

    const result = await prisma.$transaction(async (tx) => {
      let nextInvNum = 1
      const lastInv = await tx.invoice.findFirst({
        where: { invoiceNo: { startsWith: `INV-TP-${dateStr}-` } },
        orderBy: { invoiceNo: 'desc' }
      })
      if (lastInv) {
        const parts = lastInv.invoiceNo.split('-')
        const lastNum = parseInt(parts[parts.length - 1])
        if (!isNaN(lastNum)) nextInvNum = lastNum + 1
      }

      let invoiceNo = ''
      let isUnique = false
      while (!isUnique) {
        invoiceNo = `INV-TP-${dateStr}-${nextInvNum.toString().padStart(4, '0')}`
        const existing = await tx.invoice.findUnique({ where: { invoiceNo } })
        if (!existing) isUnique = true
        else nextInvNum++
      }

      const invoiceItems = items.map((item: any) => ({
        description: item.description || item.itemName,
        quantity: item.quantity || 1,
        price: item.price || 0,
        subtotal: (item.quantity || 1) * (item.price || 0),
        serviceId: item.serviceId || null,
      }))
      const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          patientId: plan.patientId,
          clinicId: clinicId || null,
          treatmentPlanId: plan.id,
          invoiceDate: new Date(),
          subtotal,
          total: subtotal,
          isLabDeposit: req.body.isLabDeposit || false,
          status: 'pending',
          items: {
            create: invoiceItems
          }
        },
        include: {
          items: true
        }
      })

      return invoice
    }, { timeout: 15000 })

    res.status(201).json(result)
  } catch (e) {
    console.error('[createInvoice] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}
export const updateVisitServicePrice = async (req: Request, res: Response) => {
  try {
    const { id, visitId, serviceId } = req.params
    const { price, quantity } = req.body
    const userId = (req as any).user?.id

    if (price === undefined || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Harga baru tidak valid' })
    }

    const qty = quantity !== undefined ? Number(quantity) : 1;
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Kuantitas tidak valid' })
    }

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        visits: {
          where: { id: visitId },
          include: { services: { where: { id: serviceId } } }
        }
      }
    })

    if (!plan) return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })
    if (plan.status === 'COMPLETED') return res.status(400).json({ message: 'Rangkaian Perawatan sudah selesai' })

    const visit = plan.visits[0]
    if (!visit) return res.status(404).json({ message: 'Kunjungan tidak ditemukan' })
    if (visit.status === 'SELESAI') return res.status(400).json({ message: 'Tidak dapat mengubah harga pada kunjungan yang sudah Selesai' })

    const service = visit.services[0]
    if (!service) return res.status(404).json({ message: 'Layanan tidak ditemukan' })

    const newPrice = Number(price)
    const newSubtotal = newPrice * qty;

    await prisma.visitService.update({
      where: { id: serviceId },
      data: {
        price: newPrice,
        quantity: qty,
        subtotal: newSubtotal,
        adjustedPrice: null,
        adjustedBy: userId || 'SYSTEM',
        adjustedAt: new Date()
      }
    })

    res.json({ message: 'Harga dan kuantitas berhasil diperbarui' })
  } catch (e) {
    console.error('[updateVisitServicePrice] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

export const postProfitShare = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { percent } = req.body
    const clinicId = (req as any).clinicId

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        visits: {
          include: { services: true }
        },
        workOrders: true
      }
    })

    if (!plan) return res.status(404).json({ message: 'Treatment Plan tidak ditemukan' })
    if (!plan.doctorId) return res.status(400).json({ message: 'Treatment Plan tidak memiliki Dokter penanggung jawab' })
    if (plan.isProfitSharePosted) return res.status(400).json({ message: 'Profit Sharing sudah di-posting sebelumnya' })

    const sharePercent = percent !== undefined ? Number(percent) : plan.doctorProfitSharePercent

    // Hitung total layanan
    const totalServices = plan.visits.reduce((acc, visit) => {
      const visitTotal = visit.services.reduce((sum, s) => sum + s.subtotal, 0)
      return acc + visitTotal
    }, 0)

    // Hitung biaya lab eksternal
    const totalLabFees = plan.workOrders.reduce((acc, wo) => acc + wo.labFee, 0)

    // Margin = Pendapatan - Biaya Lab
    const netMargin = totalServices - totalLabFees
    const profitShareAmount = netMargin > 0 ? (netMargin * sharePercent) / 100 : 0

    await prisma.$transaction(async (tx) => {
      // 1. Update Treatment Plan
      await tx.treatmentPlan.update({
        where: { id },
        data: {
          doctorProfitSharePercent: sharePercent,
          doctorProfitShareAmount: profitShareAmount,
          isProfitSharePosted: true
        }
      })

      // 2. Create Doctor Commission
      const commission = await tx.doctorCommission.create({
        data: {
          clinicId: clinicId,
          doctorId: plan.doctorId!,
          description: `Profit Sharing Rangkaian Perawatan: ${plan.description}`,
          amount: profitShareAmount,
          type: 'TREATMENT_PLAN',
          status: 'unpaid',
          sourceId: plan.id,
          date: new Date()
        },
        include: { doctor: true }
      })

      // 3. Create Journal Entry (Accrual: Beban Jasa Dokter pada Hutang Jasa Dokter)
      if (profitShareAmount > 0) {
        const sysAccountKeys = ['DOCTOR_FEE_PAYABLE', 'DOCTOR_FEE_EXPENSE']
        const sysAccounts = await tx.systemAccount.findMany({
          where: { key: { in: sysAccountKeys }, OR: [{ clinicId }, { clinicId: null }] },
          include: { coa: true }
        })

        const getSysAcc = (key: string) => sysAccounts.find(a => a.key === key)
        const payableAcc = getSysAcc('DOCTOR_FEE_PAYABLE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '2-1102' } })
        const expenseAcc = getSysAcc('DOCTOR_FEE_EXPENSE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '6-1102' } })

        if (payableAcc && expenseAcc) {
          await tx.journalEntry.create({
            data: {
              date: new Date(),
              description: `Akrual Profit Sharing Dokter: ${commission.doctor.name} - ${plan.description}`,
              referenceNo: `PS-${plan.id.slice(0, 8).toUpperCase()}`,
              entryType: 'SYSTEM',
              clinicId,
              details: {
                create: [
                  { coaId: expenseAcc.id, debit: profitShareAmount, credit: 0, description: `Beban Jasa Dokter: ${plan.description}` },
                  { coaId: payableAcc.id, debit: 0, credit: profitShareAmount, description: `Hutang Jasa Dokter: ${commission.doctor.name}` }
                ]
              }
            }
          })
        }
      }
    })

    res.json({ message: 'Profit Sharing berhasil di-posting', amount: profitShareAmount })
  } catch (e) {
    console.error('[postProfitShare] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}
