import { Router } from 'express'
import { getDoctorFeeReport, createManualCommission, payCommissions, updateDoctorCommission, deleteDoctorCommission, getDiagnosisReport, getLbkReport } from '../controllers/report.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All report routes require authentication and appropriate roles
router.use(authMiddleware)

router.get('/doctor-fees', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), getDoctorFeeReport)
router.post('/manual-commission', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), createManualCommission)
router.post('/pay-commissions', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), payCommissions)
router.put('/doctor-fees/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), updateDoctorCommission)
router.delete('/doctor-fees/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'ACCOUNTING']), deleteDoctorCommission)

router.get('/diagnosis', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'NURSE', 'DOCTOR']), getDiagnosisReport)
router.get('/lbk', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'NURSE', 'DOCTOR']), getLbkReport)

export default router
