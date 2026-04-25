import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Access token cookie — short-lived (15 min), HttpOnly
const accessCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
}

// Refresh token cookie — long-lived (7 days), HttpOnly, restricted path
const refreshCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // Only sent to /api/auth/* — not every request
}

const clearCookieOptions = { path: '/' }
const clearRefreshCookieOptions = { path: '/api/auth' }

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi' })
      }

      const result = await AuthService.login(email, password)

      // Set both tokens as HttpOnly cookies — never exposed to JavaScript
      res.cookie('auth_token', result.accessToken, accessCookieOptions)
      res.cookie('refresh_token', result.refreshToken, refreshCookieOptions)

      // Return user data only — no tokens in response body
      res.status(200).json({ user: result.user })
    } catch (error) {
      res.status(401).json({ message: (error as Error).message })
    }
  }

  // Called automatically by frontend when access token expires (401)
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token
      if (!refreshToken) {
        return res.status(401).json({ message: 'Sesi berakhir. Silakan login kembali.', code: 'REFRESH_MISSING' })
      }

      const result = await AuthService.refreshAccessToken(refreshToken)

      // Issue new access token cookie
      res.cookie('auth_token', result.accessToken, accessCookieOptions)

      res.status(200).json({ message: 'Token diperbarui' })
    } catch (error) {
      // Refresh token invalid/expired — force full logout
      res.clearCookie('auth_token', clearCookieOptions)
      res.clearCookie('refresh_token', clearRefreshCookieOptions)
      res.status(401).json({ message: 'Sesi berakhir. Silakan login kembali.', code: 'SESSION_EXPIRED' })
    }
  }

  // Explicit logout — clears BOTH cookies server-side
  static async logout(_req: Request, res: Response) {
    res.clearCookie('auth_token', clearCookieOptions)
    res.clearCookie('refresh_token', clearRefreshCookieOptions)
    res.status(200).json({ message: 'Logout berhasil' })
  }

  static async me(req: any, res: Response) {
    try {
      res.status(200).json(req.user)
    } catch (error) {
      res.status(401).json({ message: (error as Error).message })
    }
  }
}
