import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==================== REGISTRATION & QUEUE ====================

/**
 * Create a new registration and generate a queue number
 */
export const createRegistration = async (req: Request, res: Response) => {
  try {
    const { patientId, clinicId, doctorId, departmentId, visitType, referralFrom } = req.body
    
    if (!patientId || !clinicId) {
      return res.status(400).json({ message: 'Patient ID dan Clinic ID wajib diisi' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDay = new Date(today)
    nextDay.setDate(today.getDate() + 1)

    // 1. Generate Registration Number (REG-YYYYMMDD-XXXX) per Clinic
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const regCount = await prisma.registration.count({
      where: { 
        clinicId,
        createdAt: { gte: today, lt: nextDay }
      }
    })
    const registrationNo = `REG-${dateStr}-${(regCount + 1).toString().padStart(4, '0')}`

    // 2. Determine Queue Prefix based on Department
    let prefix = 'A' // Default
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } })
      if (dept) {
        prefix = dept.name.charAt(0).toUpperCase()
      }
    }

    // 3. Generate Queue Number (X-001) per Clinic and Date
    const queueCount = await prisma.queueNumber.count({
      where: { 
        clinicId,
        queueDate: { gte: today, lt: nextDay },
        queueNo: { startsWith: prefix }
      }
    })
    const queueNo = `${prefix}-${(queueCount + 1).toString().padStart(3, '0')}`

    // 4. Create Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Registration
      const registration = await tx.registration.create({
        data: {
          patientId,
          clinicId,
          doctorId: doctorId || null,
          departmentId: departmentId || null,
          registrationNo,
          registrationDate: new Date(),
          visitType: visitType || 'outpatient',
          referralFrom,
          status: 'completed'
        }
      })

      // Create Queue Number
      const queueNumber = await tx.queueNumber.create({
        data: {
          queueNo,
          patientId,
          clinicId,
          doctorId: doctorId || null,
          departmentId: departmentId || null,
          queueDate: new Date(),
          status: 'waiting'
        }
      })

      return { registration, queueNumber }
    })

    res.status(201).json(result)
  } catch (e) {
    console.error('Registration Error:', e)
    res.status(500).json({ 
      message: 'Gagal melakukan pendaftaran',
      error: (e as Error).message 
    })
  }
}

/**
 * Get active queues for a clinic today
 */
export const getQueues = async (req: Request, res: Response) => {
  try {
    const { clinicId, date } = req.query
    const targetDate = date ? new Date(date as string) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    const queues = await prisma.queueNumber.findMany({
      where: {
        clinicId: clinicId as string || undefined,
        queueDate: {
          gte: targetDate,
          lt: nextDay
        }
      },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNo: true, gender: true }
        },
        doctor: {
           select: { id: true, name: true, specialization: true }
        },
        department: {
           select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json(queues)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update queue status (call, skip, ongoing, etc)
 */
export const updateQueueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const data: any = { status }
    if (status === 'called') {
      data.actualCallTime = new Date()
    }

    const queue = await prisma.queueNumber.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true
      }
    })

    res.json(queue)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
