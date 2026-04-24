/**
 * Asset Management Controller
 * ===========================
 * Mengelola operasi tambahan untuk asset management:
 * 1. Maintenance Records
 * 2. Asset Transfers
 * 3. Audit Logs
 * 4. Insurance Tracking
 */

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// Helper for COA resolution
async function resolveCoa(key: string, fallbackCode: string, clinicId: string) {
  const sys = await prisma.systemAccount.findFirst({
    where: { key, OR: [{ clinicId }, { clinicId: null }] },
    include: { coa: true },
    orderBy: { clinicId: 'desc' },
  })
  if (sys?.coa) return sys.coa

  const coa = await prisma.chartOfAccount.findFirst({
    where: { code: fallbackCode, OR: [{ clinicId }, { clinicId: null }] },
  })
  return coa
}

// ─── 1. ASSET MAINTENANCE ───────────────────────────────────────────────────

/**
 * GET /api/assets/maintenance-all
 * Get all maintenance records across all assets
 */
export const getAllMaintenance = async (req: Request, res: Response) => {
  try {
    const { type, clinicId, startDate, endDate } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const targetClinicId = clinicId ? String(clinicId) : (isAdminView ? undefined : currentClinicId)

    const maintenance = await prisma.assetMaintenance.findMany({
      where: {
        ...(type ? { maintenanceType: String(type) } : {}),
        ...(targetClinicId ? { asset: { clinicId: targetClinicId } } : {}),
        ...(startDate && endDate ? {
          maintenanceDate: {
            gte: new Date(`${startDate}T00:00:00+07:00`),
            lte: new Date(`${endDate}T23:59:59+07:00`)
          }
        } : {})
      },
      orderBy: { maintenanceDate: 'desc' },
      include: {
        asset: {
          include: {
            clinic: { select: { name: true, code: true } }
          }
        }
      }
    })

    res.json(maintenance)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/assets/:id/maintenance
 * Get all maintenance records for an asset
 */
export const getAssetMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { type, startDate, endDate } = req.query

    const maintenance = await prisma.assetMaintenance.findMany({
      where: {
        assetId: id,
        ...(type ? { maintenanceType: String(type) } : {}),
        ...(startDate && endDate ? {
          maintenanceDate: {
            gte: new Date(`${startDate}T00:00:00+07:00`),
            lte: new Date(`${endDate}T23:59:59+07:00`)
          }
        } : {})
      },
      orderBy: { maintenanceDate: 'desc' },
      include: {
        asset: {
          select: {
            assetCode: true,
            assetName: true,
            assetType: true,
            condition: true
          }
        }
      }
    })

    res.json(maintenance)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/assets/:id/maintenance
 * Create a new maintenance record
 */
export const createAssetMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { maintenanceDate, maintenanceType, description, cost, performedBy, nextMaintenanceDate, notes } = req.body
    const userId = (req as any).userId

    if (!maintenanceDate || !maintenanceType || !description) {
      return res.status(400).json({ message: 'maintenanceDate, maintenanceType, dan description wajib diisi' })
    }

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan' })

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create maintenance record
      const maintenance = await tx.assetMaintenance.create({
        data: {
          assetId: id,
          maintenanceDate: new Date(`${maintenanceDate}T00:00:00+07:00`),
          maintenanceType,
          description,
          cost: cost ? Number(cost) : undefined,
          performedBy,
          nextMaintenanceDate: nextMaintenanceDate ? new Date(`${nextMaintenanceDate}T00:00:00+07:00`) : undefined,
          notes
        }
      })

      // 2. Update asset last maintenance date
      await tx.asset.update({
        where: { id },
        data: { lastMaintenanceDate: new Date(`${maintenanceDate}T00:00:00+07:00`) }
      })

      // 3. Create Journal Entry if cost > 0
      const maintenanceCost = cost ? Number(cost) : 0
      if (maintenanceCost > 0) {
        const assetClinicId = asset.clinicId || (req as any).clinicId
        const expenseCoa = await resolveCoa('MAINTENANCE_EXPENSE', '6-1102', assetClinicId)
        
        const cashAccount = await tx.systemAccount.findFirst({
          where: { key: 'CASH_ACCOUNT', OR: [{ clinicId: assetClinicId }, { clinicId: null }] },
          include: { coa: true },
          orderBy: { clinicId: 'desc' }
        })
        const creditCoa = cashAccount?.coa || await tx.chartOfAccount.findFirst({
          where: { code: '1-1101', OR: [{ clinicId: assetClinicId }, { clinicId: null }] }
        })

        if (expenseCoa && creditCoa) {
          await tx.journalEntry.create({
            data: {
              date: new Date(`${maintenanceDate}T00:00:00+07:00`),
              description: `Pemeliharaan Aset: ${asset.assetName} (${asset.assetCode})`,
              referenceNo: `MAINT-${maintenance.id.slice(-8)}`,
              entryType: 'SYSTEM',
              clinicId: assetClinicId,
              details: {
                create: [
                  { coaId: expenseCoa.id, debit: maintenanceCost, credit: 0, description: `Beban Pemeliharaan ${asset.assetName}` },
                  { coaId: creditCoa.id, debit: 0, credit: maintenanceCost, description: `Pembayaran Pemeliharaan ${asset.assetName}` }
                ]
              }
            }
          })
        }
      }

      // 4. Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: id,
          action: 'MAINTENANCE',
          fieldChanged: 'lastMaintenanceDate',
          oldValue: asset.lastMaintenanceDate?.toISOString() || null,
          newValue: new Date(`${maintenanceDate}T00:00:00+07:00`).toISOString(),
          changedBy: userId,
          notes: `Maintenance ${maintenanceType}: ${description}`
        }
      })

      return maintenance
    })

    res.status(201).json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/assets/maintenance/:maintenanceId
 * Update maintenance record
 */
