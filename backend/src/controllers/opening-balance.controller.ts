import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export class OpeningBalanceController {
  static async getAll(req: Request, res: Response) {
    try {
      const { clinicId } = req.query
      const data = await prisma.openingBalance.findMany({
        where: clinicId ? { clinicId: String(clinicId) } : {},
        include: {
          items: {
            include: { coa: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      res.json(data)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { date, description, clinicId, items } = req.body
      if (!clinicId) throw new Error('clinicId is required')
      
      const openingBalance = await prisma.openingBalance.create({
        data: {
          date: new Date(date),
          description,
          clinicId,
          status: 'DRAFT',
          totalAmount: items.reduce((sum: number, item: any) => sum + (Number(item.debit) || 0), 0),
          items: {
            create: items.map((item: any) => ({
              coaId: item.coaId,
              debit: Number(item.debit) || 0,
              credit: Number(item.credit) || 0
            }))
          }
        },
        include: { items: true }
      })
      
      res.status(201).json(openingBalance)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  static async post(req: Request, res: Response) {
    try {
      const { id } = req.params
      const openingBalance = await prisma.openingBalance.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!openingBalance) return res.status(404).json({ message: 'Data tidak ditemukan' })
      if (openingBalance.status === 'POSTED') return res.status(400).json({ message: 'Data sudah diposting' })

      await prisma.$transaction(async (tx) => {
        // 1. Create Journal Entry (This will represent the opening balance in GL)
        const journalEntry = await tx.journalEntry.create({
          data: {
            date: openingBalance.date,
            description: openingBalance.description || 'Saldo Awal (Opening Balance)',
            entryType: 'OPENING_BALANCE',
            clinicId: openingBalance.clinicId,
            details: {
              create: openingBalance.items.map(item => ({
                coaId: item.coaId,
                debit: item.debit,
                credit: item.credit,
                description: openingBalance.description
              }))
            }
          }
        })

        // 2. Mark as Posted and store journalEntryId
        // We NO LONGER update coa.openingBalance field here because 
        // it would cause double counting in reports that sum openingBalance + JournalEntries
        await tx.openingBalance.update({
          where: { id },
          data: { 
            status: 'POSTED',
            journalEntryId: journalEntry.id
          }
        })
      })

      res.json({ message: 'Berhasil diposting ke Buku Besar. Saldo akan otomatis terupdate di laporan melalui mutasi jurnal.' })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  static async unpost(req: Request, res: Response) {
    try {
      const { id } = req.params
      const openingBalance = await prisma.openingBalance.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!openingBalance) return res.status(404).json({ message: 'Data tidak ditemukan' })
      if (openingBalance.status !== 'POSTED') return res.status(400).json({ message: 'Data belum diposting' })

      await prisma.$transaction(async (tx) => {
        // 1. Delete Journal Entry if exists
        if (openingBalance.journalEntryId) {
          await tx.journalEntry.delete({ where: { id: openingBalance.journalEntryId } })
        }

        // 2. Reset Status to DRAFT and clear journalEntryId
        await tx.openingBalance.update({
          where: { id },
          data: { 
            status: 'DRAFT',
            journalEntryId: null
          }
        })
      })

      res.json({ message: 'Postingan berhasil dibatalkan. Data kembali menjadi Draft.' })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = await prisma.openingBalance.findUnique({ where: { id } })
      if (data?.status === 'POSTED') return res.status(400).json({ message: 'Data yang sudah diposting tidak bisa dihapus. Silakan unpost terlebih dahulu.' })
      
      await prisma.openingBalance.delete({ where: { id } })
      res.json({ message: 'Data berhasil dihapus' })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }
}
