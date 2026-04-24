import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'

/**
 * Get all Bank accounts
 */
export const getBanks = async (req: Request, res: Response) => {
  try {
    const { search, clinicId } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const targetClinicId = clinicId ? String(clinicId) : (isAdminView ? undefined : currentClinicId)

    const banks = await prisma.bank.findMany({
      where: {
        ...(targetClinicId ? { clinicId: targetClinicId } : {}),
        ...(search ? {
          OR: [
            { bankName: { contains: String(search), mode: 'insensitive' } },
            { accountNumber: { contains: String(search), mode: 'insensitive' } },
            { accountHolder: { contains: String(search), mode: 'insensitive' } },
          ]
        } : {}),
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        coa: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(banks)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Create a new Bank account
 */
export const createBank = async (req: Request, res: Response) => {
  try {
    const { bankName, accountNumber, accountHolder, coaId, clinicId, isActive } = req.body
    
    // Ensure clinicId is set
    const targetClinicId = clinicId || (req as any).clinicId
    if (!targetClinicId) {
      return res.status(400).json({ message: 'Clinic ID wajib diisi' })
    }

    const bank = await prisma.bank.create({
      data: {
        bankName,
        accountNumber,
        accountHolder,
        coaId,
        clinicId: targetClinicId,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        coa: true,
        clinic: true
      }
    })
    
    res.status(201).json(bank)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Update a Bank account
 */
export const updateBank = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { bankName, accountNumber, accountHolder, coaId, clinicId, isActive } = req.body

    const bank = await prisma.bank.update({
      where: { id },
      data: {
        bankName,
        accountNumber,
        accountHolder,
        coaId,
        clinicId,
        isActive
      },
      include: {
        coa: true,
        clinic: true
      }
    })
    
    res.json(bank)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Delete a Bank account
 */
export const deleteBank = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.bank.delete({ where: { id } })
    res.json({ message: 'Data Bank berhasil dihapus' })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
