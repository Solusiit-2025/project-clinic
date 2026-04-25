import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { loginLimiter } from '../middleware/rateLimiter'

const authRoutes = Router()

// Public — rate limited to prevent brute force
authRoutes.post('/login', loginLimiter, AuthController.login)

// Silent token refresh — called automatically when access token expires
authRoutes.post('/refresh', AuthController.refresh)

// Logout — clears BOTH HttpOnly cookies server-side
authRoutes.post('/logout', AuthController.logout)

// Protected — verify session
authRoutes.get('/me', authMiddleware, AuthController.me)

export default authRoutes
