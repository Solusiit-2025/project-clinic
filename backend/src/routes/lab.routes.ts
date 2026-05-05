import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { labUpload } from '../middleware/labUpload.middleware'
import {
  getLabTestMasters,
  createLabTestMaster,
  updateLabTestMaster,
  deleteLabTestMaster,
  getLabOrders,
  getLabOrderDetails,
  updateLabResults,
  uploadLabAttachments,
  deleteLabAttachment
} from '../controllers/lab.controller'

const labRoutes = Router()

// All lab routes require authentication
labRoutes.use(authMiddleware)

// Master Lab
labRoutes.get('/test-masters', getLabTestMasters)
labRoutes.post('/test-masters', createLabTestMaster)
labRoutes.put('/test-masters/:id', updateLabTestMaster)
labRoutes.delete('/test-masters/:id', deleteLabTestMaster)

// Lab Orders & Results
labRoutes.get('/orders', getLabOrders)
labRoutes.get('/orders/:id', getLabOrderDetails)
labRoutes.put('/orders/:id/results', updateLabResults)
labRoutes.post('/orders/:id/attachments', labUpload.array('files', 5), uploadLabAttachments)
labRoutes.delete('/attachments/:id', deleteLabAttachment)

export default labRoutes
