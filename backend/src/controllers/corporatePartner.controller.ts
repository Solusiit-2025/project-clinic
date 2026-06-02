import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getCorporatePartners = async (req: Request, res: Response) => {
  try {
    const { clinicId } = req.query
    if (!clinicId) return res.status(400).json({ message: 'Clinic ID is required' })

    const partners = await prisma.corporatePartner.findMany({
      where: { clinicId: String(clinicId) },
      orderBy: { name: 'asc' }
    })
    res.json(partners)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createCorporatePartner = async (req: Request, res: Response) => {
  try {
    const { clinicId, name, address, phone, email, contactPerson, isActive, creditLimit, contractDiscountRate, taxRate } = req.body
    if (!clinicId || !name) return res.status(400).json({ message: 'Clinic ID and name are required' })

    const partner = await prisma.corporatePartner.create({
      data: {
        clinicId, name, address, phone, email, contactPerson,
        isActive: isActive ?? true,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        contractDiscountRate: contractDiscountRate ? parseFloat(contractDiscountRate) : null,
        taxRate: taxRate ? parseFloat(taxRate) : null
      }
    })
    res.status(201).json(partner)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateCorporatePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, address, phone, email, contactPerson, isActive, creditLimit, contractDiscountRate, taxRate } = req.body

    const partner = await prisma.corporatePartner.update({
      where: { id },
      data: {
        name, address, phone, email, contactPerson,
        isActive: isActive ?? true,
        creditLimit: creditLimit !== undefined ? (creditLimit ? parseFloat(creditLimit) : null) : undefined,
        contractDiscountRate: contractDiscountRate !== undefined ? (contractDiscountRate ? parseFloat(contractDiscountRate) : null) : undefined,
        taxRate: taxRate !== undefined ? (taxRate ? parseFloat(taxRate) : null) : undefined
      }
    })
    res.json(partner)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteCorporatePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.corporatePartner.delete({ where: { id } })
    res.json({ message: 'Corporate partner deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}
