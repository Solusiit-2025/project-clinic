import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { dentalLabUpload } from '../middleware/dentalLabUpload.middleware'
import {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
  getWorkOrderPrintData,
  getWorkOrderStats,
  updateWorkOrderInvoice
} from '../controllers/dentalLab.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Dashboard stats
router.get('/stats', getWorkOrderStats)

// CRUD Work Orders
router.get('/work-orders', getWorkOrders)
router.get('/work-orders/:id', getWorkOrderById)
router.post('/work-orders', dentalLabUpload.array('attachments', 5), createWorkOrder)
router.put('/work-orders/:id', dentalLabUpload.array('attachments', 5), updateWorkOrder)
router.delete('/work-orders/:id', deleteWorkOrder)

// Status Management
router.patch('/work-orders/:id/status', updateWorkOrderStatus)
router.patch('/work-orders/:id/invoice', updateWorkOrderInvoice)

// Print Data (untuk generate PDF di frontend)
router.get('/work-orders/:id/print', getWorkOrderPrintData)

export default router
