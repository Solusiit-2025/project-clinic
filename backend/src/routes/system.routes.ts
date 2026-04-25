import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { resetTransactions } from '../controllers/system.controller';

const router = Router();

// Endpoint for Go Live Reset
// ONLY SUPER_ADMIN can access this destructive tool
router.post('/reset-transactions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), resetTransactions);

export default router;
