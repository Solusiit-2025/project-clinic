import { Router } from 'express'
import { getBirths, createBirth, deleteBirth, getDeaths, markDeath, unmarkDeath } from '../controllers/birthDeath.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// Birth routes
router.get('/births', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'STAFF']), getBirths)
router.post('/births', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'STAFF']), createBirth)
router.delete('/births/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), deleteBirth)

// Death routes
router.get('/deaths', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'STAFF']), getDeaths)
router.post('/deaths/:id/mark', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'STAFF']), markDeath)
router.post('/deaths/:id/unmark', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), unmarkDeath)

export default router
