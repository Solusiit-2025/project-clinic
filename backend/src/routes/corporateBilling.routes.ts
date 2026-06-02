import { Router } from 'express'
import {
  getCorporateInvoices,
  getPendingPatientInvoices,
  generateCorporateInvoice,
  processCorporatePayment,
  postCorporateInvoice,
  resetCorporatePayment
} from '../controllers/corporateBilling.controller'

const router = Router()

// Corporate Billing endpoints (mapped under /finance/corporate-billing)
router.get('/', getCorporateInvoices)
router.get('/pending/:partnerId', getPendingPatientInvoices)
router.post('/generate', generateCorporateInvoice)
router.post('/pay', processCorporatePayment)
router.post('/reset-payment', resetCorporatePayment)
router.post('/post', postCorporateInvoice)

export default router
