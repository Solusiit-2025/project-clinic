import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'clinic-secret-key-2026'

export async function authMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Akses ditolak, token tidak valid' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        doctor: true,
        clinics: {
          include: { clinic: true }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User tidak ditemukan atau tidak aktif' })
    }

    const { password: _, doctor, clinics: userClinics, ...userWithoutPassword } = user as any
    const profileImage = userWithoutPassword.image || doctor?.profilePicture || null
    
    // Map clinics to flat array
    const clinics = userClinics.map((uc: any) => uc.clinic)

    req.user = {
      ...userWithoutPassword,
      image: profileImage,
      clinics,
      doctor // Include doctor profile if exists
    }

    // Multi-clinic support: Extract clinicId from header
    const requestedClinicId = req.headers['x-clinic-id']
    
    // Get user's clinics to verify access
    const assignedClinicIds = clinics.map((c: any) => c.id)

    console.log('[Auth] Processing request for clinic:', requestedClinicId, 'Assigned IDs:', assignedClinicIds)

    if (requestedClinicId && assignedClinicIds.includes(String(requestedClinicId))) {
      req.clinicId = String(requestedClinicId)
    } else if (clinics.length > 0) {
      // Default to first assigned clinic if none requested or invalid requested
      req.clinicId = clinics[0].id
      console.log('[Auth] Fallback clinic used:', req.clinicId)
    } else {
      // If no clinic assigned (should not happen if seeded), set null or handle error
      req.clinicId = null
    }

    // Determine if user has "Global Admin View" (Pusat)
    // 1. SUPER_ADMIN is always global
    // 2. ADMIN in a clinic marked as isMain is also global
    let isAdminView = user.role === 'SUPER_ADMIN'
    if (!isAdminView && user.role === 'ADMIN' && req.clinicId) {
       const activeClinic = clinics.find((c: any) => c.id === req.clinicId)
       if (activeClinic?.isMain) {
         isAdminView = true
       }
    }
    req.isAdminView = isAdminView

    next()
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' })
  }
}

export function roleMiddleware(roles: Role[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses terbatas, Anda tidak memiliki izin' })
    }
    next()
  }
}
