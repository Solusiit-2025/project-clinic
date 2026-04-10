import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'FARMASI' | 'ACCOUNTING' | 'LOGISTIC' | 'STAFF'

interface Clinic {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  email: string
  username: string
  name: string
  role: Role
  image?: string
  clinics?: Clinic[]
}

interface AuthState {
  user: User | null
  token: string | null
  activeClinicId: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, clinicId?: string) => void
  setActiveClinicId: (id: string) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeClinicId: null,
      isAuthenticated: false,

      setAuth: (user, token, clinicId) => {
        const activeId = clinicId || (user.clinics && user.clinics.length > 0 ? user.clinics[0].id : null)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
          if (activeId) localStorage.setItem('activeClinicId', activeId)
        }

        set({ user, token, isAuthenticated: true, activeClinicId: activeId })
      },

      setActiveClinicId: (id) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeClinicId', id)
        }
        set({ activeClinicId: id })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('activeClinicId')
        }
        set({ user: null, token: null, activeClinicId: null, isAuthenticated: false })
        window.location.href = '/login'
      },

      checkAuth: async () => {
        const { token, activeClinicId } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const response = await api.get('auth/me')
          const userData = response.data
          
          let currentActiveId = activeClinicId
          if (!currentActiveId && userData.clinics && userData.clinics.length > 0) {
            currentActiveId = userData.clinics[0].id
            if (typeof window !== 'undefined' && currentActiveId) {
              localStorage.setItem('activeClinicId', currentActiveId)
            }
          }

          set({ user: userData, activeClinicId: currentActiveId, isAuthenticated: true })
        } catch (error) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            localStorage.removeItem('activeClinicId')
          }
          set({ user: null, token: null, activeClinicId: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
