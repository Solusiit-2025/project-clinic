import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5004'
const BASE_URL = API_URL.endsWith('/api/')
  ? API_URL
  : API_URL.endsWith('/api')
  ? `${API_URL}/`
  : `${API_URL}/api/`

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Always send HttpOnly cookies
})

// Track if a refresh is already in-flight to avoid parallel refresh calls
let isRefreshing = false
let refreshQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = []

function processQueue(error: any) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  refreshQueue = []
}

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Token is in HttpOnly cookie — browser sends it automatically
  // Only attach the active clinic context header
  const clinicId = typeof window !== 'undefined' ? localStorage.getItem('activeClinicId') : null
  if (clinicId) config.headers['x-clinic-id'] = clinicId
  return config
})

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const status = error.response?.status
    const code = error.response?.data?.code

    // ── Token expired → attempt silent refresh ────────────────────────────
    if (status === 401 && code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true // prevent infinite loop

      if (isRefreshing) {
        // Another request already triggered refresh — queue this one
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          })
        })
      }

      isRefreshing = true

      try {
        // Call refresh endpoint — sends refresh_token cookie automatically
        await axios.post(`${BASE_URL}auth/refresh`, {}, { withCredentials: true })

        // New access token cookie is now set — retry all queued requests
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError: any) {
        // Refresh token also expired or invalid → force logout
        processQueue(refreshError)
        forceLogout('Sesi Anda telah berakhir. Silakan login kembali.')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // ── Session fully invalid (not just expired) → force logout ──────────
    if (status === 401 && code !== 'TOKEN_EXPIRED') {
      forceLogout()
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

function forceLogout(message?: string) {
  if (typeof window === 'undefined') return

  // Clear non-sensitive local state
  localStorage.removeItem('activeClinicId')

  // Clear Zustand persisted state
  try {
    localStorage.removeItem('auth-storage')
  } catch {}

  // Show message if provided, then redirect
  if (message) {
    sessionStorage.setItem('logout_reason', message)
  }

  // Avoid redirect loop if already on login page, register page, or a public display page
  const path = window.location.pathname
  if (
    path !== '/' && 
    !path.startsWith('/login') && 
    !path.startsWith('/register') && 
    !path.startsWith('/display')
  ) {
    window.location.href = '/login'
  }
}

export default api
