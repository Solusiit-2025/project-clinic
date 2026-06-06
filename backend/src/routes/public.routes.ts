import { Router } from 'express'
import { getClinics, getPatients } from '../controllers/master.controller'
import { getQueues } from '../controllers/transaction.controller'
import { createAppointment } from '../controllers/appointment.controller'
import { prisma } from '../lib/prisma'
import { SiteSettingService } from '../services/siteSetting.service'
import { verifyLabOrder } from '../controllers/verify.controller'

const router = Router()
const siteSettingService = new SiteSettingService()

// GET /api/public/clinics - Get all clinics for discovery
router.get('/clinics', getClinics)

// GET /api/public/queues - Get queue list for a specific clinic
router.get('/queues', getQueues)

// Simple In-Memory Rate Limiter untuk proteksi pendaftaran publik
const requestTracker = new Map<string, { count: number; firstRequest: number }>();

const publicRateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const WINDOW_MS = 60 * 60 * 1000; // 1 Jam
    const MAX_REQUESTS = 3;

    const data = requestTracker.get(ip);

    if (!data) {
        requestTracker.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    // Reset jika sudah lewat 1 jam
    if (now - data.firstRequest > WINDOW_MS) {
        requestTracker.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ 
            message: 'Terlalu banyak permintaan pendaftaran. Mohon coba lagi dalam 1 jam demi keamanan.' 
        });
    }

    data.count++;
    next();
};

// POST /api/public/appointments - Public booking from home
router.post('/appointments', publicRateLimit, createAppointment)
router.get('/doctors', async (req, res) => {
    // We need to provide doc list to public page
    try {
        const docs = await prisma.doctor.findMany({ 
            where: { isActive: true },
            select: { 
                id: true, 
                name: true, 
                specialization: true,
                bio: true,
                profilePicture: true,
                schedules: {
                    where: { isActive: true },
                    select: { dayOfWeek: true, startTime: true, endTime: true }
                }
            } 
        })
        res.json(docs)
    } catch (e) {
        res.status(500).json({ error: (e as Error).message })
    }
})

// GET /api/public/settings - Get display settings (videos, etc)
router.get('/settings', async (req, res) => {
  try {
    const settings = await siteSettingService.getAllSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public settings' })
  }
})

// Rate Limiter khusus untuk verifikasi dokumen (5 req / 5 min)
const verifyTracker = new Map<string, { count: number; firstRequest: number }>();

const verifyRateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const WINDOW_MS = 5 * 60 * 1000; // 5 Menit
    const MAX_REQUESTS = 5;

    const data = verifyTracker.get(ip);

    if (!data) {
        verifyTracker.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    if (now - data.firstRequest > WINDOW_MS) {
        verifyTracker.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ 
            message: 'Terlalu banyak permintaan verifikasi. Mohon coba lagi dalam 5 menit demi keamanan.' 
        });
    }

    data.count++;
    next();
};

// GET /api/public/verify/lab/:id
router.get('/verify/lab/:id', verifyRateLimit, verifyLabOrder)

export default router
