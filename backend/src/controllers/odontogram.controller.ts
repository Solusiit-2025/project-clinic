import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { UpdateOdontogramPayloadSchema } from '../types/odontogram.schema'

/**
 * GET /api/odontograms/:patientId
 * Mengambil state odontogram terbaru untuk seorang pasien.
 */
export const getOdontogramByPatientId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params

    const odontogram = await prisma.odontogram.findUnique({
      where: { patientId }
    })

    if (!odontogram) {
      // Default state
      return res.status(200).json({ 
        data: {
          patientId,
          state: { teeth: {} },
          version: 1,
          lastUpdatedByRecordId: null,
        }, 
        message: 'Odontogram belum ada untuk pasien ini' 
      })
    }

    res.json({ data: odontogram })
  } catch (e) {
    console.error('[getOdontogramByPatientId] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * PUT /api/odontograms/:patientId
 * Memperbarui state odontogram terbaru untuk seorang pasien secara independen.
 */
export const updateOdontogram = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    
    // Validasi payload
    const parsed = UpdateOdontogramPayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ 
        message: 'Format state odontogram tidak valid', 
        errors: parsed.error.issues 
      })
    }

    const { state, expectedVersion } = parsed.data

    const existing = await prisma.odontogram.findUnique({
      where: { patientId }
    }) as any

    if (existing && existing.version !== expectedVersion) {
      return res.status(409).json({ 
        message: 'Terjadi konflik versi: Odontogram telah diubah oleh pengguna/sesi lain.',
        currentVersion: existing.version
      })
    }

    const newVersion = existing ? existing.version + 1 : 1

    const odontogram = await prisma.odontogram.upsert({
      where: { patientId },
      update: { state, version: newVersion },
      create: { patientId, state, version: newVersion }
    })

    res.json({ data: odontogram, message: 'Odontogram berhasil diperbarui' })
  } catch (e) {
    console.error('[updateOdontogram] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}
