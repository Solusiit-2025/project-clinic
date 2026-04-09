import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'clinic-secret-key-2026'

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true
      }
    })

    if (!user) {
      throw new Error('User tidak ditemukan')
    }

    if (!user.isActive) {
      throw new Error('Akun Anda dinonaktifkan')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Password salah')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const userClinics = await prisma.userClinic.findMany({
      where: { userId: user.id },
      include: { clinic: true },
    })

    const clinics = userClinics.map((uc) => uc.clinic)

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, clinics: clinics.map(c => c.id) },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    const { password: _, doctor, ...userWithoutPassword } = user as any
    const profileImage = userWithoutPassword.image || doctor?.profilePicture || null

    return { 
      user: {
        ...userWithoutPassword,
        image: profileImage,
        clinics
      }, 
      token 
    }
  }

  static async verifyToken(token: string) {
    try {
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
        throw new Error('Sesi tidak valid')
      }

      const { password: _, doctor, clinics: userClinics, ...userWithoutPassword } = user as any
      const profileImage = userWithoutPassword.image || doctor?.profilePicture || null
      
      // Map clinics to flat array
      const clinics = userClinics.map((uc: any) => uc.clinic)

      return {
        ...userWithoutPassword,
        image: profileImage,
        clinics
      }
    } catch (error) {
      throw new Error('Token tidak valid')
    }
  }
}
