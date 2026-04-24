import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'
import { AccountCategory, AccountType } from '@prisma/client'

/**
 * Get all Chart of Accounts with filtering and hierarchy
 */
export const getCOAs = async (req: Request, res: Response) => {
  try {
    const { search, category, type, parentId, clinicId } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    // Enum Validation to prevent Prisma errors
    const validCategories = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
    const validTypes = ['HEADER', 'DETAIL']
    
    const validatedCategory = category && validCategories.includes(String(category)) ? category as AccountCategory : undefined
    const validatedType = type && validTypes.includes(String(type)) ? type as AccountType : undefined

    // If clinicId is explicitly passed in query, use it. 
    // Otherwise, if not admin view, use the session's currentClinicId.
    const targetClinicId = clinicId ? String(clinicId) : (isAdminView ? undefined : currentClinicId)

    const coas = await prisma.chartOfAccount.findMany({
      where: {
        ...(targetClinicId ? {
          OR: [
            { clinicId: targetClinicId },
            { clinicId: null }
          ]
        } : {}),
        ...(search ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { code: { contains: String(search), mode: 'insensitive' } },
          ]
        } : {}),
        ...(validatedCategory ? { category: validatedCategory } : {}),
        ...(validatedType ? { accountType: validatedType } : {}),
        ...(parentId !== undefined && parentId !== "" ? { parentId: parentId === 'null' ? null : String(parentId) } : {}),
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        parent: { select: { id: true, name: true, code: true } },
        _count: { select: { children: true } }
      },
      orderBy: { code: 'asc' },
    })

    res.json(coas)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Create a new Chart of Account
 */
export const createCOA = async (req: Request, res: Response) => {
  try {
    const { code, name, category, accountType, parentId, clinicId, isActive } = req.body
    
    const coa = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        category: category as AccountCategory,
        accountType: (accountType as AccountType) || 'DETAIL',
        parentId: parentId || null,
        clinicId: clinicId || (req as any).clinicId || null,
        isActive: isActive !== undefined ? isActive : true,
        isReconciled: req.body.isReconciled || false
      }
    })
    
    res.status(201).json(coa)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ message: 'Kode akun sudah digunakan' })
    res.status(500).json({ message: e.message })
  }
}

/**
 * Update a Chart of Account
 */
export const updateCOA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { code, name, category, accountType, parentId, clinicId, isActive } = req.body

    const coa = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        code,
        name,
        category: category as AccountCategory,
        accountType: accountType as AccountType,
        parentId: parentId || null,
        clinicId: clinicId || undefined,
        isActive,
        isReconciled: req.body.isReconciled
      }
    })
    
    res.json(coa)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Delete a Chart of Account
 */
export const deleteCOA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if it has children
    const childrenCount = await prisma.chartOfAccount.count({ where: { parentId: id } })
    if (childrenCount > 0) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun yang memiliki sub-akun' })
    }

    // Check if linked to banks
    const bankCount = await prisma.bank.count({ where: { coaId: id } })
    if (bankCount > 0) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun yang masih terhubung dengan Bank' })
    }

    await prisma.chartOfAccount.delete({ where: { id } })
    res.json({ message: 'Akun berhasil dihapus' })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
/**
 * Get balances for detail accounts
 */
export const getCoaBalances = async (req: Request, res: Response) => {
  try {
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const { clinicId } = req.query
    const targetClinicId = clinicId ? String(clinicId) : (isAdminView ? undefined : currentClinicId)

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        accountType: 'DETAIL',
        ...(targetClinicId ? { OR: [{ clinicId: targetClinicId }, { clinicId: null }] } : {})
      }
    })

    const balances = await Promise.all(accounts.map(async (acc) => {
      const aggregates = await prisma.journalDetail.aggregate({
        where: {
          coaId: acc.id,
          journalEntry: {
            ...(targetClinicId ? { clinicId: targetClinicId } : {})
          }
        },
        _sum: { debit: true, credit: true }
      })

      const totalDebit = (aggregates._sum.debit || 0)
      const totalCredit = (aggregates._sum.credit || 0)
      const net = totalDebit - totalCredit
      
      let balance = 0
      if (acc.category === 'ASSET' || acc.category === 'EXPENSE') {
        balance = acc.openingBalance + net
      } else {
        balance = acc.openingBalance + (totalCredit - totalDebit)
      }

      return { id: acc.id, code: acc.code, balance }
    }))

    res.json(balances)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
