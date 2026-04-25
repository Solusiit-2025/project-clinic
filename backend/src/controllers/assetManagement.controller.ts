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

    // Use Prisma.sql fragments for conditional queries
    const { Prisma } = require('@prisma/client')
    let query = Prisma.sql`
      SELECT 
        m.*, 
        a."assetCode", a."assetName", a."assetType", a."condition",
        c.name as "clinicName", c.code as "clinicCode"
      FROM asset_maintenance m
      JOIN assets a ON m."assetId" = a.id
      LEFT JOIN clinics c ON a."clinicId" = c.id
      WHERE 1=1
    `

    if (type) query = Prisma.sql`${query} AND m."maintenanceType" = ${type}`
    if (targetClinicId) query = Prisma.sql`${query} AND a."clinicId" = ${targetClinicId}`
    
    query = Prisma.sql`${query} ORDER BY m."maintenanceDate" DESC`

    const maintenance: any[] = await prisma.$queryRaw(query)

    // Map the flat result back to the structure expected by the frontend
    const mappedMaintenance = maintenance.map(m => ({
      ...m,
      asset: {
        assetCode: m.assetCode,
        assetName: m.assetName,
        assetType: m.assetType,
        condition: m.condition,
        clinic: m.clinicName ? { name: m.clinicName, code: m.clinicCode } : null
      }
    }))

    res.json(mappedMaintenance)
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

    const { Prisma } = require('@prisma/client')
    let query = Prisma.sql`
      SELECT 
        m.*, 
        a."assetCode", a."assetName", a."assetType", a."condition"
      FROM asset_maintenance m
      JOIN assets a ON m."assetId" = a.id
      WHERE m."assetId" = ${id}
    `

    if (type) query = Prisma.sql`${query} AND m."maintenanceType" = ${type}`
    
    query = Prisma.sql`${query} ORDER BY m."maintenanceDate" DESC`

    const maintenance: any[] = await prisma.$queryRaw(query)

    const mappedMaintenance = maintenance.map(m => ({
      ...m,
      asset: {
        assetCode: m.assetCode,
        assetName: m.assetName,
        assetType: m.assetType,
        condition: m.condition
      }
    }))

    res.json(mappedMaintenance)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/assets/maintenance/:id/post
 * Manual Posting Maintenance to GL
 */
