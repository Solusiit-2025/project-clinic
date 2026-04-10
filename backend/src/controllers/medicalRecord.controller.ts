import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

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
        diagnosis,
        treatmentPlan,
        labNotes,
        labResults,
        notes,
        services, // [{ serviceId, price, quantity }]
        prescriptions // [{ medicineId, quantity, dosage, frequency, duration, instructions }]
    } = req.body

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Medical Record with Doctor's findings
      const mr = await tx.medicalRecord.update({
        where: { id: medicalRecordId },
        data: {
          diagnosis,
          treatmentPlan,
          labNotes,
          labResults,
          notes,
          doctorId: (req as any).user.doctor?.id || null // Ensure the practitioner ID is set correctly
        },
        include: { patient: true }
      })

      // 2. Handle Prescriptions
      if (prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0) {
        // Filter out any items that don't have a valid medicineId
        const validPrescriptions = prescriptions.filter((item: any) => item.medicineId)

        if (validPrescriptions.length > 0) {
          // Verify all medicineIds actually exist in the medicines table
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
                doctorId: mr.doctorId!,
                prescriptionDate: new Date(),
                items: {
                  create: safePrescriptions.map((item: any) => ({
                    medicineId: item.medicineId,
                    quantity: parseInt(item.quantity),
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

      // 3. Update Invoice with Services & Medicines
      // Find the existing invoice for this registration
      const invoice = await tx.invoice.findFirst({
        where: { patientId: mr.patientId, clinicId: mr.clinicId, status: 'unpaid' },
        orderBy: { createdAt: 'desc' }
      })

      if (invoice) {
        let additionalTotal = 0

        // Add Services to Invoice
        if (services && Array.isArray(services)) {
          for (const s of services) {
            const serviceData = await tx.service.findUnique({ where: { id: s.serviceId } })
            if (serviceData) {
              const itemPrice = s.price || serviceData.price
              const subtotal = itemPrice * (s.quantity || 1)
              await tx.invoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  serviceId: s.serviceId,
                  description: serviceData.serviceName,
                  quantity: s.quantity || 1,
                  price: itemPrice,
                  subtotal
                }
              })
              additionalTotal += subtotal
            }
          }
        }

        // Add Medicines to Invoice
        if (prescriptions && Array.isArray(prescriptions)) {
          for (const p of prescriptions) {
            const medicine = await tx.medicine.findUnique({ 
                where: { id: p.medicineId },
                include: { inventoryItems: { where: { clinicId: mr.clinicId } } }
            })
            if (medicine) {
              const invItem = medicine.inventoryItems?.[0]
              const itemPrice = invItem?.sellingPrice || 0
              const subtotal = itemPrice * parseInt(p.quantity)
              
              // We'll use a placeholder serviceId for medicines if needed, 
              // or handle it as a generic item. The schema says InvoiceItem needs a serviceId.
              // I'll look for a "Farmasi" or "Obat" service.
              let obatService = await tx.service.findFirst({
                where: { 
                  serviceName: { contains: 'Obat', mode: 'insensitive' },
                  OR: [
                    { clinicId: mr.clinicId },
                    { clinic: { isMain: true } }
                  ]
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

              await tx.invoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  serviceId: obatService.id,
                  description: `${medicine.medicineName} (${p.dosage})`,
                  quantity: parseInt(p.quantity),
                  price: itemPrice,
                  subtotal
                }
              })
              additionalTotal += subtotal
            }
          }
        }

        // Update Invoice Total
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: { increment: additionalTotal },
            total: { increment: additionalTotal }
          }
        })
      }

      // 4. Update Queue Status to 'completed'
      await tx.queueNumber.update({
        where: { id: queueId },
        data: { status: 'completed' }
      })

      return mr
    })

    res.status(200).json(result)
  } catch (e) {
    console.error('Save Doctor Consultation Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Get Medical Record by Registration ID (to load draft for Nurse/Doctor)
 */
export const getMedicalRecordByRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        console.log(`[DEBUG] Fetching Medical Record for Registration: ${id}`)
        
        const mr = await prisma.medicalRecord.findUnique({
            where: { registrationId: id },
            include: {
                vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
                prescriptions: { include: { items: { include: { medicine: true } } } },
                patient: true,
                doctor: true
            }
        })
        
        if (!mr) {
            console.warn(`[DEBUG] No Medical Record found for Registration ID: ${id}`)
        } else {
            console.log(`[DEBUG] Medical Record found: ${mr.id}, Vitals count: ${mr.vitals?.length || 0}`)
        }
        
        res.json(mr)
    } catch (e) {
        res.status(500).json({ message: (e as Error).message })
    }
}
