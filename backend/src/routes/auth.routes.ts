import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const authRoutes = Router()

// Public
authRoutes.post('/login', AuthController.login)

// Protected
authRoutes.get('/me', authMiddleware, AuthController.me)

export default authRoutes
