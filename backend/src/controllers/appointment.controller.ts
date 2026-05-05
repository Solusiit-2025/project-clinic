import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'

/**
 * Get all appointments with filtering
 */
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { clinicId, doctorId, patientId, status, startDate, endDate } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const where: any = {
      clinicId: isAdminView ? (clinicId ? String(clinicId) : undefined) : currentClinicId,
      ...(doctorId ? { doctorId: String(doctorId) } : {}),
      ...(patientId ? { patientId: String(patientId) } : {}),
      ...(status ? { status: String(status) } : { status: { not: 'checked-in' } }),
    }

    if (startDate || endDate) {
      where.appointmentDate = {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      }
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take,
        include: {
          patient: { select: { id: true, name: true, medicalRecordNo: true, phone: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          clinic: { select: { id: true, name: true } },
        },
        orderBy: { appointmentDate: 'asc' },
      }),
    ])

    const result: PaginatedResult<any> = {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }

    res.json(result)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.appointment.delete({ where: { id } })
    res.json({ message: 'Janji temu berhasil dihapus selamanya' })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Create a new appointment
 * Supports: Existing patients and New patients (Lite Registration)
 */
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { 
      patientId, 
      doctorId, 
      clinicId, 
      appointmentDate, 
      appDurationMin, 
      notes,
      // For New Patient (Lite)
      newPatientName,
      newPatientPhone,
      newPatientDob
    } = req.body

    const userId = (req as any).user?.id
    const targetClinicId = clinicId || (req as any).clinicId

    // 0. Basic Validation
    if (!doctorId) return res.status(400).json({ message: 'Silakan pilih Dokter tujuan' })
    if (!appointmentDate) return res.status(400).json({ message: 'Silakan tentukan Tanggal & Jam janji temu' })
    
    const parsedDate = new Date(appointmentDate as string)
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Format tanggal janji temu tidak valid' })
    }

    let finalPatientId = patientId

    // 1. Handle New Patient (Lite Registration)
    if (!finalPatientId && newPatientName && newPatientPhone) {
      // Hanya gunakan pasien lama JIKA nomor HP DAN Nama sama persis (kasus duplikat input)
      let patient = await prisma.patient.findFirst({ 
        where: { 
            phone: newPatientPhone,
            name: { equals: newPatientName, mode: 'insensitive' }
        } 
      })
      
      if (!patient) {
          // Jika tidak ketemu yang persis (nama beda tapi HP sama, tetap buat pasien baru)
          // Ini mendukung kasus keluarga (Anak/Istri) pakai 1 HP yang sama
          const today = new Date()
          const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
          const count = await prisma.patient.count({
            where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } }
          })
          const medicalRecordNo = `TEMP-${dateStr}-${(count + 1).toString().padStart(3, '0')}`
  
          patient = await prisma.patient.create({
            data: {
              name: newPatientName,
              phone: newPatientPhone,
              dateOfBirth: newPatientDob ? new Date(newPatientDob) : null,
              medicalRecordNo,
              isActive: true
            }
          })
      }
      finalPatientId = patient.id
    }

    if (!finalPatientId) {
      return res.status(400).json({ message: 'Patient ID atau data Pasien Baru wajib diisi' })
    }

    // 2. Generate Appointment No
    const today = new Date()
    const y = today.getFullYear()
    const m = (today.getMonth() + 1).toString().padStart(2, '0')
    const d = today.getDate().toString().padStart(2, '0')
    const dStr = `${y}${m}${d}`
    
    // Cari data terakhir hari ini untuk menentukan nomor urut berikutnya
    const lastAppt = await prisma.appointment.findFirst({
        where: { appointmentNo: { startsWith: `APT-${dStr}-` } },
        orderBy: { appointmentNo: 'desc' }
    })

    let nextNum = 1
    if (lastAppt) {
        const parts = lastAppt.appointmentNo.split('-')
        const lastSeq = parseInt(parts[parts.length - 1])
        nextNum = lastSeq + 1
    }

    const appointmentNo = `APT-${dStr}-${nextNum.toString().padStart(4, '0')}`

    // 3. Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNo,
        patientId: finalPatientId,
        doctorId,
        clinicId: targetClinicId,
        appointmentDate: parsedDate,
        appDurationMin: appDurationMin || 30,
        notes,
        status: 'scheduled',
        createdBy: userId
      },
      include: {
        patient: { select: { id: true, name: true, medicalRecordNo: true } },
        doctor: { select: { id: true, name: true } },
      }
    })

    res.status(201).json(appointment)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update appointment status (Confirm, Cancel, etc)
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, cancelReason } = req.body
    const userId = (req as any).user?.id

    const data: any = { 
        status,
        updatedBy: userId 
    }
    
    if (status === 'cancelled') {
      data.cancelReason = cancelReason
      data.cancelledAt = new Date()
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } }
      }
    })

    res.json(appointment)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Update appointment details (Reschedule, Change Doctor, etc)
 */
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { doctorId, appointmentDate, appDurationMin, notes, clinicId } = req.body
    const userId = (req as any).user?.id

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(doctorId ? { doctorId } : {}),
        ...(appointmentDate ? { appointmentDate: new Date(appointmentDate) } : {}),
        ...(appDurationMin ? { appDurationMin: Number(appDurationMin) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(clinicId ? { clinicId } : {}),
        updatedBy: userId
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } }
      }
    })

    res.json(appointment)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Check-In Appointment: Convert to active Queue & Registration
 */
