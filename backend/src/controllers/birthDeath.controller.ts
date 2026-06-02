import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Birth Controllers
export const getBirths = async (req: Request, res: Response) => {
  try {
    const births = await prisma.birthRecord.findMany({
      include: { patient: { select: { id: true, name: true, medicalRecordNo: true, address: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(births)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

export const createBirth = async (req: Request, res: Response) => {
  try {
    const data = req.body
    data.birthDate = new Date(data.birthDate)
    data.weight = parseFloat(data.weight) || 0
    data.length = parseFloat(data.length) || 0
    data.gestationalAge = parseInt(data.gestationalAge) || 0
    
    const birth = await prisma.birthRecord.create({
      data
    })
    res.status(201).json(birth)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

export const deleteBirth = async (req: Request, res: Response) => {
  try {
    await prisma.birthRecord.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted successfully' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

// Death Controllers
export const getDeaths = async (req: Request, res: Response) => {
  try {
    const deaths = await prisma.patient.findMany({
      where: { isDeceased: true },
      include: { deathIcd10: true },
      orderBy: { dateOfDeath: 'desc' }
    })
    res.json(deaths)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

export const markDeath = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dateOfDeath, deathPlace, deathCause, deathIcd10Id } = req.body;
    
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        isDeceased: true,
        dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : new Date(),
        deathPlace,
        deathCause,
        deathIcd10Id
      }
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

export const unmarkDeath = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        isDeceased: false,
        dateOfDeath: null,
        deathPlace: null,
        deathCause: null,
        deathIcd10Id: null
      }
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
