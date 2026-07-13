import { Router } from 'express'
import { createPO, getPOs, receiveGoods, payInstallment, deletePO, updatePO } from '../controllers/finance/assetProcurement.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const assetProcurementRoutes = Router()

assetProcurementRoutes.use(authMiddleware)

assetProcurementRoutes.post('/', createPO)
assetProcurementRoutes.get('/', getPOs)
assetProcurementRoutes.post('/:id/receive', receiveGoods)
assetProcurementRoutes.post('/schedules/:id/pay', payInstallment)
assetProcurementRoutes.delete('/:id', deletePO)
assetProcurementRoutes.put('/:id', updatePO)

export default assetProcurementRoutes
