import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getInvoices, processPayment, getFinancialSummary, postInvoice, 
  updateInvoiceBank, getExpenses, createExpense, deleteExpense
} from '../controllers/finance.controller'
import { uploadBon } from '../middleware/procurementUpload.middleware'

const financeRoutes = Router()

// All finance routes require authentication
financeRoutes.use(authMiddleware)

financeRoutes.get('/invoices', getInvoices)
financeRoutes.post('/payments', processPayment)
financeRoutes.post('/invoices/post-to-ledger', postInvoice)
financeRoutes.put('/invoices/bank', updateInvoiceBank)
financeRoutes.get('/summary', getFinancialSummary)

// Expenses
financeRoutes.get('/expenses', getExpenses)
financeRoutes.post('/expenses', uploadBon.single('attachment'), createExpense)
financeRoutes.delete('/expenses/:id', deleteExpense)

export default financeRoutes
