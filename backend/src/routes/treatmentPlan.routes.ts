import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'
import {
  getTreatmentPlans,
  getTreatmentPlanById,
  createTreatmentPlan,
  createInvoice,
  updateStatus,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  addVisit,
  updateVisitServices,
  updateVisitSchedule,
  updateVisitStatus,
  updateVisitAdjustment,
  deleteVisit,
  updateVisitServicePrice,
  postProfitShare
} from '../controllers/treatmentPlan.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// CRUD Treatment Plans
router.get('/', getTreatmentPlans)
router.get('/:id', getTreatmentPlanById)
router.post('/', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), createTreatmentPlan)
router.put('/:id', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), updateTreatmentPlan)
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), deleteTreatmentPlan)
router.patch('/:id/status', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), updateStatus)

// Profit Sharing
router.post('/:id/post-profit-share', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), postProfitShare)

// Visit Management (Tahapan Rangkaian)
router.post('/:id/visits', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), addVisit)
router.put('/:id/visits/:visitId/services', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), updateVisitServices)
router.patch('/:id/visits/:visitId/services/:serviceId/price', roleMiddleware(['ADMIN', 'NURSE', 'DOCTOR']), updateVisitServicePrice)
router.put('/:id/visits/:visitId/schedule', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR']), updateVisitSchedule)
router.put('/:id/visits/:visitId/status', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE']), updateVisitStatus)
router.put('/:id/visits/:visitId/adjustment', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST']), updateVisitAdjustment)
router.delete('/:id/visits/:visitId', roleMiddleware(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']), deleteVisit)

// Invoice Management (Creates specific billing termin/DP)
router.post('/:id/invoices', createInvoice)

export default router