export const postMaintenanceToGL = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { creditCoaId, date } = req.body
    const userId = (req as any).userId

    if (!creditCoaId) return res.status(400).json({ message: 'Pilih Akun Kas/Bank pembayar' })

    const maintenanceArr: any[] = await prisma.$queryRaw`SELECT m.*, a."clinicId" as "assetClinicId", a."assetName", a."assetCode" FROM asset_maintenance m JOIN assets a ON m."assetId" = a.id WHERE m.id = ${id}`
    const maintenance = maintenanceArr[0]

    if (!maintenance) return res.status(404).json({ message: 'Record maintenance tidak ditemukan' })
    if (maintenance.isPosted) return res.status(400).json({ message: 'Record ini sudah diposting ke GL' })
    if (!maintenance.cost || maintenance.cost <= 0) return res.status(400).json({ message: 'Biaya maintenance harus lebih dari 0 untuk diposting' })

    const result = await prisma.$transaction(async (tx) => {
      // Check current balance of the credit account
      const journalDetails: any = await tx.$queryRaw`SELECT SUM(debit) as "totalDebit", SUM(credit) as "totalCredit" FROM journal_details WHERE "coaId" = ${creditCoaId}`
      const currentBalance = (Number(journalDetails[0].totalDebit) || 0) - (Number(journalDetails[0].totalCredit) || 0)

      if (currentBalance < maintenance.cost) {
        throw new Error(`Saldo tidak cukup. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`)
      }

      const assetClinicId = maintenance.assetClinicId || (req as any).clinicId
      const expenseCoa = await resolveCoa('MAINTENANCE_EXPENSE', '6-1401', assetClinicId)
      
      if (!expenseCoa) throw new Error('Akun Beban Pemeliharaan (6-1401) tidak ditemukan')

      const journal = await tx.journalEntry.create({
        data: {
          date: new Date(date || maintenance.maintenanceDate),
          description: `Pemeliharaan Aset: ${maintenance.assetName} (${maintenance.assetCode})`,
          referenceNo: `MAINT-${maintenance.id.slice(-8)}`,
          entryType: 'SYSTEM',
          clinicId: assetClinicId,
          details: {
            create: [
              { coaId: expenseCoa.id, debit: maintenance.cost || 0, credit: 0, description: `Beban Pemeliharaan ${maintenance.assetName}` },
              { coaId: creditCoaId, debit: 0, credit: maintenance.cost || 0, description: `Pembayaran Pemeliharaan ${maintenance.assetName}` }
            ]
          }
        }
      })

      // Update maintenance status using raw SQL to bypass stale Prisma Client mapping
      await tx.$executeRaw`UPDATE asset_maintenance SET "isPosted" = true, "journalEntryId" = ${journal.id} WHERE id = ${id}`

      return journal
    })

    res.json({ message: 'Berhasil posting ke GL', journal: result })
  } catch (err: any) {
    console.error('❌ [postMaintenanceToGL] Error:', err)
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

      // 3. Create audit log
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
 * GET /api/assets/transfers/all
 * Get all transfer records across clinics
 */
export const getAllAssetTransfers = async (req: Request, res: Response) => {
  try {
    const { status, fromClinicId, toClinicId } = req.query
    const isAdminView = (req as any).role === 'SUPERADMIN' || (req as any).role === 'ADMIN'
    const currentClinicId = (req as any).clinicId

    const transfers = await prisma.assetTransfer.findMany({
      where: {
        ...(status ? { status: String(status) } : {}),
        ...(fromClinicId ? { fromClinicId: String(fromClinicId) } : {}),
        ...(toClinicId ? { toClinicId: String(toClinicId) } : {}),
        ...(!isAdminView ? { 
          OR: [
            { fromClinicId: currentClinicId },
            { toClinicId: currentClinicId }
          ]
        } : {})
      },
      orderBy: { transferDate: 'desc' },
      include: {
        asset: true,
        fromClinic: { select: { id: true, name: true, code: true } },
        toClinic: { select: { id: true, name: true, code: true } }
      }
    })

    res.json(transfers)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

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
      const asset = transfer.asset
      const cost = asset.purchasePrice || 0
      const accDep = asset.totalDepreciated || 0
      const netBookValue = cost - accDep

      // Resolve Accounts
      const clearingCoa = await resolveCoa('INTER_BRANCH_CLEARING', '1-1105', transfer.fromClinicId)
      if (!clearingCoa) throw new Error('Akun Kliring Antar Cabang (1-1105) belum diatur di System Accounts')

      const assetCoaId = asset.coaAssetId
      const accDepCoaId = asset.coaAccumDepId

      if (!assetCoaId) throw new Error(`Akun Aset untuk ${asset.assetName} belum diatur`)

      // 1. Journal Entry Origin (From Clinic)
      const journalOrigin = await tx.journalEntry.create({
        data: {
          date: transfer.transferDate,
          description: `Transfer Aset Keluar: ${asset.assetName} (${transfer.transferNo})`,
          referenceNo: transfer.transferNo,
          entryType: 'SYSTEM',
          clinicId: transfer.fromClinicId,
          details: {
            create: [
              { coaId: clearingCoa.id, debit: netBookValue, credit: 0, description: `Inter-Branch Clearing - Transfer ke ${transfer.toClinic.name}` },
              ...(accDep > 0 && accDepCoaId ? [{ coaId: accDepCoaId, debit: accDep, credit: 0, description: `Pembalikan Akum. Penyusutan Transfer` }] : []),
              { coaId: assetCoaId, debit: 0, credit: cost, description: `Pelepasan Aset - Transfer ke ${transfer.toClinic.name}` }
            ]
          }
        }
      })

      // 2. Journal Entry Destination (To Clinic)
      const journalDest = await tx.journalEntry.create({
        data: {
          date: transfer.transferDate,
          description: `Transfer Aset Masuk: ${asset.assetName} (${transfer.transferNo})`,
          referenceNo: transfer.transferNo,
          entryType: 'SYSTEM',
          clinicId: transfer.toClinicId,
          details: {
            create: [
              { coaId: assetCoaId, debit: cost, credit: 0, description: `Penerimaan Aset - Transfer dari ${transfer.fromClinic.name}` },
              ...(accDep > 0 && accDepCoaId ? [{ coaId: accDepCoaId, debit: 0, credit: accDep, description: `Akum. Penyusutan Transfer` }] : []),
              { coaId: clearingCoa.id, debit: 0, credit: netBookValue, description: `Inter-Branch Clearing - Transfer dari ${transfer.fromClinic.name}` }
            ]
          }
        }
      })

      // 3. Update transfer status and GL links
      const updatedTransfer = await tx.assetTransfer.update({
        where: { id: transferId },
        data: {
          status: 'approved',
          approvedBy: approvedBy || userId,
          isPosted: true,
          journalIdOrigin: journalOrigin.id,
          journalIdDest: journalDest.id,
          transferValue: netBookValue
        }
      })

      // 4. Update asset clinic and status
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: {
          clinicId: transfer.toClinicId,
          status: 'active',
          location: `Transferred from ${transfer.fromClinic.name}`
        }
      })

      // 5. Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: transfer.assetId,
          action: 'TRANSFER_APPROVED',
          fieldChanged: 'clinicId',
          oldValue: transfer.fromClinicId,
          newValue: transfer.toClinicId,
          changedBy: userId,
          notes: `Transfer approved. Journal IDs: ${journalOrigin.id} & ${journalDest.id}`
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

/**
 * POST /api/master/assets/:id/insurance/post-gl
 * Post insurance payment to General Ledger
 */
export const postAssetInsuranceToGL = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { paymentMethod, bankId, notes } = req.body
    const currentClinicId = (req as any).clinicId
    const userId = (req as any).userId

    // 1. Fetch Insurance Data
    const insurance = await prisma.assetInsurance.findUnique({
      where: { assetId: id },
      include: { asset: true }
    })

    if (!insurance) return res.status(404).json({ message: 'Informasi asuransi tidak ditemukan' })
    if (insurance.isPosted) return res.status(400).json({ message: 'Asuransi ini sudah diposting ke keuangan' })
    if (insurance.premium <= 0) return res.status(400).json({ message: 'Jumlah premi asuransi tidak valid' })

    const targetClinicId = insurance.asset.clinicId || currentClinicId

    // 2. Resolve COA Accounts
    // Debit: Beban Asuransi (6-1502 fallback)
    const sysExpense = await prisma.systemAccount.findFirst({
      where: { key: 'INSURANCE_EXPENSE', OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
      include: { coa: true },
      orderBy: { clinicId: 'desc' }
    })
    const debitCoa = sysExpense?.coa || await prisma.chartOfAccount.findFirst({ 
      where: { code: '6-1502', OR: [{ clinicId: targetClinicId }, { clinicId: null }] } 
    })

    if (!debitCoa) return res.status(400).json({ message: 'Akun Beban Asuransi (6-1502) belum diatur di COA.' })

    // Credit: Kas/Bank
    let creditCoaId: string | undefined
    if (paymentMethod === 'cash') {
      const sysCash = await prisma.systemAccount.findFirst({
        where: { key: 'CASH_ACCOUNT', OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
        include: { coa: true },
        orderBy: { clinicId: 'desc' }
      })
      creditCoaId = sysCash?.coaId
      if (!creditCoaId) return res.status(400).json({ message: 'Konfigurasi Akun Kas Utama belum diatur.' })
    } else {
      if (!bankId) return res.status(400).json({ message: 'Akun Bank harus dipilih untuk pembayaran non-tunai.' })
      const bank = await prisma.bank.findUnique({ where: { id: bankId } })
      creditCoaId = bank?.coaId
      if (!creditCoaId) return res.status(400).json({ message: 'Akun Bank tujuan belum terhubung ke COA.' })
    }

    // 3. Update & Post in Transaction
    const result = await prisma.$transaction(async (tx) => {
      // a. Create Journal Entry
      const referenceNo = `INS-${insurance.asset.assetCode}-${Date.now().toString().slice(-4)}`
      const journal = await tx.journalEntry.create({
        data: {
          date: new Date(),
          description: `Pembayaran Asuransi: ${insurance.asset.assetName} (${insurance.policyNumber})`,
          referenceNo,
          entryType: 'SYSTEM',
          clinicId: targetClinicId,
          details: {
            create: [
              {
                coaId: debitCoa.id,
                debit: insurance.premium,
                credit: 0,
                description: `Beban Asuransi ${insurance.asset.assetName} - Polis ${insurance.policyNumber}`
              },
              {
                coaId: creditCoaId!,
                debit: 0,
                credit: insurance.premium,
                description: `Pembayaran Asuransi via ${paymentMethod.toUpperCase()}`
              }
            ]
          }
        }
      })

      // b. Update Insurance Record
      const updated = await tx.assetInsurance.update({
        where: { id: insurance.id },
        data: {
          isPosted: true,
          postedAt: new Date(),
          journalId: journal.id,
          notes: `${insurance.notes || ''}\n[POSTED ${new Date().toISOString()}] ${notes || ''}`.trim()
        }
      })

      // c. Audit Log
      await tx.assetAuditLog.create({
        data: {
          assetId: id,
          action: 'POST_INSURANCE_GL',
          fieldChanged: 'isPosted',
          oldValue: 'false',
          newValue: 'true',
          changedBy: userId,
          notes: `Posting pembayaran asuransi ke GL: ${journal.id}`
        }
      })

      return { updated, journal }
    })

    res.json({
      success: true,
      message: 'Berhasil memposting pembayaran asuransi ke Laporan Keuangan',
      data: result
    })

  } catch (err: any) {
    console.error('❌ [AssetInsurance] Post GL Error:', err)
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