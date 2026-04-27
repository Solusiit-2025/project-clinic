import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in environment variables!')
  process.exit(1)
}
const jwtSecret: string = JWT_SECRET

export async function authMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    // 1. HttpOnly cookie (preferred)
    let token = req.cookies?.auth_token

    // 2. Fallback: Authorization header (API clients / mobile)
    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]
      }
    }

    if (!token) {
      return res.status(401).json({
        message: 'Akses ditolak. Silakan login terlebih dahulu.',
        code: 'NO_TOKEN',
      })
    }

    // Verify — throws TokenExpiredError or JsonWebTokenError
    const decoded = jwt.verify(token, jwtSecret) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        doctor: true,
        clinics: { include: { clinic: true } },
      },
    })

    if (!user || !user.isActive) {
      res.clearCookie('auth_token', { path: '/' })
      return res.status(401).json({
        message: 'Sesi tidak valid atau akun dinonaktifkan.',
        code: 'INVALID_SESSION',
      })
    }

    const { password: _, doctor, clinics: userClinics, ...userWithoutPassword } = user as any
    const clinics = userClinics.map((uc: any) => uc.clinic)

    req.user = {
      ...userWithoutPassword,
      image: userWithoutPassword.image || doctor?.profilePicture || null,
      clinics,
      doctor,
    }

    // Resolve active clinic from x-clinic-id header
    const requestedClinicId = req.headers['x-clinic-id']
    const assignedClinicIds = clinics.map((c: any) => c.id)

    if (requestedClinicId && assignedClinicIds.includes(String(requestedClinicId))) {
      req.clinicId = String(requestedClinicId)
    } else {
      req.clinicId = clinics[0]?.id || null
    }

    // Global admin view
    let isAdminView = user.role === 'SUPER_ADMIN'
    if (!isAdminView && user.role === 'ADMIN' && req.clinicId) {
      const activeClinic = clinics.find((c: any) => c.id === req.clinicId)
      if (activeClinic?.isMain) isAdminView = true
    }
    req.isAdminView = isAdminView

    next()
  } catch (error: any) {
    // Always clear the bad access token cookie
    res.clearCookie('auth_token', { path: '/' })

    if (error.name === 'TokenExpiredError') {
      // Signal frontend to attempt silent refresh
      return res.status(401).json({
        message: 'Token kadaluarsa.',
        code: 'TOKEN_EXPIRED',
      })
    }

    // Invalid signature or malformed token
    res.clearCookie('refresh_token', { path: '/api/auth' })
    return res.status(401).json({
      message: 'Sesi tidak valid. Silakan login kembali.',
      code: 'INVALID_TOKEN',
    })
  }
}

export function roleMiddleware(roles: Role[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses terbatas. Anda tidak memiliki izin.' })
    }
    next()
  }
}