export const checkInAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true }
    })

    if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan' })
    if (appointment.status === 'checked-in') return res.status(400).json({ message: 'Pasien sudah melakukan check-in' })

    // We reuse the logic from transaction.controller similar to createRegistration
    // but we link it to this appointment.
    
    const result = await prisma.$transaction(async (tx) => {
        // 1. Generate Reg No (Robust)
        const today = new Date()
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
        
        let nextRegNum = 1
        const lastReg = await tx.registration.findFirst({
          where: { 
            clinicId: appointment.clinicId,
            registrationNo: { startsWith: `REG-${dateStr}-` }
          },
          orderBy: { registrationNo: 'desc' }
        })

        if (lastReg) {
          const parts = lastReg.registrationNo.split('-')
          const lastNum = parseInt(parts[parts.length - 1])
          if (!isNaN(lastNum)) nextRegNum = lastNum + 1
        }

        let registrationNo = ''
        let isRegUnique = false
        while (!isRegUnique) {
          registrationNo = `REG-${dateStr}-${nextRegNum.toString().padStart(4, '0')}`
          const existing = await tx.registration.findUnique({
            where: { registrationNo_clinicId: { registrationNo, clinicId: appointment.clinicId! } }
          })
          if (!existing) {
            isRegUnique = true
          } else {
            nextRegNum++
          }
        }

        // 2. Generate Queue No (Robust)
        const todayQueue = new Date()
        todayQueue.setHours(0, 0, 0, 0)
        const nextDayQueue = new Date(todayQueue)
        nextDayQueue.setDate(todayQueue.getDate() + 1)

        let prefix = appointment.doctor.queueCode || appointment.doctor.name.charAt(0).toUpperCase()
        
        let nextQueueNum = 1
        const lastQueue = await tx.queueNumber.findFirst({
          where: { 
            clinicId: appointment.clinicId,
            queueDate: { gte: todayQueue, lt: nextDayQueue },
            queueNo: { startsWith: prefix }
          },
          orderBy: { queueNo: 'desc' }
        })

        if (lastQueue) {
          const qParts = lastQueue.queueNo.split('-')
          const lastQNum = parseInt(qParts[qParts.length - 1])
          if (!isNaN(lastQNum)) nextQueueNum = lastQNum + 1
        }

        let queueNo = ''
        let isQueueUnique = false
        while (!isQueueUnique) {
          queueNo = `${prefix}-${nextQueueNum.toString().padStart(3, '0')}`
          const qExists = await tx.queueNumber.findUnique({
            where: { queueNo_clinicId_queueDate: { queueNo, clinicId: appointment.clinicId!, queueDate: todayQueue } }
          })
          if (!qExists) {
            isQueueUnique = true
          } else {
            nextQueueNum++
          }
        }

        // 3. Create Registration
        const registration = await tx.registration.create({
            data: {
              patientId: appointment.patientId,
              clinicId: appointment.clinicId,
              doctorId: appointment.doctorId,
              registrationNo,
              registrationDate: new Date(),
              visitType: 'appointment',
              status: 'completed'
            }
        })

        // 4. Create Queue Number
        await tx.queueNumber.create({
            data: {
              queueNo,
              patientId: appointment.patientId,
              clinicId: appointment.clinicId,
              registrationId: registration.id,
              appointmentId: appointment.id,
              doctorId: appointment.doctorId,
              queueDate: new Date(),
              status: 'waiting'
            }
        })

        // 5. Create Invoice (Registration Fee)
        let regService = await tx.service.findFirst({
          where: { 
            serviceName: { contains: 'Pendaftaran', mode: 'insensitive' },
            OR: [ { clinicId: appointment.clinicId! }, { clinic: { isMain: true } } ]
          }
        })

        if (!regService) {
          const clinic = await tx.clinic.findUnique({ where: { id: appointment.clinicId! } })
          const clinicSuffix = clinic?.code || (appointment.clinicId ? appointment.clinicId.slice(0, 4).toUpperCase() : 'GEN')
          regService = await tx.service.create({
            data: {
              serviceCode: `REG-${clinicSuffix}-${Math.floor(Math.random() * 1000)}`,
              serviceName: 'Biaya Pendaftaran',
              category: 'Administrasi',
              price: 50000,
              isActive: true,
              clinicId: appointment.clinicId
            }
          })
        }

        const dateStrInv = today.toISOString().split('T')[0].replace(/-/g, '')
        
        let nextInvNum = 1
        const lastInv = await tx.invoice.findFirst({
          where: { 
            invoiceNo: { startsWith: `INV-${dateStrInv}-` }
          },
          orderBy: { invoiceNo: 'desc' }
        })

        if (lastInv) {
          const parts = lastInv.invoiceNo.split('-')
          const lastNum = parseInt(parts[parts.length - 1])
          if (!isNaN(lastNum)) nextInvNum = lastNum + 1
        }

        let invoiceNo = ''
        let isInvUnique = false
        while (!isInvUnique) {
          invoiceNo = `INV-${dateStrInv}-${nextInvNum.toString().padStart(4, '0')}`
          const existing = await tx.invoice.findUnique({
            where: { invoiceNo }
          })
          if (!existing) {
            isInvUnique = true
          } else {
            nextInvNum++
          }
        }

        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            patientId: appointment.patientId,
            clinicId: appointment.clinicId,
            registrationId: registration.id,
            appointmentId: appointment.id,
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

        // 6. Update Appointment
        await tx.appointment.update({
            where: { id },
            data: { status: 'checked-in', updatedBy: userId }
        })

        return { registration, queueNo, invoice }
    })

    res.json({ message: 'Check-in berhasil', ...result })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
