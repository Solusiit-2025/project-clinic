import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  createRegistration, 
  getQueues, 
  getQueueById,
  updateQueueStatus 
} from '../controllers/transaction.controller'
import { 
  saveNurseVitals, 
  saveDoctorConsultation, 
  getMedicalRecordByRegistration 
} from '../controllers/medicalRecord.controller'

const router = Router()

// All transaction routes require authentication
router.use(authMiddleware)

// Registrasi & Antrian
router.post('/registrations', createRegistration)
router.get('/queues', getQueues)
router.get('/queues/:id', getQueueById)
router.patch('/queues/:id/status', updateQueueStatus)

// Pemeriksaan Medis (2 Tahapan)
router.post('/medical-records/nurse', saveNurseVitals)
router.post('/medical-records/doctor', saveDoctorConsultation)
router.get('/medical-records/registration/:id', getMedicalRecordByRegistration)

export default router
