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
  children?: React.ReactNode
}

export default function PageHeader({
  title, subtitle, icon, onAdd, addLabel = 'Tambah Data', count, breadcrumb, children
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] sm:text-[11px] text-gray-400 font-medium uppercase tracking-wider">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <FiChevronRight className="w-2.5 h-2.5 text-gray-300" />}
              <span className={i === breadcrumb.length - 1 ? 'text-primary font-black' : ''}>{crumb}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
            <span className="text-primary text-base sm:text-lg">{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-tight uppercase truncate">{title}</h1>
              {count !== undefined && (
                <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest flex-shrink-0">
                  {count}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
            >
              <FiPlus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
