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
    if (!isChecking && isAuthenticated && user?.role === 'DOCTOR') {
      router.push('/doctor')
    }
  }, [isChecking, isAuthenticated, router, user])

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div
          className="w-16 h-16 rounded-full animate-spin"
          style={{
            border: '4px solid var(--border)',
            borderTopColor: '#0ea5e9',
          }}
        />
        <p className="mt-4 font-bold animate-pulse uppercase tracking-widest text-xs" style={{ color: 'var(--text-faint)' }}>
          Memuat Dashboard...
        </p>
      </div>
    )
  }

  const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'FARMASI', 'ACCOUNTING', 'LOGISTIC', 'STAFF']
  if (!isAuthenticated || !staffRoles.includes(user?.role ?? '')) {
    return null
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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

        <footer
          className="px-8 py-5 border-t text-[10px] font-medium flex justify-between items-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-faint)',
          }}
        >
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
