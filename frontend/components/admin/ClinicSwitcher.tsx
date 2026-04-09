'use client'

import { FiHome, FiChevronDown } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ClinicSwitcher({ full = false }: { full?: boolean }) {
  const { user, activeClinicId, setActiveClinicId } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const clinics = user?.clinics || []
  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (clinics.length <= 1 && !activeClinic) return null

  return (
    <div className={`relative ${full ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100 group ${full ? 'w-full' : ''}`}
      >
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
          <FiHome className="w-4 h-4" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">Active Clinic</p>
          <p className="text-sm font-bold text-gray-900 leading-none truncate">{activeClinic?.name || 'Select Clinic'}</p>
        </div>
        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-50 ${full ? 'w-full' : 'w-64'}`}
          >
            <div className="p-2">
              <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Branch</p>
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    setActiveClinicId(clinic.id)
                    setIsOpen(false)
                    // Optional: window.location.reload() if needed to reset all states
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeClinicId === clinic.id 
                    ? 'bg-primary/5 text-primary' 
                    : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeClinicId === clinic.id ? 'bg-primary/10' : 'bg-gray-100'
                  }`}>
                    <FiHome className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">{clinic.name}</p>
                    <p className="text-[10px] opacity-60 font-medium">{clinic.code}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
