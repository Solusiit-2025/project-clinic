'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardList, Search, RefreshCw, FileText, 
  ArrowUpCircle, ArrowDownCircle, Settings, Truck, ShoppingCart,
  ChevronLeft, ChevronRight, Filter, Download
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

interface Mutation {
  id: string
  productId: string
  batchId: string | null
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
  quantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdAt: string
  unitCost: number
  sellingPrice: number
  product: { productName: string; productCode: string }
  batch: { batchNumber: string; purchasePrice: number } | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function StockMutationPage() {
  const { activeClinicId, user } = useAuthStore()
  const hidePrices = !['SUPER_ADMIN', 'ADMIN', 'ACCOUNTING'].includes(user?.role as string)
  
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [page, setPage] = useState(1)
  const limit = 15

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchMutations = useCallback(async () => {
    try {
      if (!activeClinicId) return
      setIsLoading(true)
      const res = await api.get('/inventory/mutations', {
        params: { 
          branchId: activeClinicId,
          search: debouncedSearch || undefined,
          startDate: dateFilter.start || undefined,
          endDate: dateFilter.end || undefined,
          page,
          limit
        }
      })
      
      if (res.data.data) {
        setMutations(res.data.data)
        setMeta(res.data.meta)
      } else {
        setMutations(res.data) // fallback if not paginated
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat riwayat mutasi')
    } finally {
      setIsLoading(false)
    }
  }, [activeClinicId, debouncedSearch, dateFilter, page, limit])

  useEffect(() => {
    fetchMutations()
  }, [fetchMutations])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowUpCircle className="w-5 h-5 text-green-500" />
      case 'OUT': return <ArrowDownCircle className="w-5 h-5 text-rose-500" />
      case 'ADJUSTMENT': return <Settings className="w-5 h-5 text-orange-500" />
      case 'TRANSFER': return <Truck className="w-5 h-5 text-blue-500" />
      default: return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-green-50/80 text-green-700 border-green-100'
      case 'OUT': return 'bg-rose-50/80 text-rose-700 border-rose-100'
      case 'ADJUSTMENT': return 'bg-orange-50/80 text-orange-700 border-orange-100'
      case 'TRANSFER': return 'bg-blue-50/80 text-blue-700 border-blue-100'
      default: return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-32 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
            <ClipboardList className="w-8 h-8 md:w-10 md:h-10 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">Kartu Stok Mutasi</h1>
            <p className="text-xs md:text-sm font-medium text-indigo-200 mt-1">Lacak dan monitoring pergerakan inventori harian</p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3.5 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl rounded-xl shadow-lg transition-all font-bold text-sm">
             <Download className="w-4 h-4" />
             Export Excel
          </button>
          <button onClick={() => fetchMutations()} className="p-3.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl shadow-lg transition-all active:scale-95">
             <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Filter Pencarian</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative group">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cari berdasarkan nama produk, kode, atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium rounded-2xl placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <input 
              type="date" 
              value={dateFilter.start}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, start: e.target.value }));
                setPage(1);
              }}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium rounded-2xl text-gray-700"
            />
          </div>

          <div className="md:col-span-3">
            <input 
              type="date" 
              value={dateFilter.end}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, end: e.target.value }));
                setPage(1);
              }}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium rounded-2xl text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 bg-white rounded-2xl shadow-sm border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] sticky top-4 z-10">
          <div className="col-span-3">Waktu Transaksi</div>
          <div className="col-span-2 text-center">Jenis Mutasi</div>
          <div className="col-span-2 text-center">Kuantitas</div>
          <div className="col-span-2 text-right">{hidePrices ? '—' : 'Harga Satuan'}</div>
          <div className="col-span-3 pl-6">Referensi / Keterangan</div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 flex flex-col items-center justify-center">
              <div className="relative">
                 <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-6">Memuat Data...</p>
            </motion.div>
          ) : mutations.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2rem] p-24 border border-gray-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-black text-gray-800">Tidak ada riwayat mutasi</p>
              <p className="text-sm text-gray-500 mt-2">Coba sesuaikan filter pencarian atau rentang tanggal Anda.</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              {(() => {
                const groupedMutations = mutations.reduce((acc, curr) => {
                  const existingGroup = acc.find(g => g.productName === curr.product.productName);
                  if (existingGroup) {
                    existingGroup.mutations.push(curr);
                  } else {
                    acc.push({
                      productName: curr.product.productName,
                      productCode: curr.product.productCode,
                      mutations: [curr]
                    });
                  }
                  return acc;
                }, [] as { productName: string; productCode: string; mutations: Mutation[] }[]);

                return groupedMutations.map((group) => (
                  <div key={group.productName} className="bg-gray-50/30 p-2 rounded-3xl border border-gray-100/50">
                    <div className="px-6 py-4 flex items-center gap-3">
                      <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                      <div>
                        <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">{group.productName}</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.productCode}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 lg:gap-3 px-2 pb-2">
                      {group.mutations.map((m) => (
                <div key={m.id}>
                  {/* Desktop Table Row */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-8 py-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 group">
                    <div className="col-span-3 flex items-center gap-5">
                       <div className="flex flex-col items-center min-w-[60px] bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                          <span className="text-[10px] font-black text-gray-400 uppercase leading-none">{format(new Date(m.createdAt), 'MMM', { locale: localeID })}</span>
                          <span className="text-xl font-black text-gray-800 leading-none my-1">{format(new Date(m.createdAt), 'dd')}</span>
                          <span className="text-[10px] font-bold text-indigo-500">{format(new Date(m.createdAt), 'HH:mm')}</span>
                       </div>
                       <div className="min-w-0">
                          {m.batch ? <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase border border-indigo-100">B: {m.batch.batchNumber}</span> : <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">Tanpa Batch</span>}
                       </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                       <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getTypeStyle(m.type)}`}>
                          {getTypeIcon(m.type)}
                          {m.type === 'IN' ? 'MASUK' : m.type === 'OUT' ? 'KELUAR' : m.type}
                       </div>
                    </div>
                    <div className="col-span-2 text-center">
                       <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl text-sm font-black border ${m.quantity > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} <span className="text-[10px] ml-1 opacity-60">pcs</span>
                       </span>
                    </div>
                    <div className="col-span-2 flex flex-col items-end justify-center gap-1.5">
                       {hidePrices ? (
                         <p className="font-black text-gray-300 tracking-[0.3em]">••••••</p>
                       ) : (
                         <>
                           <div className="flex items-center gap-3">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">Beli</span>
                             <span className="font-bold text-gray-800 text-sm">Rp {(m.unitCost || m.batch?.purchasePrice || 0).toLocaleString('id-ID')}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">Jual</span>
                             <span className="font-bold text-indigo-600 text-sm">Rp {(m.sellingPrice || 0).toLocaleString('id-ID')}</span>
                           </div>
                         </>
                       )}
                    </div>
                    <div className="col-span-3 pl-6 border-l border-gray-100">
                       <div className="flex items-start gap-3">
                         <div className="mt-1 p-1.5 bg-gray-50 rounded-lg">
                           <FileText className="w-3.5 h-3.5 text-gray-400" />
                         </div>
                         <div className="min-w-0">
                           <p className="text-xs font-bold text-gray-800 uppercase tracking-tight truncate">{m.referenceType?.replace(/_/g, ' ') || 'MANUAL'}</p>
                           <p className="text-[11px] text-gray-500 truncate mt-0.5" title={m.notes || ''}>{m.notes || 'Tanpa catatan'}</p>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Mobile Native Card */}
                  <div className="lg:hidden bg-white border border-gray-100 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-5 pb-5 border-b border-gray-100 border-dashed">
                       <div className="flex gap-4">
                          <div className="bg-gray-50/80 px-3 py-2 rounded-2xl border border-gray-100 flex flex-col items-center min-w-[50px]">
                             <span className="text-[9px] font-black text-gray-400 uppercase leading-none">{format(new Date(m.createdAt), 'MMM')}</span>
                             <span className="text-lg font-black text-gray-800 my-0.5">{format(new Date(m.createdAt), 'dd')}</span>
                             <span className="text-[9px] font-bold text-indigo-500">{format(new Date(m.createdAt), 'HH:mm')}</span>
                          </div>
                          <div className="min-w-0 pt-0.5">
                             <h3 className="text-[12px] font-bold text-indigo-500 leading-tight truncate uppercase bg-indigo-50 px-2 py-0.5 rounded inline-block">{m.batch ? `Batch: ${m.batch.batchNumber}` : 'Tanpa Batch'}</h3>
                          </div>
                       </div>
                       <div className={`px-2.5 py-1.5 rounded-xl border flex flex-col items-center ${getTypeStyle(m.type)}`}>
                          {getTypeIcon(m.type)}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <div className="p-3 bg-gray-50/80 border border-gray-100 rounded-2xl">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Perubahan Stok</p>
                          <p className={`text-xl font-black ${m.quantity > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                             {m.quantity > 0 ? `+${m.quantity}` : m.quantity} <span className="text-[10px] font-bold text-gray-400 ml-1">Pcs</span>
                          </p>
                       </div>
                       <div className="p-3 bg-gray-50/80 border border-gray-100 rounded-2xl flex flex-col justify-center gap-1.5">
                          {hidePrices ? (
                             <p className="text-sm font-black text-gray-300 tracking-[0.3em] text-center mt-2">••••••</p>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase bg-white px-1 rounded shadow-sm">Beli</span>
                                <span className="text-[11px] font-black text-gray-800">Rp {(m.unitCost || m.batch?.purchasePrice || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-50 px-1 rounded shadow-sm">Jual</span>
                                <span className="text-[11px] font-black text-indigo-600">Rp {(m.sellingPrice || 0).toLocaleString('id-ID')}</span>
                              </div>
                            </>
                          )}
                       </div>
                    </div>
                    
                    <div className="bg-indigo-50/50 rounded-2xl p-3 flex items-start gap-3">
                       <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                       </div>
                       <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-black text-gray-800 uppercase tracking-wide truncate">{m.referenceType?.replace(/_/g, ' ') || 'Penyesuaian Manual'}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">"{m.notes || 'Tidak ada catatan tambahan'}"</p>
                       </div>
                    </div>
                  </div>
                </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 md:px-8 md:py-5 rounded-2xl border border-gray-100 shadow-sm mt-8">
            <div className="text-sm text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-900">{(meta.page - 1) * limit + 1}</span> - <span className="font-bold text-gray-900">{Math.min(meta.page * limit, meta.total)}</span> dari <span className="font-bold text-indigo-600">{meta.total}</span> riwayat
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-600 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
                  // Logic to show pages around current page
                  let pageNum = page;
                  if (meta.totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= meta.totalPages - 2) pageNum = meta.totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        page === pageNum 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-600 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
