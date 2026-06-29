import { Router } from 'express'
import { getExecutiveSummary } from '../controllers/executiveSummary.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// Executive Summary — restricted to Admin & Super Admin
router.get(
  '/executive-summary',
  roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTING']),
  getExecutiveSummary
)

export default router
