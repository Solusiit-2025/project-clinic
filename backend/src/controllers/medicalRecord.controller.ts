import { Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Step 1: Nurse saves Vital Signs and Chief Complaint
 * Updates queue status to 'ready' (for doctor)
 */
export const saveNurseVitals = async (req: Request, res: Response) => {
  try {
    const { 
        queueId, 
        patientId, 
        clinicId, 
        registrationId,
        doctorId, 
        chiefComplaint, 
        vitals 
    } = req.body

    if (!queueId || !patientId || !clinicId) {
      return res.status(400).json({ message: 'Data wajib (Queue, Patient, Clinic) tidak lengkap' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Medical Record Number if doesn't exist for this registration
      let medicalRecord = await tx.medicalRecord.findFirst({
        where: { registrationId }
      })

      if (!medicalRecord) {
        const today = new Date()
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
        const count = await tx.medicalRecord.count({
          where: { recordDate: { gte: new Date(today.setHours(0,0,0,0)) } }
        })
        const recordNo = `MR-${dateStr}-${(count + 1).toString().padStart(4, '0')}`

        medicalRecord = await tx.medicalRecord.create({
          data: {
            recordNo,
            patientId,
            clinicId,
            doctorId: doctorId || null, // Doctor can be null during nurse triage
            registrationId,
            chiefComplaint: chiefComplaint || '',
            recordDate: new Date(),
          }
        })
      } else {
        // Update existing draft
        medicalRecord = await tx.medicalRecord.update({
          where: { id: medicalRecord.id },
          data: { chiefComplaint }
        })
      }

      // 2. Save Vital Signs (Upsert the latest one)
      if (vitals) {
        const existingVital = await tx.vitalSign.findFirst({
          where: { medicalRecordId: medicalRecord.id },
          orderBy: { recordedAt: 'desc' }
        })

        const vitalData = {
          medicalRecordId: medicalRecord.id,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          bloodPressure: vitals.bloodPressure,
          heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : null,
          respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
          weight: vitals.weight ? parseFloat(vitals.weight) : null,
          height: vitals.height ? parseFloat(vitals.height) : null,
          bloodOxygen: vitals.bloodOxygen ? parseFloat(vitals.bloodOxygen) : null,
          notes: vitals.notes,
          recordedAt: new Date()
        }

        if (existingVital) {
          await tx.vitalSign.update({
            where: { id: existingVital.id },
            data: vitalData
          })
        } else {
          await tx.vitalSign.create({
            data: vitalData
          })
        }
      }

      // 3. Update Queue Status to 'ready' (Nurse check done)
      await tx.queueNumber.update({
        where: { id: queueId },
        data: { status: 'ready' }
      })

      return medicalRecord
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    res.status(200).json(result)
  } catch (e) {
    console.error('Save Nurse Vitals Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Step 2: Doctor saves Diagnosis, Treatments, and Prescriptions
 * Updates queue status to 'completed'
 */
export const saveDoctorConsultation = async (req: Request, res: Response) => {
  try {
    const { 
        queueId,
        medicalRecordId,
        subjective,
        objective,
        diagnosis,
        treatmentPlan,
        labNotes,
        labResults,
        notes,
        hasInformedConsent,
        services, // [{ serviceId, price, quantity }]
        prescriptions, // [{ medicineId, quantity, dosage, frequency, duration, instructions }]
        isFinal = true // Default to true for backward compatibility
    } = req.body

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Medical Record with Doctor's findings
      const mr = await tx.medicalRecord.update({
        where: { id: medicalRecordId },
        data: {
          subjective,
          objective,
          diagnosis,
          treatmentPlan,
          labNotes,
          labResults,
          notes,
          hasInformedConsent: !!hasInformedConsent,
          consultationDraft: !isFinal ? { subjective, objective, diagnosis, treatmentPlan, services, prescriptions } : Prisma.DbNull,
          doctorId: (req as any).user.doctor?.id || null 
        },
        include: { patient: true, services: true }
      })

      // 1.1 Handle Clinical Services (Tindakan) - Record them to MedicalRecord
      if (isFinal && services && Array.isArray(services)) {
        await tx.medicalRecordService.deleteMany({ where: { medicalRecordId: mr.id } })
        for (const s of services) {
          await tx.medicalRecordService.create({
            data: {
              medicalRecordId: mr.id,
              serviceId: s.serviceId,
              quantity: s.quantity || 1,
              price: s.price,
              notes: s.notes || ''
            }
          })
        }
      }

      // If it's just a draft, we stop here. We don't close queue, don't bill, don't RX.
      if (!isFinal) {
        return mr
      }

      // 2. Handle Prescriptions (Only if Final)
      if (prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0) {
        const validPrescriptions = prescriptions.filter((item: any) => item.medicineId)

        if (validPrescriptions.length > 0) {
          const medicineIds = [...new Set(validPrescriptions.map((item: any) => item.medicineId))]
          const existingMedicines = await tx.medicine.findMany({
            where: { id: { in: medicineIds } },
            select: { id: true }
          })
          const validMedicineIds = new Set(existingMedicines.map((m: any) => m.id))
          const safePrescriptions = validPrescriptions.filter((item: any) => validMedicineIds.has(item.medicineId))

          if (safePrescriptions.length > 0) {
            const pCount = await tx.prescription.count()
            const pNo = `RX-${Date.now().toString().slice(-6)}-${(pCount + 1).toString().padStart(3, '0')}`

            await tx.prescription.create({
              data: {
                prescriptionNo: pNo,
                medicalRecordId: mr.id,
                patientId: mr.patientId,
                doctorId: mr.doctorId || (req as any).user.doctor?.id,
                prescriptionDate: new Date(),
                items: {
                  create: safePrescriptions.map((item: any) => ({
                    medicineId: item.medicineId,
                    quantity: parseInt(item.quantity) || 0,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: item.instructions
                  }))
                }
              }
            })
          }
        }
      }

      // 3. Update Invoice with Services & Medicines (Only if Final)
      const invoice = await tx.invoice.findFirst({
        where: { patientId: mr.patientId, clinicId: mr.clinicId, status: 'unpaid' },
        orderBy: { createdAt: 'desc' }
      })

      if (invoice) {
        let additionalTotal = 0

        // Add Services
        if (services && Array.isArray(services)) {
          for (const s of services) {
            const serviceData = await tx.service.findUnique({ where: { id: s.serviceId } })
            if (serviceData) {
              const itemPrice = parseFloat(s.price) || serviceData.price
              const quantity = parseInt(s.quantity) || 1
              const subtotal = itemPrice * quantity
              await tx.invoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  serviceId: s.serviceId,
                  description: serviceData.serviceName,
                  quantity: quantity,
                  price: itemPrice,
                  subtotal
                }
              })
              additionalTotal += subtotal
            }
          }
        }

        // 3.1 Pre-fetch Service for Medicine (One time only)
        let obatService = await tx.service.findFirst({
          where: { 
            serviceName: { contains: 'Obat', mode: 'insensitive' },
            OR: [ { clinicId: mr.clinicId }, { clinic: { isMain: true } } ]
          }
        })
        
        if (!obatService) {
          obatService = await tx.service.create({
            data: {
              serviceCode: 'MED-GEN',
              serviceName: 'Obat-obatan',
              price: 0,
              isActive: true,
              clinicId: mr.clinicId
            }
          })
        }

        // Add Medicines
        if (prescriptions && Array.isArray(prescriptions)) {
          for (const p of prescriptions) {
            const product = await tx.product.findFirst({
              where: {
                clinicId: mr.clinicId,
                masterProduct: {
                  medicineId: p.medicineId
                }
              }
            })

            if (product) {
              const itemPrice = product.sellingPrice || 0
              const quantity = parseInt(p.quantity) || 0
              const subtotal = itemPrice * quantity
              
              await tx.invoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  serviceId: obatService.id,
                  description: `${product.productName} (${p.dosage})`,
                  quantity: quantity,
                  price: itemPrice,
                  subtotal
                }
              })
              additionalTotal += subtotal
            }
          }
        }

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: { increment: additionalTotal },
            total: { increment: additionalTotal }
          }
        })
      }

      // 4. Update Queue Status to 'completed' (Only if Final)
      if (isFinal) {
        await tx.queueNumber.update({
          where: { id: queueId },
          data: { status: 'completed' }
        })
      }

      return mr
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    res.status(200).json(result)
  } catch (e) {
    const error = e as Error
    console.error('Save Doctor Consultation Error:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get Medical Record by Registration ID (to load draft for Nurse/Doctor)
 */
export const getMedicalRecordByRegistration = async (req: Request, res: Response) => {
    const startedAt = Date.now()
    try {
        const { id } = req.params
        const isAdminView = (req as any).isAdminView
        const user = (req as any).user
        
        console.log(`[DEBUG] Fetching Medical Record for Registration: ${id}`)
        
        const mr = await prisma.medicalRecord.findUnique({
            where: { registrationId: id },
            include: {
                vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
                prescriptions: { include: { items: { include: { medicine: true } } } },
                services: { include: { service: true } },
                referrals: { include: { toClinic: true, toDepartment: true } },
                attachments: true,
                patient: true,
                doctor: true
            }
        })
        
        if (!mr) {
            console.warn(`[DEBUG] No Medical Record found for Registration ID: ${id}`)
            return res.json(null)
        }

        // Access Control: If user is a DOCTOR and NOT in admin view, check if they are the assigned doctor
        if (user.role === 'DOCTOR' && !isAdminView) {
            if (mr.doctorId && mr.doctorId !== user.doctor?.id) {
                return res.status(403).json({ message: 'Akses ditolak: Anda bukan dokter yang ditugaskan untuk rekam medis ini' })
            }
        }
        
        console.log(`[DEBUG] Medical Record found: ${mr.id}, Vitals count: ${mr.vitals?.length || 0}`)
        console.log(`[Perf] getMedicalRecordByRegistration took ${Date.now() - startedAt}ms`)
        res.json(mr)
    } catch (e) {
        res.status(500).json({ message: (e as Error).message })
    }
}
/**
 * Get all Medical Records for a specific patient (Medical History)
 */
export const getMedicalRecordsByPatient = async (req: Request, res: Response) => {
    const startedAt = Date.now()
    try {
        const { id } = req.params // patientId
        
        const history = await prisma.medicalRecord.findMany({
            where: { patientId: id },
            select: {
                id: true,
                recordDate: true,
                diagnosis: true,
                treatmentPlan: true,
                doctor: {
                  select: {
                    id: true,
                    name: true
                  }
                }
            },
            orderBy: { recordDate: 'desc' }
        })
        
        res.json(history)
        console.log(`[Perf] getMedicalRecordsByPatient took ${Date.now() - startedAt}ms`)
    } catch (e) {
        res.status(500).json({ message: (e as Error).message })
    }
}
