import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeClinicId: null,
      isAuthenticated: false,

      setAuth: (user, token, clinicId) => {
        const activeClinicId = clinicId || (user.clinics && user.clinics.length > 0 ? user.clinics[0].id : null)
        
        set({ user, token, isAuthenticated: true, activeClinicId })
        
        // Set axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        if (activeClinicId) {
          axios.defaults.headers.common['x-clinic-id'] = activeClinicId
        }
      },

      setActiveClinicId: (id) => {
        set({ activeClinicId: id })
        axios.defaults.headers.common['x-clinic-id'] = id
      },

      logout: () => {
        set({ user: null, token: null, activeClinicId: null, isAuthenticated: false })
        delete axios.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['x-clinic-id']
        window.location.href = '/login'
      },

      checkAuth: async () => {
        const { token, activeClinicId } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          if (activeClinicId) {
            axios.defaults.headers.common['x-clinic-id'] = activeClinicId
          }
          
          const response = await axios.get(`${API_URL}/auth/me`)
          const userData = response.data
          
          // Fix: Auto-set activeClinicId if null but clinics exist
          let currentActiveId = activeClinicId
          if (!currentActiveId && userData.clinics && userData.clinics.length > 0) {
            currentActiveId = userData.clinics[0].id
            axios.defaults.headers.common['x-clinic-id'] = currentActiveId
          }

          set({ user: userData, activeClinicId: currentActiveId, isAuthenticated: true })
        } catch (error) {
          set({ user: null, token: null, activeClinicId: null, isAuthenticated: false })
          delete axios.defaults.headers.common['Authorization']
          delete axios.defaults.headers.common['x-clinic-id']
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
