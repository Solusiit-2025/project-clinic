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
      className="mb-8"
    >
      {/* Breadcrumb ... (rest of the logic) */}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 ring-4 ring-gray-50">
            <span className="text-primary text-xl">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{title}</h1>
              {count !== undefined && (
                <span className="text-xs font-black bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10">
                  {count} Data
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {children}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex-shrink-0 flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-xl shadow-gray-200 transition-all hover:-translate-y-0.5"
            >
              <FiPlus className="w-4 h-4" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
