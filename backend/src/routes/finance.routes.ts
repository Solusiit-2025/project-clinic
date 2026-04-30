import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getInvoices, processPayment, getFinancialSummary, postInvoice, 
  resetInvoicePayment, updateInvoiceBank, getExpenses, createExpense, deleteExpense
} from '../controllers/finance.controller'
import { uploadBon } from '../middleware/procurementUpload.middleware'

import { OpeningBalanceController } from '../controllers/opening-balance.controller'

const financeRoutes = Router()

// All finance routes require authentication
financeRoutes.use(authMiddleware)

// Opening Balance
financeRoutes.get('/opening-balance', OpeningBalanceController.getAll)
financeRoutes.post('/opening-balance', OpeningBalanceController.create)
financeRoutes.post('/opening-balance/:id/post', OpeningBalanceController.post)
financeRoutes.post('/opening-balance/:id/unpost', OpeningBalanceController.unpost)
financeRoutes.delete('/opening-balance/:id', OpeningBalanceController.delete)

financeRoutes.get('/invoices', getInvoices)
financeRoutes.post('/payments', processPayment)
financeRoutes.post('/invoices/post-to-ledger', postInvoice)
financeRoutes.post('/invoices/:id/reset-payment', resetInvoicePayment)
financeRoutes.put('/invoices/bank', updateInvoiceBank)
financeRoutes.get('/summary', getFinancialSummary)

// Expenses
financeRoutes.get('/expenses', getExpenses)
financeRoutes.post('/expenses', uploadBon.single('attachment'), createExpense)
financeRoutes.delete('/expenses/:id', deleteExpense)

export default financeRoutes
