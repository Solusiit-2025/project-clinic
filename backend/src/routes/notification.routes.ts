import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const notificationRoutes = Router()

notificationRoutes.use((req, res, next) => authMiddleware(req, res, next))

notificationRoutes.get('/', getNotifications)
notificationRoutes.put('/read-all', markAllAsRead)
notificationRoutes.put('/:id/read', markAsRead)

export default notificationRoutes
