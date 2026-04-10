import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { getInvoices, processPayment, getFinancialSummary } from '../controllers/finance.controller'

const financeRoutes = Router()

// All finance routes require authentication
financeRoutes.use(authMiddleware)

financeRoutes.get('/invoices', getInvoices)
financeRoutes.post('/payments', processPayment)
financeRoutes.get('/summary', getFinancialSummary)

export default financeRoutes
