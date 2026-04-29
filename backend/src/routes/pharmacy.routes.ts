import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getPharmacyQueues,
  getPrescriptionById,
  updateDispenseStatus,
  updatePrescriptionItems
} from '../controllers/pharmacy.controller'
import {
  getCompoundFormulas,
  getCompoundFormulaById,
  createCompoundFormula,
  updateCompoundFormula,
  deleteCompoundFormula,
  getFormulaCategories,
  applyFormulaToItem,
  createProductFromFormula,
  bulkCreateProductsFromFormulas,
} from '../controllers/compoundFormula.controller'
import {
  assembleCompoundFormula,
  checkAssemblyFeasibility,
} from '../controllers/compoundAssembly.controller'

const router = Router()

// All pharmacy routes require authentication
router.use(authMiddleware)

// ── Pharmacy Queues & Prescriptions ──────────────────────────
// Get all active pharmacy queues/prescriptions
router.get('/queues', getPharmacyQueues)

// Get detail of a specific prescription
router.get('/prescriptions/:id', getPrescriptionById)

// Update dispense status (preparing, ready, dispensed) & deduct inventory
router.patch('/prescriptions/:id/status', updateDispenseStatus)

// Update prescription items (Adjustment/Substitution)
router.put('/prescriptions/:id/items', updatePrescriptionItems)

// ── Master Formula Racikan (Bill of Materials) ────────────────
// Daftar kategori formula (untuk dropdown filter)
router.get('/compound-formulas/categories', getFormulaCategories)

// Bulk create products from all formulas
router.post('/compound-formulas/bulk-create-products', bulkCreateProductsFromFormulas)

// CRUD master formula
router.get('/compound-formulas', getCompoundFormulas)
router.get('/compound-formulas/:id', getCompoundFormulaById)
router.post('/compound-formulas', createCompoundFormula)
router.put('/compound-formulas/:id', updateCompoundFormula)
router.delete('/compound-formulas/:id', deleteCompoundFormula)

// Terapkan formula ke resep (mengembalikan komponen + stok terkini)
router.post('/compound-formulas/:id/apply', applyFormulaToItem)

// Buat ProductMaster dari formula racikan
router.post('/compound-formulas/:id/create-product', createProductFromFormula)

// ── Assembly/Production Racikan ────────────────────────────────
// Cek kelayakan assembly (validasi stok bahan baku)
router.post('/compound-formulas/:id/check-assembly', checkAssemblyFeasibility)

// Rakit/produksi racikan dari bahan baku
router.post('/compound-formulas/:id/assemble', assembleCompoundFormula)

export default router
