'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Sidebar from '@/components/admin/Sidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'
import SessionGuard from '@/components/admin/SessionGuard'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, checkAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    initAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.push('/login')
    }
    // Redirect doctors to doctor dashboard
    if (!isChecking && isAuthenticated && user?.role === 'DOCTOR') {
      router.push('/doctor')
    }
  }, [isChecking, isAuthenticated, router, user])

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Memuat Dashboard...</p>
      </div>
    )
  }

  const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'FARMASI', 'ACCOUNTING', 'LOGISTIC', 'STAFF']
  if (!isAuthenticated || !staffRoles.includes(user?.role ?? '')) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminNavbar />
        <SessionGuard />
        
        <main className="p-4 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="px-8 py-5 border-t border-gray-100 bg-white text-gray-400 text-[10px] font-medium flex justify-between items-center">
          <p>&copy; 2026 {user?.name || 'Klinik Yasfina'}. Professional Medical Management System.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
