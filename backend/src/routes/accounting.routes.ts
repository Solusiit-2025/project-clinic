import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getTrialBalance, getProfitLoss, createJournalEntry, 
  getBalanceSheet, getGeneralLedger, postYearEndClosing 
} from '../controllers/accounting.controller'

const accountingRoutes = Router()

accountingRoutes.use(authMiddleware)

accountingRoutes.get('/trial-balance', getTrialBalance)
accountingRoutes.get('/profit-loss', getProfitLoss)
accountingRoutes.get('/balance-sheet', getBalanceSheet)
accountingRoutes.get('/general-ledger', getGeneralLedger)
accountingRoutes.post('/journals', createJournalEntry)
accountingRoutes.post('/close-year', postYearEndClosing)

export default accountingRoutes