export const updateAssetMaintenance = async (req: Request, res: Response) => {
  try {
    const { maintenanceId } = req.params
    const { maintenanceDate, maintenanceType, description, cost, performedBy, nextMaintenanceDate, notes } = req.body
    const userId = (req as any).userId

    const maintenance = await prisma.assetMaintenance.findUnique({
      where: { id: maintenanceId },
      include: { asset: true }
    })
    if (!maintenance) return res.status(404).json({ message: 'Record maintenance tidak ditemukan' })

    const updated = await prisma.$transaction(async (tx) => {
      const oldData = { ...maintenance }
      
      const updatedMaintenance = await tx.assetMaintenance.update({
        where: { id: maintenanceId },
        data: {
          ...(maintenanceDate && { maintenanceDate: new Date(`${maintenanceDate}T00:00:00+07:00`) }),
          ...(maintenanceType && { maintenanceType }),
          ...(description && { description }),
          ...(cost !== undefined && { cost: Number(cost) }),
          ...(performedBy && { performedBy }),
          ...(nextMaintenanceDate && { nextMaintenanceDate: new Date(`${nextMaintenanceDate}T00:00:00+07:00`) }),
          ...(notes && { notes })
        }
      })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: maintenance.assetId,
          action: 'UPDATE_MAINTENANCE',
          fieldChanged: 'maintenance_record',
          oldValue: JSON.stringify(oldData),
          newValue: JSON.stringify(updatedMaintenance),
          changedBy: userId,
          notes: 'Update maintenance record'
        }
      })

      return updatedMaintenance
    })

    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * DELETE /api/assets/maintenance/:maintenanceId
 * Delete maintenance record
 */
export const deleteAssetMaintenance = async (req: Request, res: Response) => {
  try {
    const { maintenanceId } = req.params
    const userId = (req as any).userId

    const maintenance = await prisma.assetMaintenance.findUnique({
      where: { id: maintenanceId },
      include: { asset: true }
    })
    if (!maintenance) return res.status(404).json({ message: 'Record maintenance tidak ditemukan' })

    await prisma.$transaction(async (tx) => {
      await tx.assetMaintenance.delete({ where: { id: maintenanceId } })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: maintenance.assetId,
          action: 'DELETE_MAINTENANCE',
          fieldChanged: null,
          oldValue: JSON.stringify(maintenance),
          newValue: null,
          changedBy: userId,
          notes: 'Hapus maintenance record'
        }
      })
    })

    res.json({ message: 'Maintenance record berhasil dihapus' })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 2. ASSET TRANSFER ──────────────────────────────────────────────────────

