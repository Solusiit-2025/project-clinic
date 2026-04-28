import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { resetTransactions, getRolePermissions, updateRolePermissions } from '../controllers/system.controller';

const router = Router();

// Endpoint for Go Live Reset
// ONLY SUPER_ADMIN can access this destructive tool
router.post('/reset-transactions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), resetTransactions);

router.get('/roles/permissions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), getRolePermissions);
router.post('/roles/permissions', authMiddleware, roleMiddleware(['SUPER_ADMIN']), updateRolePermissions);

export default router;
