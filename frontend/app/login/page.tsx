'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiHome, FiChevronRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'

type Step = 'login' | 'select-clinic'

export default function LoginPage() {
  // Login states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Selection states
  const [step, setStep] = useState<Step>('login')
  const [userData, setUserData] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      })

      const { user, token: authToken } = response.data
      
      if (!user.clinics || user.clinics.length === 0) {
        throw new Error('Akun Anda tidak memiliki akses ke cabang manapun. Silakan hubungi Administrator.')
      }

      if (user.clinics.length > 1) {
        setUserData(user)
        setToken(authToken)
        setStep('select-clinic')
      } else {
        // Direct login
        handleFinalLogin(user, authToken, user.clinics[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal login. Periksa kembali email dan password Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalLogin = (user: any, authToken: string, clinicId: string) => {
    setAuth(user, authToken, clinicId)
    
    // Redirect based on role
    const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'FARMASI', 'ACCOUNTING', 'LOGISTIC', 'STAFF']
    if (staffRoles.includes(user.role)) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-secondary/10 to-transparent rounded-full blur-3xl -z-10"></div>

      {/* Back button */}
      <button
        onClick={() => step === 'login' ? router.push('/') : setStep('login')}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">{step === 'login' ? 'Kembali' : 'Kembali ke Login'}</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {step === 'login' ? (
            <motion.div
              key="login-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-white"
            >
              {/* Logo */}
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
                <p className="text-gray-500 font-medium tracking-tight">Masuk ke pengelolaan Klinik Yasfina</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs font-semibold">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary transition-all font-medium text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary transition-all font-medium text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-lg border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-gray-500 font-bold group-hover:text-gray-800 transition-colors">Ingat saya</span>
                  </label>
                  <Link href="/forgot-password" title="Lupa password?" className="font-bold text-primary hover:text-blue-700 transition-colors">Lupa password?</Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : 'Masuk ke Dashboard'}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">atau</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                {['Google', 'Microsoft'].map(brand => (
                  <button key={brand} className="py-3 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">{brand}</button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="clinic-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-white"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <FiHome className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Pilih Cabang</h1>
                <p className="text-gray-500 font-medium text-sm px-4">Pilih cabang klinik yang ingin Anda akses sekarang.</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {userData?.clinics.map((clinic: any) => (
                  <button
                    key={clinic.id}
                    onClick={() => handleFinalLogin(userData, token!, clinic.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-50 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <FiHome className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{clinic.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{clinic.code}</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('login')}
                className="w-full mt-8 py-3 text-sm font-bold text-gray-400 hover:text-primary transition-colors"
              >
                Ganti Akun? Login kembali
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-10">
          Powered by Klinik Yasfina &copy; 2026
        </p>
      </motion.div>
    </div>
  )
}
