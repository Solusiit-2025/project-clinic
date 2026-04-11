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
    
    // Get base URL for files. Always target the 127.0.0.1 IPv4 to avoid Windows localhost issues.
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'
    const baseUrl = apiBase.split('/api')[0].replace(/\/$/, '')
    
    // Ensure path covers the full relativity
    if (path.startsWith('/uploads/')) {
       return `${baseUrl}${path}`
    }

    // Fallback for relative paths without leading slash
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
    <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40 shadow-sm shadow-gray-50/50">
      {/* Search & Clinic Label */}
      <div className="flex items-center gap-6">
        <div className="relative w-72 hidden xl:block">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search something..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
          />
        </div>

        {/* Dynamic Branch Name Badge with "Glowing" Effect */}
        {activeClinic && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-primary/10 rounded-2xl shadow-sm shadow-primary/5 animate-in fade-in slide-in-from-left-2 duration-700 group hover:border-primary/30 transition-all cursor-default">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary relative z-10" />
              <div className="absolute w-4 h-4 rounded-full bg-primary/30 animate-ping duration-[3000ms]" />
              <div className="absolute w-2 h-2 rounded-full bg-primary/40 animate-pulse duration-[2000ms]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Active Branch</span>
              <span className="text-sm font-extrabold text-primary tracking-tight">
                {activeClinic.name}
              </span>
              {activeClinic.address && (
                <span className="text-[10px] font-medium text-gray-400 truncate max-w-[150px]">
                  {activeClinic.address}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden">
        <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-primary">
          <FiMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-6">
        <button className="relative p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-500 hover:text-primary">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-10 w-px bg-gray-100 mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-xs font-semibold text-primary/60 group-hover:text-primary uppercase tracking-tighter transition-colors">
                {user?.role || 'Admin'}
              </p>
            </div>
            
            <div className="w-12 h-12 relative overflow-hidden rounded-2xl border-2 border-primary/5 group-hover:border-primary/20 transition-all shadow-inner bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              {user?.image ? (
                <img 
                  src={getImageUrl(user.image) || ''} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null; // prevent looping
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&bold=true`;
                  }}
                />
              ) : (
                <FiUser className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <FiChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-primary transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-gray-100 py-4 z-50 overflow-hidden"
              >
                {/* Header Profile Summary */}
                <div className="px-6 py-4 mb-2 bg-gray-50/50 border-b border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-extrabold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{user?.role}</p>
                </div>

                <div className="flex flex-col px-2">
                  <Link 
                    href="/admin/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FiUserCheck className="w-4 h-4" />
                    </div>
                    Profil Saya
                  </Link>
                  
                  <Link 
                    href="/admin/profile?tab=security"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FiLock className="w-4 h-4" />
                    </div>
                    Ganti Password
                  </Link>

                  <div className="h-px bg-gray-100 my-2 mx-4" />

                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false)
                      logout()
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors text-red-500">
                      <FiLogOut className="w-4 h-4" />
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
