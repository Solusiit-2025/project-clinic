import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getPharmacyQueues,
  getPrescriptionById,
  updateDispenseStatus
} from '../controllers/pharmacy.controller'

const router = Router()

// All pharmacy routes require authentication
router.use(authMiddleware)

// Get all active pharmacy queues/prescriptions
router.get('/queues', getPharmacyQueues)

// Get detail of a specific prescription
router.get('/prescriptions/:id', getPrescriptionById)

// Update dispense status (preparing, ready, dispensed) & deduct inventory
router.patch('/prescriptions/:id/status', updateDispenseStatus)

export default router
