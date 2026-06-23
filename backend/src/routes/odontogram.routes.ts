import { Router } from 'express'
import { getOdontogramByPatientId, updateOdontogram } from '../controllers/odontogram.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/:patientId', getOdontogramByPatientId)
router.put('/:patientId', updateOdontogram)

export default router
