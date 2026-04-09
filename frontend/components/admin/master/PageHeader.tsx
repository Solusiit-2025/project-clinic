'use client'

import { motion } from 'framer-motion'
import { FiPlus, FiChevronRight } from 'react-icons/fi'

interface PageHeaderProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  onAdd?: () => void
  addLabel?: string
  count?: number
  breadcrumb?: string[]
}

export default function PageHeader({
  title, subtitle, icon, onAdd, addLabel = 'Tambah Data', count, breadcrumb
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 sm:mb-7"
    >
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="flex items-center gap-1.5 mb-3 text-xs sm:text-sm text-gray-400 font-medium">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <FiChevronRight className="w-3 h-3 text-gray-300" />}
              <span className={i === breadcrumb.length - 1 ? 'text-primary font-semibold' : ''}>{crumb}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/10">
            <span className="text-primary">{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{title}</h1>
              {count !== undefined && (
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{addLabel}</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}
