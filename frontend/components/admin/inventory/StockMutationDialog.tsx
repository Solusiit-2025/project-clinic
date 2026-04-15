'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, History, ArrowUpRight, ArrowDownRight, 
  Search, Calendar, User, FileText, Package,
  TrendingDown, TrendingUp, AlertCircle
} from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Mutation {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN'
  quantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  userId: string
  createdAt: string
  product: {
    productName: string
    productCode: string
  }
  batch: {
    batchNumber: string
  } | null
}

interface StockMutationDialogProps {
  isOpen: boolean
  onClose: () => void
  stock: any | null
}

export default function StockMutationDialog({ isOpen, onClose, stock }: StockMutationDialogProps) {
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen && stock) {
      fetchMutations()
    }
  }, [isOpen, stock])

  const fetchMutations = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/inventory/mutations', {
        params: { 
          branchId: stock.branchId,
          productId: stock.productId
        }
      })
      setMutations(res.data)
    } catch (error) {
      console.error('Failed to fetch mutations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMutations = mutations.filter(m => 
    m.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'IN': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', icon: TrendingUp }
      case 'OUT': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: TrendingDown }
      case 'ADJUSTMENT': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: AlertCircle }
      default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: History }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Riwayat Mutasi Stok</h3>
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {stock?.product?.productName}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 uppercase tracking-tighter">
                  {stock?.product?.productCode}
                </span>
                {stock?.batch && (
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 uppercase tracking-tighter">
                    Batch: {stock?.batch?.batchNumber}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari referensi, catatan, atau tipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-gray-700"
              />
            </div>

            {isLoading ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded-md w-1/4" />
                      <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMutations.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                  <Package className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tidak Ada Mutasi</p>
                <p className="text-gray-300 text-[10px] mt-1 italic">Belum ada riwayat pergerakan stok untuk produk ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredMutations.map((mutation, idx) => {
                  const style = getTypeStyle(mutation.type)
                  const Icon = style.icon
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={mutation.id}
                      className="group relative flex gap-4"
                    >
                      {/* Timeline line */}
                      {idx !== filteredMutations.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-100 group-hover:bg-primary/20 transition-colors" />
                      )}

                      <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center shrink-0 shadow-sm z-10`}>
                        <Icon className={`w-5 h-5 ${style.text}`} />
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-black uppercase tracking-tight ${style.text}`}>
                            {mutation.type === 'IN' ? 'Stok Masuk' : mutation.type === 'OUT' ? 'Stok Keluar' : mutation.type}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(mutation.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </span>
                        </div>

                        <div className="bg-white border border-gray-100 group-hover:border-primary/20 rounded-2xl p-4 transition-all shadow-sm group-hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              {mutation.notes && (
                                <p className="text-xs font-bold text-gray-700 leading-relaxed italic">
                                  "{mutation.notes}"
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 pt-1">
                                {mutation.referenceType && (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                                    <FileText className="w-3 h-3 text-gray-300" />
                                    {mutation.referenceType}: {mutation.referenceId?.slice(0, 8)}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-transparent group-hover:border-gray-100">
                                  <User className="w-3 h-3 text-gray-300" />
                                  ID: {mutation.userId.slice(0, 8)}
                                </span>
                              </div>
                            </div>

                            <div className="pl-4 border-l border-gray-50 text-right shrink-0">
                              <p className={`text-xl font-black ${mutation.type === 'IN' ? 'text-green-600' : mutation.type === 'OUT' ? 'text-red-600' : 'text-primary'}`}>
                                {mutation.type === 'IN' ? '+' : ''}{mutation.quantity}
                              </p>
                              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Unit</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <span>Total {filteredMutations.length} Transaksi Terdaftar</span>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Stok Masuk</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Stok Keluar</span>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
