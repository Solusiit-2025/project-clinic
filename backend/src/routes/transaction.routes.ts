import { Router } from 'express'
import { 
  createRegistration, 
  getQueues, 
  updateQueueStatus 
} from '../controllers/transaction.controller'

const router = Router()

// Registrasi & Antrian
router.post('/registrations', createRegistration)
router.get('/queues', getQueues)
router.patch('/queues/:id/status', updateQueueStatus)

export default router
