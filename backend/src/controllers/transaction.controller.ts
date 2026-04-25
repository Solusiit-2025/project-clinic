import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'

// Singleton prisma used from ../lib/prisma

// ==================== REGISTRATION & QUEUE ====================

/**
 * Create a new registration and generate a queue number
 */
export const createRegistration = async (req: Request, res: Response) => {
  const startedAt = Date.now()
  try {
    const { patientId, clinicId, doctorId, departmentId, visitType, referralFrom } = req.body
    
    if (!patientId || !clinicId) {
      return res.status(400).json({ message: 'Patient ID dan Clinic ID wajib diisi' })
    }

    // 0. Validation: Check if patient has already registered in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        patientId,
        createdAt: { gte: twoHoursAgo },
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (existingRegistration) {
      return res.status(400).json({ 
        message: 'Pasien sudah terdaftar dalam 2 jam terakhir. Mohon tunggu sebelum melakukan pendaftaran kembali.' 
      })
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
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
      if (doctor) {
        const rawName = doctor.name.toLowerCase().startsWith('dr.') ? doctor.name.slice(3).trim() : doctor.name
        prefix = doctor.queueCode || rawName.charAt(0).toUpperCase()
      }
      
      queueCount = await prisma.queueNumber.count({
        where: { 
          clinicId,
          doctorId,
          queueDate: { gte: today, lt: nextDay }
        }
      })
    } else {
      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } })
        if (dept) {
          prefix = dept.name.charAt(0).toUpperCase()
        }
      }
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

      // 3. Create Invoice logic...
      // [Omitted standard invoice creation logic for brevity, keeping existing implementation]
      let regService = await tx.service.findFirst({
        where: { 
          serviceName: { contains: 'Pendaftaran', mode: 'insensitive' },
          OR: [ { clinicId: clinicId }, { clinic: { isMain: true } } ]
        }
      })

      if (!regService) {
        const clinic = await tx.clinic.findUnique({ where: { id: clinicId } })
        const clinicSuffix = clinic?.code || clinicId.slice(0, 4).toUpperCase()
        regService = await tx.service.create({
          data: {
            serviceCode: `REG-${clinicSuffix}`,
            serviceName: 'Biaya Pendaftaran',
            category: 'Administrasi',
            price: 50000,
            isActive: true,
            clinicId: clinicId
          }
        })
      }

      const todayInv = new Date()
      const dateStrInv = todayInv.toISOString().split('T')[0].replace(/-/g, '')
      todayInv.setHours(0, 0, 0, 0)
      const invCount = await tx.invoice.count({
        where: { 
          clinicId,
          createdAt: { gte: todayInv } 
        }
      })
      const invoiceNo = `INV-${dateStrInv}-${(invCount + 1).toString().padStart(4, '0')}`

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          patientId,
          clinicId,
          registrationId: registration.id,
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

    // REAL-TIME: Notify clinic listeners
    const io = req.app.get('io')
    if (io) {
      io.to(`clinic:${clinicId}`).emit('queue-updated', { type: 'CREATED', clinicId })
      console.log(`[Socket] Emit queue-updated to clinic:${clinicId}`)
    }

    res.status(201).json(result)
    console.log(`[Perf] createRegistration took ${Date.now() - startedAt}ms`)
  } catch (e) {
    console.error('Registration Error:', e)
    res.status(500).json({ 
      message: 'Gagal melakukan pendaftaran',
      error: (e as Error).message 
    })
  }
}

/**
 * Get active queues for a clinic today (Now with Pagination & Optimized Joins)
 */
export const getQueues = async (req: Request, res: Response) => {
  const startedAt = Date.now()
  try {
    const { clinicId, date, doctorId: filterDoctorId, departmentId: filterDepartmentId } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const targetDate = date ? new Date(date as string) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    const finalClinicId = isAdminView 
       ? (clinicId ? String(clinicId) : undefined)
       : (currentClinicId || (clinicId ? String(clinicId) : undefined))

    const user = (req as any).user
    const isDoctor = user?.role === 'DOCTOR'
    const doctorProfileId = user?.doctor?.id

    const effectiveDoctorFilter = filterDoctorId 
      ? String(filterDoctorId)
      : (isDoctor && !isAdminView && doctorProfileId ? doctorProfileId : undefined)

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const where: any = {
      clinicId: finalClinicId,
      queueDate: { gte: targetDate, lt: nextDay },
      ...(effectiveDoctorFilter ? { doctorId: effectiveDoctorFilter } : {}),
      ...(filterDepartmentId ? { departmentId: String(filterDepartmentId) } : {})
    }

    const [total, queues] = await Promise.all([
      prisma.queueNumber.count({ where }),
      prisma.queueNumber.findMany({
        where,
        skip: req.query.page ? skip : undefined, // Only paginate if page is provided
        take: req.query.page ? take : undefined,
        include: {
          patient: { select: { id: true, name: true, medicalRecordNo: true, gender: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          department: { select: { id: true, name: true } },
          // Efficiently join medical record to avoid sequential queries
          registration: {
            include: {
              medicalRecord: {
                include: { vitals: { orderBy: { recordedAt: 'desc' }, take: 1 } }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    // Flatten logic for compatibility with existing frontend
    const result = queues.map(q => ({
      ...q,
      hasMedicalRecord: !!q.registration?.medicalRecord,
      medicalRecord: q.registration?.medicalRecord ? {
        id: q.registration.medicalRecord.id,
        chiefComplaint: q.registration.medicalRecord.chiefComplaint,
        vitals: q.registration.medicalRecord.vitals[0] || null
      } : null
    }))

    if (req.query.page) {
      const paginated: PaginatedResult<any> = {
        data: result,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
      return res.json(paginated)
    }

    res.json(result)
    console.log(`[Perf] getQueues took ${Date.now() - startedAt}ms`)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update queue status (call, skip, ongoing, etc)
 */
export const updateQueueStatus = async (req: Request, res: Response) => {
  const startedAt = Date.now()
  try {
    const { id } = req.params
    const { status } = req.body

    const data: any = { status }
    if (status === 'called') {
      data.actualCallTime = new Date()
      data.callCounter = { increment: 1 }
    }

    const queue = await prisma.queueNumber.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true, medicalRecordNo: true, gender: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        department: { select: { id: true, name: true } },
        registration: {
          select: {
            medicalRecord: {
              select: { id: true }
            }
          }
        }
      }
    })

    // REAL-TIME: Notify clinic listeners
    const io = req.app.get('io')
    if (io) {
      io.to(`clinic:${queue.clinicId}`).emit('queue-updated', { type: 'STATUS_CHANGED', queueId: id, status })
    }

    res.json({
      ...queue,
      hasMedicalRecord: !!queue.registration?.medicalRecord
    })
    console.log(`[Perf] updateQueueStatus took ${Date.now() - startedAt}ms`)
  } catch (e) {
    console.error('[updateQueueStatus] Error:', e)
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
