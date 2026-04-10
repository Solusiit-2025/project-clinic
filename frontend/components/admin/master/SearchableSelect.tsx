
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiChevronDown, FiPlusCircle, FiX } from 'react-icons/fi'

interface Option {
  id: string
  label: string
  code?: string
  description?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (id: string, option?: Option) => void
  placeholder?: string
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Cari atau pilih...',
  label,
  helperText,
  required,
  disabled
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = useMemo(() => options.find(o => o.id === value), [options, value])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const s = search.toLowerCase()
    return options.filter(o => 
      o.label.toLowerCase().includes(s) || 
      (o.code && o.code.toLowerCase().includes(s))
    )
  }, [options, search])

  const handleSelect = (option: Option) => {
    onChange(option.id, option)
    setIsOpen(false)
    setSearch('')
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', undefined)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5 ml-1">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative group">
        {/* Trigger / Input Display */}
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full flex items-center gap-3 px-5 py-3.5 rounded-3xl border-2 transition-all cursor-pointer bg-white
            ${isOpen ? 'border-primary ring-4 ring-primary/5' : 'border-blue-100 hover:border-primary/30'}
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'shadow-sm hover:shadow-md'}
          `}
        >
          <FiSearch className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-blue-300'}`} />
          
          <div className="flex-1 overflow-hidden">
            {isOpen ? (
              <input
                autoFocus
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-2 truncate">
                {selectedOption ? (
                  <>
                    {selectedOption.code && (
                      <span className="text-[10px] font-black bg-blue-50 text-primary px-2 py-0.5 rounded-md">
                        {selectedOption.code}
                      </span>
                    )}
                    <span className="text-sm font-black text-gray-700 uppercase tracking-tight truncate">
                      {selectedOption.label}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-gray-300 italic">{placeholder}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedOption && !disabled && (
              <button 
                onClick={clearSelection}
                className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-all"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <FiChevronDown className={`w-5 h-5 text-blue-200 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 right-0 top-full mt-3 z-[100] bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden backdrop-blur-xl"
            >
              <div className="max-h-[350px] overflow-y-auto p-3 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleSelect(option)}
                        className={`
                          flex flex-col gap-1 p-4 rounded-2xl cursor-pointer transition-all
                          ${value === option.id 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[0.98]' 
                            : 'hover:bg-blue-50/70 text-gray-700 hover:scale-[1.01] active:scale-[0.98]'}
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-[13px] font-black uppercase tracking-tight ${value === option.id ? 'text-white' : 'text-gray-900'}`}>
                            {option.label}
                          </span>
                          {option.code && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${value === option.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {option.code}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className={`text-[10px] font-medium italic line-clamp-1 ${value === option.id ? 'text-white/70' : 'text-gray-400'}`}>
                            {option.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-200">
                      <FiSearch className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-700">Produk Tidak Ditemukan</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Coba kata kunci lain</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50/50 border-t border-blue-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">
                  Found {filteredOptions.length} Items
                </span>
                <p className="text-[9px] font-bold text-blue-400 italic">
                  Daftarkan master baru jika data belum ada
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {helperText && (
        <p className="text-[10px] text-blue-400 font-bold italic px-2 mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
}
