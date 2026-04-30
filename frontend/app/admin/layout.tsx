'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Sidebar from '@/components/admin/Sidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'
import SessionGuard from '@/components/admin/SessionGuard'
import MobileBottomNav from '@/components/admin/MobileBottomNav'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, checkAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    initAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isChecking && !isAuthenticated) router.push('/login')
    if (!isChecking && isAuthenticated && user?.role === 'DOCTOR') router.push('/doctor')
  }, [isChecking, isAuthenticated, router, user])

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: '#0ea5e9' }} />
        <p className="mt-4 font-bold animate-pulse uppercase tracking-widest text-xs" style={{ color: 'var(--text-faint)' }}>
          Memuat Dashboard...
        </p>
      </div>
    )
  }

  const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'FARMASI', 'ACCOUNTING', 'LOGISTIC', 'STAFF']
  if (!isAuthenticated || !staffRoles.includes(user?.role ?? '')) return null

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar — handles its own mobile drawer internally, but we pass open state */}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full relative">
        <AdminNavbar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <SessionGuard />

        <main className="flex-1 w-full p-2 sm:p-3 md:p-4 lg:p-6 pb-24 md:pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer — hidden on mobile (bottom nav takes its place) */}
        <footer
          className="hidden lg:flex px-6 py-4 border-t text-[10px] font-medium justify-between items-center"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-faint)' }}
        >
          <p>&copy; 2026 {user?.name || 'Klinik Yasfina'}. Professional Medical Management System.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Docs</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuOpen={() => setMobileMenuOpen(true)} />
    </div>
  )
}
