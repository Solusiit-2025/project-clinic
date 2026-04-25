'use client'

import { motion } from 'framer-motion'
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiLoader, FiInbox, FiEye, FiCopy } from 'react-icons/fi'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
  mobileHide?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchValue?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onDuplicate?: (row: T) => void
  extraFilters?: React.ReactNode
  keyField?: string
  emptyText?: string
  groupBy?: (row: T) => string
  // Pagination Props
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

function GroupHeader({ label, count, colSpan }: { label: string, count: number, colSpan: number }) {
  // Smooth & Clear color mapping based on label
  const getColor = (text: string) => {
    const l = text.toLowerCase()
    if (l.includes('tablet')) return { bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-100', accent: 'bg-blue-500' }
    if (l.includes('capsule')) return { bg: 'bg-indigo-50/80', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' }
    if (l.includes('syrup')) return { bg: 'bg-amber-50/80', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' }
    if (l.includes('injection')) return { bg: 'bg-rose-50/80', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' }
    if (l.includes('cream') || l.includes('ointment')) return { bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-100', accent: 'bg-emerald-500' }
    if (l.includes('liquid') || l.includes('solution')) return { bg: 'bg-cyan-50/80', text: 'text-cyan-700', border: 'border-cyan-100', accent: 'bg-cyan-500' }
    if (l.includes('medic') || l.includes('perawat')) return { bg: 'bg-purple-50/80', text: 'text-purple-700', border: 'border-purple-100', accent: 'bg-purple-500' }
    return { bg: 'bg-gray-50/80', text: 'text-gray-700', border: 'border-gray-200', accent: 'bg-gray-400' }
  }

  const color = getColor(label)

  return (
    <tr className={`${color.bg} border-y ${color.border} transition-colors`}>
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl shadow-sm">
            <div className={`w-1 h-3.5 ${color.accent} rounded-full`} />
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Grup:</span>
            <span className={`text-xs font-black ${color.text} uppercase tracking-tight`}>{label}</span>
            <div className="h-3 w-px bg-gray-200 mx-0.5" />
            <span className={`text-[10px] font-bold ${color.text} ${color.bg} px-2 py-0.5 rounded-lg`}>{count}</span>
          </div>
        </div>
      </td>
    </tr>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </td>
    </tr>
  )
}

export default function DataTable<T extends Record<string, any>>({
  data, columns, loading = false,
  searchValue, onSearchChange,
  searchPlaceholder = 'Cari data...',
  onView, onEdit, onDelete, onDuplicate,
  extraFilters, keyField = 'id',
  emptyText = 'Belum ada data. Klik Tambah untuk memulai.',
  groupBy,
  page = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filter Bar */}
      {(onSearchChange || extraFilters) && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60">
          {onSearchChange && (
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-100 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300"
              />
            </div>
          )}
          {extraFilters && (
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <FiFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter:</span>
              </div>
              {extraFilters}
            </div>
          )}
        </div>
      )}

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {(onView || onEdit || onDuplicate || onDelete) && (
                <th className="px-3 py-2 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest w-20">OPSI</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <FiInbox className="w-12 h-12 text-gray-200" />
                        <p className="text-sm font-medium">{emptyText}</p>
                      </div>
                    </td>
                  </tr>
                )
                : (() => {
                  let lastGroup = ''
                  
                  // Defensive check to ensure data is an array
                  const safeData = Array.isArray(data) ? data : []

                  // Sort data by group key if grouping is active
                  const sortedData = groupBy 
                    ? [...safeData].sort((a, b) => groupBy(a).localeCompare(groupBy(b)))
                    : safeData

                  const groupCounts = groupBy ? sortedData.reduce((acc, row) => {
                    const g = groupBy(row)
                    acc[g] = (acc[g] || 0) + 1
                    return acc
                  }, {} as Record<string, number>) : {}
                  
                  return sortedData.map((row, i) => {
                    const elements = []
                    const currentGroup = groupBy ? groupBy(row) : ''
                    
                    if (groupBy && currentGroup !== lastGroup) {
                      elements.push(
                        <GroupHeader 
                          key={`group-${currentGroup}`} 
                          label={currentGroup} 
                          count={groupCounts[currentGroup]} 
                          colSpan={columns.length + 1} 
                        />
                      )
                      lastGroup = currentGroup
                    }
                    
                    elements.push(
                      <motion.tr
                        key={row[keyField] || i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-gray-50 hover:bg-primary/[0.02] transition-colors group"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 py-1.5 text-gray-900 font-bold ${col.className || ''}`}
                          >
                            {col.render ? col.render(row) : (row[col.key] ?? <span className="text-gray-200">—</span>)}
                          </td>
                        ))}
                        {(onView || onEdit || onDuplicate || onDelete) && (
                          <td className="px-3 py-1.5">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onDuplicate && (
                                <button
                                  onClick={() => onDuplicate(row)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
                                  title="Salin/Duplikat"
                                >
                                  <FiCopy className="w-3 h-3" />
                                </button>
                              )}
                              {onView && (
                                <button
                                  onClick={() => onView(row)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
                                  title="Lihat Profil"
                                >
                                  <FiEye className="w-3 h-3" />
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(row)}
                                  className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-all"
                                  title="Edit"
                                >
                                  <FiEdit2 className="w-3 h-3" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(row)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all"
                                  title="Hapus"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    )
                    return elements
                  })
                })()
            }
          </tbody>
        </table>
      </div>

      {/* Card List — mobile */}
      <div className="md:hidden divide-y divide-gray-50">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ))
          : data.length === 0
            ? (
              <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                <FiInbox className="w-10 h-10 text-gray-200" />
                <p className="text-sm font-medium text-center px-6">{emptyText}</p>
              </div>
            )
            : (() => {
                let lastGroup = ''
                
                // Defensive check to ensure data is an array
                const safeData = Array.isArray(data) ? data : []

                // Sort data by group key if grouping is active
                const sortedData = groupBy 
                  ? [...safeData].sort((a, b) => groupBy(a).localeCompare(groupBy(b)))
                  : safeData

                return sortedData.map((row, i) => {
                  const elements = []
                  const currentGroup = groupBy ? groupBy(row) : ''
                  
                  if (groupBy && currentGroup !== lastGroup) {
                    elements.push(
                      <div key={`mobile-group-${currentGroup}`} className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{currentGroup}</span>
                      </div>
                    )
                    lastGroup = currentGroup
                  }

                  elements.push(
                    <motion.div
                      key={row[keyField] || i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {columns.filter(c => !c.mobileHide).map((col) => (
                            <div key={col.key} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-400 font-medium min-w-[80px] flex-shrink-0">{col.label}</span>
                              <span className="text-gray-700 font-semibold truncate max-w-[180px]">
                                {col.render ? col.render(row) : (row[col.key] ?? <span className="text-gray-300">—</span>)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {(onView || onEdit || onDuplicate || onDelete) && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            {onDuplicate && (
                              <button
                                onClick={() => onDuplicate(row)}
                                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
                              >
                                <FiCopy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onView && (
                              <button
                                onClick={() => onView(row)}
                                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-2 rounded-xl bg-primary/8 hover:bg-primary/15 text-primary transition-all"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                  return elements
                })
              })()
        }
      </div>

      {/* Footer & Pagination */}
      {!loading && (data.length > 0 || page > 1) && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Menampilkan <span className="text-gray-900">{data.length}</span> data 
            {totalPages > 1 && <> — Halaman <span className="text-primary">{page}</span> dari {totalPages}</>}
          </p>
          
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-tighter"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1
                  // Show current, first, last, and neighbors
                  if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                    return (
                      <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                          page === p 
                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                            : 'bg-white border border-gray-200 text-gray-400 hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  }
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="text-gray-300 px-1">...</span>
                  }
                  return null
                }).filter(Boolean)}
              </div>

              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-tighter"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
