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

    // 2. Determine Queue Prefix and sequence based on Doctor (or fallback)
    let prefix = 'A'
    let queueCount = 0

    if (doctorId) {
      // Get doctor details to retrieve queueCode
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
      if (doctor) {
        // Use queueCode if set, or just first letter of name (skipping 'dr.')
        const rawName = doctor.name.toLowerCase().startsWith('dr.') ? doctor.name.slice(3).trim() : doctor.name
        prefix = doctor.queueCode || rawName.charAt(0).toUpperCase()
      }
      
      // Count sequences for THIS SPECIFIC DOCTOR today
      queueCount = await prisma.queueNumber.count({
        where: { 
          clinicId,
          doctorId,
          queueDate: { gte: today, lt: nextDay }
        }
      })
    } else {
      // Fallback: Determine Queue Prefix based on Department
      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } })
        if (dept) {
          prefix = dept.name.charAt(0).toUpperCase()
        }
      }
      // Count sequences for THIS PREFIX today in the clinic
      queueCount = await prisma.queueNumber.count({
        where: { 
          clinicId,
          queueDate: { gte: today, lt: nextDay },
          queueNo: { startsWith: prefix }
        }
      })
    }

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
      // 2. Create Queue Number
      const queueNumber = await tx.queueNumber.create({
        data: {
          queueNo,
          patientId,
          clinicId,
          registrationId: registration.id,
          doctorId: doctorId || null,
          departmentId: departmentId || null,
          queueDate: new Date(),
          status: 'waiting'
        }
      })

      // 3. Create Invoice for Registration
      // First, get or create the Registration Fee Service
      let regService = await tx.service.findFirst({
        where: { 
          serviceName: { contains: 'Pendaftaran', mode: 'insensitive' },
          OR: [
            { clinicId: clinicId },
            { clinic: { isMain: true } }
          ]
        }
      })

      if (!regService) {
        // Find existing clinic code or slug to make it readable
        const clinic = await tx.clinic.findUnique({ where: { id: clinicId } })
        const clinicSuffix = clinic?.code || clinicId.slice(0, 4).toUpperCase()
        
        regService = await tx.service.create({
          data: {
            serviceCode: `REG-${clinicSuffix}`,
            serviceName: 'Biaya Pendaftaran',
            category: 'Administrasi',
            price: 50000, // Default price
            isActive: true,
            clinicId: clinicId
          }
        })
      }

      const todayInv = new Date()
      const dateStrInv = todayInv.toISOString().split('T')[0].replace(/-/g, '')
      todayInv.setHours(0, 0, 0, 0)
      const invCount = await tx.invoice.count({
        where: { createdAt: { gte: todayInv } }
      })
      const invoiceNo = `INV-${dateStrInv}-${(invCount + 1).toString().padStart(4, '0')}`

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          patientId,
          clinicId,
          invoiceDate: new Date(),
          total: regService.price,
          subtotal: regService.price,
          status: 'unpaid'
        }
      })

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          serviceId: regService.id,
          description: regService.serviceName,
          quantity: 1,
          price: regService.price,
          subtotal: regService.price
        }
      })

      return { registration, queueNumber, invoice }
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
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const targetDate = date ? new Date(date as string) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    // Determine target clinic
    const finalClinicId = isAdminView 
       ? (clinicId ? String(clinicId) : undefined)
       : currentClinicId

    const user = (req as any).user
    const isDoctor = user?.role === 'DOCTOR'
    const doctorId = user?.doctor?.id

    const queues = await prisma.queueNumber.findMany({
      where: {
        clinicId: finalClinicId,
        queueDate: {
          gte: targetDate,
          lt: nextDay
        },
        // Filter by doctor if the user is a doctor and not an admin
        // Allow seeing unassigned patients (null) + assigned to current doctor
        ...(isDoctor && !isAdminView && doctorId ? { 
           OR: [
             { doctorId },
             { doctorId: null }
           ]
        } : {})
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

    // Self-healing: Patch missing registrationIds for the frontend to work 
    const healedQueues = await Promise.all(queues.map(async (q) => {
      if (!q.registrationId) {
        // Find matching registration for the same patient today
        const reg = await prisma.registration.findFirst({
          where: {
            patientId: q.patientId,
            clinicId: q.clinicId || undefined,
            createdAt: { gte: targetDate, lt: nextDay }
          },
          orderBy: { createdAt: 'desc' }
        })
        if (reg) {
          // Update DB for next time (fire and forget)
          prisma.queueNumber.update({ 
            where: { id: q.id }, 
            data: { registrationId: reg.id } 
          }).catch(err => console.error('Healing failed', err))
          
          return { ...q, registrationId: reg.id }
        }
      }
      return q
    }))

    // Add MedicalRecord existence check
    const regIds = healedQueues.map(q => q.registrationId).filter(Boolean) as string[]
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: { registrationId: { in: regIds } },
      select: { registrationId: true }
    })
    const mrRegIds = new Set(medicalRecords.map(mr => mr.registrationId))

    const finalQueues = healedQueues.map(q => ({
      ...q,
      hasMedicalRecord: q.registrationId ? mrRegIds.has(q.registrationId) : false
    }))

    res.json(finalQueues)
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
        patient: {
           select: { id: true, name: true, medicalRecordNo: true, gender: true }
        },
        doctor: {
           select: { id: true, name: true, specialization: true }
        },
        department: {
           select: { id: true, name: true }
        }
      }
    })

    // Add hasMedicalRecord flag to prevent UI flicker in frontend
    const mr = queue.registrationId ? await prisma.medicalRecord.findUnique({
      where: { registrationId: queue.registrationId },
      select: { id: true }
    }) : null

    res.json({
      ...queue,
      hasMedicalRecord: !!mr
    })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Get a specific queue by ID
 */
export const getQueueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const isAdminView = (req as any).isAdminView
    const userRole = (req as any).user?.role
    const doctorProfileId = (req as any).user?.doctor?.id

    const queue = await prisma.queueNumber.findUnique({
      where: { 
        id,
        ...(userRole === 'DOCTOR' && !isAdminView && doctorProfileId ? { doctorId: doctorProfileId } : {})
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
      }
    })

    if (!queue) {
      return res.status(404).json({ message: 'Antrian tidak ditemukan' })
    }

    // Check for MedicalRecord existence
    const mr = queue.registrationId ? await prisma.medicalRecord.findUnique({
      where: { registrationId: queue.registrationId },
      select: { id: true }
    }) : null

    res.json({ ...queue, hasMedicalRecord: !!mr })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
