'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DoctorSidebar from '../../components/doctor/DoctorSidebar'
import DoctorNavbar from '../../components/doctor/DoctorNavbar'
import { motion, AnimatePresence } from 'framer-motion'

export default function DoctorLayout({
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
    // Redirect non-doctors to admin
    if (!isChecking && isAuthenticated && user?.role !== 'DOCTOR') {
      router.push('/admin')
    }
  }, [isChecking, isAuthenticated, router, user])

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DoctorSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <DoctorNavbar />
        
        <main className="p-1.5 flex-1 pt-16 lg:pt-4 sm:pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="px-10 py-8 border-t border-gray-100 bg-white text-gray-400 text-xs font-medium flex justify-between items-center">
          <p>&copy; 2026 Klinik Yasfina. Medical Management System.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Help</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
