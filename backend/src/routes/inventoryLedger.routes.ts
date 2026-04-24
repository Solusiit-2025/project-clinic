/**
 * Inventory Ledger Routes
 * =======================
 * Prefix: /api/inventory-ledger
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  syncSingleMutation,
  retroactiveSync,
  createOpeningBalance,
  getSyncStatus,
  getSyncSummary,
} from '../controllers/inventoryLedger.controller'

const inventoryLedgerRoutes = Router()

inventoryLedgerRoutes.use(authMiddleware)

// Sync satu mutasi ke GL (real-time atau manual)
inventoryLedgerRoutes.post('/sync/:mutationId', syncSingleMutation)

// Sync retroaktif semua transaksi lama (batch)
inventoryLedgerRoutes.post('/retroactive', retroactiveSync)

// Buat jurnal saldo awal Go-Live
inventoryLedgerRoutes.post('/opening-balance', createOpeningBalance)

// Cek status sync satu mutasi
inventoryLedgerRoutes.get('/status/:mutationId', getSyncStatus)

// Ringkasan status sync (dashboard)
inventoryLedgerRoutes.get('/summary', getSyncSummary)

export default inventoryLedgerRoutes
