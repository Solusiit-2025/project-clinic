'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSearch, FiBell, FiUser, FiChevronDown, FiMenu, FiLogOut, FiLock, FiUserCheck } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ClinicSwitcher from './ClinicSwitcher'

export default function AdminNavbar() {
  const user = useAuthStore(state => state.user)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const logout = useAuthStore(state => state.logout)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const clinics = user?.clinics || []
  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0]

  const getImageUrl = (path?: string) => {
    if (!path || path === "null" || path === "undefined") return null
    if (path.startsWith('http')) return path
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5004'
    const baseUrl = apiBase.split('/api')[0].replace(/\/$/, '')
    if (path.startsWith('/uploads/')) return `${baseUrl}${path}`
    const cleanPath = path.replace(/^\//, '')
    return `${baseUrl}/uploads/${cleanPath}`
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-12 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      {/* Left: Search & Active Branch */}
      <div className="flex items-center gap-4">
        <div className="relative hidden xl:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className="w-48 pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all text-[10px] font-medium text-gray-700 placeholder:text-gray-400"
          />
        </div>

        {activeClinic && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg cursor-default hover:border-primary/25 transition-all">
            <div className="relative flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-500 relative z-10" />
            </div>
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cabang:</span>
              <span className="text-[10px] font-extrabold text-primary tracking-tight">{activeClinic.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <button className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-primary">
          <FiMenu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-primary">
          <FiBell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="h-5 w-px bg-gray-100" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-7 h-7 relative overflow-hidden rounded-lg border border-primary/10 group-hover:border-primary/30 transition-all bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-sm">
              {user?.image ? (
                <img
                  src={getImageUrl(user.image) || ''}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.onerror = null
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&bold=true`
                  }}
                />
              ) : (
                <FiUser className="w-3 h-3 text-primary" />
              )}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-black text-gray-900 group-hover:text-primary transition-colors leading-none uppercase">
                {user?.name?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-[8px] font-bold text-gray-400 tracking-widest mt-0.5">
                {user?.role || 'SYSTEM'}
              </p>
            </div>

            <FiChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-primary transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl shadow-primary/10 border border-gray-100 py-3 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 mb-1 bg-gray-50/60 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Masuk sebagai</p>
                  <p className="text-sm font-extrabold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{user?.role}</p>
                </div>

                <div className="flex flex-col px-2">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FiUserCheck className="w-3.5 h-3.5" />
                    </div>
                    Profil Saya
                  </Link>

                  <Link
                    href="/admin/profile?tab=security"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FiLock className="w-3.5 h-3.5" />
                    </div>
                    Ganti Password
                  </Link>

                  <div className="h-px bg-gray-100 my-1.5 mx-3" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      logout()
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors text-red-500">
                      <FiLogOut className="w-3.5 h-3.5" />
                    </div>
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