/**
 * GET /api/assets/:id/transfers
 * Get all transfer records for an asset
 */
export const getAssetTransfers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.query

    const transfers = await prisma.assetTransfer.findMany({
      where: {
        assetId: id,
        ...(status ? { status: String(status) } : {})
      },
      orderBy: { transferDate: 'desc' },
      include: {
        asset: {
          select: {
            assetCode: true,
            assetName: true,
            assetType: true
          }
        },
        fromClinic: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        toClinic: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    res.json(transfers)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/assets/:id/transfer
 * Create a new asset transfer request
 */
export const createAssetTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { toClinicId, transferDate, transferValue, reason, notes } = req.body
    const userId = (req as any).userId
    const currentClinicId = (req as any).clinicId

    if (!toClinicId || !transferDate) {
      return res.status(400).json({ message: 'toClinicId dan transferDate wajib diisi' })
    }

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan' })
    if (asset.status === 'retired') return res.status(400).json({ message: 'Aset sudah dihapus, tidak bisa ditransfer' })

    const toClinic = await prisma.clinic.findUnique({ where: { id: toClinicId } })
    if (!toClinic) return res.status(404).json({ message: 'Klinik tujuan tidak ditemukan' })

    const bookValue = asset.purchasePrice - asset.totalDepreciated
    const transferVal = transferValue ? Number(transferValue) : bookValue

    // Generate transfer number
    const transferCount = await prisma.assetTransfer.count({
      where: { transferDate: { gte: new Date(new Date().getFullYear(), 0, 1) } }
    })
    const transferNo = `ATF-${new Date().getFullYear()}-${(transferCount + 1).toString().padStart(4, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.assetTransfer.create({
        data: {
          transferNo,
          assetId: id,
          fromClinicId: asset.clinicId || currentClinicId,
          toClinicId,
          transferDate: new Date(`${transferDate}T00:00:00+07:00`),
          transferValue: transferVal,
          reason,
          notes,
          status: 'pending'
        }
      })

      // Update asset status to "inactive" during transfer
      await tx.asset.update({
        where: { id },
        data: { status: 'inactive' }
      })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: id,
          action: 'TRANSFER_REQUEST',
          fieldChanged: 'status',
          oldValue: asset.status,
          newValue: 'inactive',
          changedBy: userId,
          notes: `Transfer request to ${toClinic.name}: ${reason || 'No reason provided'}`
        }
      })

      return transfer
    })

    res.status(201).json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/assets/transfer/:transferId/approve
 * Approve asset transfer
 */
export const approveAssetTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params
    const { approvedBy } = req.body
    const userId = (req as any).userId

    const transfer = await prisma.assetTransfer.findUnique({
      where: { id: transferId },
      include: { asset: true, fromClinic: true, toClinic: true }
    })
    if (!transfer) return res.status(404).json({ message: 'Transfer record tidak ditemukan' })
    if (transfer.status !== 'pending') return res.status(400).json({ message: `Transfer sudah ${transfer.status}` })

    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.assetTransfer.update({
        where: { id: transferId },
        data: {
          status: 'approved',
          approvedBy: approvedBy || userId
        }
      })

      // Update asset clinic and status
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: {
          clinicId: transfer.toClinicId,
          status: 'active',
          location: `Transferred from ${transfer.fromClinic.name}`
        }
      })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: transfer.assetId,
          action: 'TRANSFER_APPROVED',
          fieldChanged: 'clinicId',
          oldValue: transfer.fromClinicId,
          newValue: transfer.toClinicId,
          changedBy: userId,
          notes: `Transfer approved to ${transfer.toClinic.name}`
        }
      })

      return updatedTransfer
    })

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/assets/transfer/:transferId/reject
 * Reject asset transfer
 */
export const rejectAssetTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params
    const { reason } = req.body
    const userId = (req as any).userId

    const transfer = await prisma.assetTransfer.findUnique({
      where: { id: transferId },
      include: { asset: true }
    })
    if (!transfer) return res.status(404).json({ message: 'Transfer record tidak ditemukan' })
    if (transfer.status !== 'pending') return res.status(400).json({ message: `Transfer sudah ${transfer.status}` })

    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.assetTransfer.update({
        where: { id: transferId },
        data: {
          status: 'rejected',
          notes: `${transfer.notes || ''}\n[REJECTED] ${reason || 'No reason provided'}`.trim()
        }
      })

      // Revert asset status
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { status: 'active' }
      })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: transfer.assetId,
          action: 'TRANSFER_REJECTED',
          fieldChanged: 'status',
          oldValue: 'inactive',
          newValue: 'active',
          changedBy: userId,
          notes: `Transfer rejected: ${reason || 'No reason provided'}`
        }
      })

      return updatedTransfer
    })

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 3. ASSET AUDIT LOGS ────────────────────────────────────────────────────

/**
 * GET /api/assets/:id/audit-logs
 * Get all audit logs for an asset
 */
export const getAssetAuditLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { action, startDate, endDate, limit } = req.query

    const logs = await prisma.assetAuditLog.findMany({
      where: {
        assetId: id,
        ...(action ? { action: String(action) } : {}),
        ...(startDate && endDate ? {
          changedAt: {
            gte: new Date(`${startDate}T00:00:00+07:00`),
            lte: new Date(`${endDate}T23:59:59+07:00`)
          }
        } : {})
      },
      orderBy: { changedAt: 'desc' },
      take: limit ? Number(limit) : 100,
      include: {
        asset: {
          select: {
            assetCode: true,
            assetName: true
          }
        }
      }
    })

    res.json(logs)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 4. ASSET INSURANCE ─────────────────────────────────────────────────────

/**
 * GET /api/assets/:id/insurance
 * Get insurance information for an asset
 */
export const getAssetInsurance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const insurance = await prisma.assetInsurance.findUnique({
      where: { assetId: id },
      include: {
        asset: {
          select: {
            assetCode: true,
            assetName: true,
            assetType: true,
            purchasePrice: true,
            currentValue: true
          }
        }
      }
    })

    if (!insurance) {
      return res.status(404).json({ message: 'Informasi asuransi tidak ditemukan untuk aset ini' })
    }

    res.json(insurance)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/assets/:id/insurance
 * Create or update insurance information for an asset
 */
export const upsertAssetInsurance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      insuranceCompany,
      policyNumber,
      coverageAmount,
      premium,
      startDate,
      endDate,
      renewalDate,
      contactPerson,
      contactPhone,
      notes
    } = req.body
    const userId = (req as any).userId

    if (!insuranceCompany || !policyNumber || !coverageAmount || !startDate || !endDate) {
      return res.status(400).json({ message: 'insuranceCompany, policyNumber, coverageAmount, startDate, dan endDate wajib diisi' })
    }

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan' })

    const result = await prisma.$transaction(async (tx) => {
      const existingInsurance = await tx.assetInsurance.findUnique({ where: { assetId: id } })
      
      const insuranceData = {
        insuranceCompany,
        policyNumber,
        coverageAmount: Number(coverageAmount),
        premium: premium ? Number(premium) : 0,
        startDate: new Date(`${startDate}T00:00:00+07:00`),
        endDate: new Date(`${endDate}T00:00:00+07:00`),
        renewalDate: renewalDate ? new Date(`${renewalDate}T00:00:00+07:00`) : undefined,
        contactPerson,
        contactPhone,
        notes
      }

      let insurance
      if (existingInsurance) {
        insurance = await tx.assetInsurance.update({
          where: { assetId: id },
          data: insuranceData
        })

        // Create audit log for update
        await tx.assetAuditLog.create({
          data: {
            assetId: id,
            action: 'UPDATE_INSURANCE',
            fieldChanged: 'insurance',
            oldValue: JSON.stringify(existingInsurance),
            newValue: JSON.stringify(insurance),
            changedBy: userId,
            notes: 'Update informasi asuransi'
          }
        })
      } else {
        insurance = await tx.assetInsurance.create({
          data: {
            assetId: id,
            ...insuranceData
          }
        })

        // Create audit log for create
        await tx.assetAuditLog.create({
          data: {
            assetId: id,
            action: 'CREATE_INSURANCE',
            fieldChanged: null,
            oldValue: null,
            newValue: JSON.stringify(insurance),
            changedBy: userId,
            notes: 'Buat informasi asuransi baru'
          }
        })
      }

      return insurance
    })

    res.status(201).json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * DELETE /api/assets/:id/insurance
 * Delete insurance information for an asset
 */
export const deleteAssetInsurance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const insurance = await prisma.assetInsurance.findUnique({ where: { assetId: id } })
    if (!insurance) return res.status(404).json({ message: 'Informasi asuransi tidak ditemukan' })

    await prisma.$transaction(async (tx) => {
      await tx.assetInsurance.delete({ where: { assetId: id } })

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: id,
          action: 'DELETE_INSURANCE',
          fieldChanged: null,
          oldValue: JSON.stringify(insurance),
          newValue: null,
          changedBy: userId,
          notes: 'Hapus informasi asuransi'
        }
      })
    })

    res.json({ message: 'Informasi asuransi berhasil dihapus' })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 5. ASSET REPORTS ──────────────────────────────────────────────────────

/**
 * GET /api/assets/reports/maintenance-schedule
 * Get upcoming maintenance schedule
 */
export const getMaintenanceSchedule = async (req: Request, res: Response) => {
  try {
    const { clinicId, daysAhead } = req.query
    const currentClinicId = (req as any).clinicId
    const targetClinicId = clinicId ? String(clinicId) : currentClinicId
    const days = daysAhead ? Number(daysAhead) : 30

    const assets = await prisma.asset.findMany({
      where: {
        clinicId: targetClinicId,
        status: 'active',
        OR: [
          { lastMaintenanceDate: null },
          {
            lastMaintenanceDate: {
              lte: new Date(new Date().setDate(new Date().getDate() - 180)) // 6 months ago
            }
          }
        ]
      },
      include: {
        maintenanceRecords: {
          where: {
            nextMaintenanceDate: {
              gte: new Date(),
              lte: new Date(new Date().setDate(new Date().getDate() + days))
            }
          },
          orderBy: { nextMaintenanceDate: 'asc' },
          take: 1
        }
      },
      orderBy: { assetName: 'asc' }
    })

    const schedule = assets
      .filter(asset => asset.maintenanceRecords.length > 0)
      .map(asset => ({
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        assetType: asset.assetType,
        lastMaintenanceDate: asset.lastMaintenanceDate,
        nextMaintenance: asset.maintenanceRecords[0]
      }))

    res.json({
      schedule,
      total: schedule.length,
      daysAhead: days
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/assets/reports/expiring-insurance
 * Get assets with expiring insurance
 */
export const getExpiringInsurance = async (req: Request, res: Response) => {
  try {
    const { clinicId, daysAhead } = req.query
    const currentClinicId = (req as any).clinicId
    const targetClinicId = clinicId ? String(clinicId) : currentClinicId
    const days = daysAhead ? Number(daysAhead) : 30

    const assets = await prisma.asset.findMany({
      where: {
        clinicId: targetClinicId,
        status: 'active',
        insurance: {
          endDate: {
            lte: new Date(new Date().setDate(new Date().getDate() + days)),
            gte: new Date()
          }
        }
      },
      include: {
        insurance: true
      },
      orderBy: { assetName: 'asc' }
    })

    res.json({
      assets,
      total: assets.length,
      daysAhead: days
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}