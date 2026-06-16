import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
  getWorkOrderPrintData,
  getWorkOrderStats,
} from '../controllers/dentalLab.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Dashboard stats
router.get('/stats', getWorkOrderStats)

// CRUD Work Orders
router.get('/work-orders', getWorkOrders)
router.get('/work-orders/:id', getWorkOrderById)
router.post('/work-orders', createWorkOrder)
router.delete('/work-orders/:id', deleteWorkOrder)

// Status Management
router.patch('/work-orders/:id/status', updateWorkOrderStatus)

// Print Data (untuk generate PDF di frontend)
router.get('/work-orders/:id/print', getWorkOrderPrintData)

export default router
