import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token and clinic id from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const clinicId = typeof window !== 'undefined' ? localStorage.getItem('activeClinicId') : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (clinicId) {
      config.headers['x-clinic-id'] = clinicId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
