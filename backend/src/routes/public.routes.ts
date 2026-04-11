import { Router } from 'express'
import { getClinics } from '../controllers/master.controller'
import { getQueues } from '../controllers/transaction.controller'
import { SiteSettingService } from '../services/siteSetting.service'

const router = Router()
const siteSettingService = new SiteSettingService()

// GET /api/public/clinics - Get all clinics for discovery
router.get('/clinics', getClinics)

// GET /api/public/queues - Get queue list for a specific clinic
router.get('/queues', getQueues)

// GET /api/public/settings - Get display settings (videos, etc)
router.get('/settings', async (req, res) => {
  try {
    const settings = await siteSettingService.getAllSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public settings' })
  }
})

export default router
