'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useEffect, useRef } from 'react'

interface MasterModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  closeOnOverlayClick?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
  '6xl': 'max-w-[80rem]',
  '7xl': 'max-w-[90rem]',
  'full': 'max-w-[98vw]'
}

export default function MasterModal({
  isOpen, onClose, title, subtitle, children, size = 'md', closeOnOverlayClick = false
}: MasterModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (closeOnOverlayClick && e.target === overlayRef.current) onClose()
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            if (closeOnOverlayClick) onClose()
          }} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className={`relative z-10 w-full ${sizeClasses[size]} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{title}</h2>
                {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all flex-shrink-0"
              >
                <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
