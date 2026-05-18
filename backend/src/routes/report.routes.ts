import { Router } from 'express'
import { getDoctorFeeReport, createManualCommission, payCommissions, updateDoctorCommission, deleteDoctorCommission } from '../controllers/report.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All report routes require authentication and appropriate roles
router.use(authMiddleware)

router.get('/doctor-fees', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), getDoctorFeeReport)
router.post('/manual-commission', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), createManualCommission)
router.post('/pay-commissions', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), payCommissions)
router.put('/doctor-fees/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), updateDoctorCommission)
router.delete('/doctor-fees/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), deleteDoctorCommission)

export default router
