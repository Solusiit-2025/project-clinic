import { Router } from 'express';
import * as InventoryController from '../controllers/inventory.controller';
import * as ProcurementController from '../controllers/procurement.controller';
import * as TransferController from '../controllers/transfer.controller';

const router = Router();

// --- Stock Management ---
router.get('/products', InventoryController.getBranchProducts);
router.get('/stocks', InventoryController.getBranchStocks);
router.get('/mutations', InventoryController.getStockMutations);
router.post('/adjust', InventoryController.adjustStock);

// --- Procurement (PR/PO/GRN) ---
router.get('/procurement', ProcurementController.getProcurements);
router.get('/procurement/:id', ProcurementController.getProcurementById);
router.post('/procurement', ProcurementController.createProcurement);
router.patch('/procurement/:id/approve', ProcurementController.approveProcurement);
router.post('/procurement/:id/receive', ProcurementController.receiveGoods);

// --- Inter-branch Transfer ---
router.get('/transfer', TransferController.getTransfers);
router.post('/transfer/request', TransferController.requestTransfer);
router.patch('/transfer/:id/approve', TransferController.approveTransfer);
router.post('/transfer/:id/ship', TransferController.shipTransfer);
router.post('/transfer/:id/receive', TransferController.receiveTransfer);

export default router;
