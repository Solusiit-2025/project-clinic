'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardList, Search, RefreshCw, FileText, 
  ArrowUpCircle, ArrowDownCircle, Settings, Truck, ShoppingCart
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
  product: { productName: string; productCode: string }
  batch: { batchNumber: string; purchasePrice: number } | null
}

export default function StockMutationPage() {
  const { activeClinicId } = useAuthStore()
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })

  const fetchMutations = async () => {
    try {
      if (!activeClinicId) return
      setIsLoading(true)
      const res = await api.get('/inventory/mutations', {
        params: { 
          branchId: activeClinicId,
          startDate: dateFilter.start,
          endDate: dateFilter.end
        }
      })
      setMutations(res.data)
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat riwayat mutasi')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMutations()
  }, [activeClinicId, dateFilter])

  const filteredMutations = mutations.filter(m => 
    m.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowUpCircle className="w-4 h-4 text-green-500" />
      case 'OUT': return <ArrowDownCircle className="w-4 h-4 text-red-500" />
      case 'ADJUSTMENT': return <Settings className="w-4 h-4 text-orange-500" />
      case 'TRANSFER': return <Truck className="w-4 h-4 text-blue-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl">
            <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight">Kartu Stok</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Riwayat mutasi barang masuk/keluar</p>
          </div>
        </div>
        <button onClick={fetchMutations} className="self-end md:self-auto p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-primary transition-colors active:scale-95">
           <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Modern Filter Bar - Mobile Friendly */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Cari Produk / Catatan</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Ketik produk atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold rounded-2xl placeholder:text-gray-300"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Dari Tanggal</label>
            <input 
              type="date" 
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold rounded-2xl"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Sampai Tanggal</label>
            <input 
              type="date" 
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Cards on Mobile, Table on Desktop */}
      <div className="space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 bg-gray-50/50 rounded-2xl border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          <div className="col-span-4">Waktu & Informasi Produk</div>
          <div className="col-span-2 text-center">Jenis</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-2 text-right">Nilai Satuan</div>
          <div className="col-span-3">Catatan / Referensi</div>
        </div>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4 opacity-30" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memuat Riwayat...</p>
            </div>
          ) : filteredMutations.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-20 border-2 border-dashed border-gray-100 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-100 mx-auto mb-4" />
              <p className="text-sm font-black text-gray-900 uppercase">Belum Ada Mutasi</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Cek pengaturan filter atau periode tanggal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:gap-3">
              {filteredMutations.map((m, idx) => (
                <motion.div 
                  key={m.id}
                  layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                >
                  {/* Desktop Table Row */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-8 py-5 bg-white border border-gray-50 rounded-[2rem] hover:border-primary/20 hover:shadow-xl transition-all group">
                    <div className="col-span-4 flex items-center gap-6">
                       <div className="flex flex-col items-center min-w-[50px] border-r border-gray-100 pr-4">
                          <span className="text-[9px] font-black text-gray-400 uppercase leading-none">{format(new Date(m.createdAt), 'MMM', { locale: localeID })}</span>
                          <span className="text-xl font-black text-gray-900 leading-none my-1">{format(new Date(m.createdAt), 'dd')}</span>
                          <span className="text-[9px] font-black text-primary/60 font-mono italic">{format(new Date(m.createdAt), 'HH:mm')}</span>
                       </div>
                       <div className="min-w-0">
                          <p className="font-black text-gray-900 group-hover:text-primary transition-colors text-sm uppercase truncate">{m.product.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{m.product.productCode}</span>
                             {m.batch && <span className="text-[9px] font-black text-indigo-400 uppercase">Batch: {m.batch.batchNumber}</span>}
                          </div>
                       </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                       <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                         m.type === 'IN' ? 'bg-green-50 text-green-700' :
                         m.type === 'OUT' ? 'bg-red-50 text-red-700' :
                         m.type === 'TRANSFER' ? 'bg-blue-50 text-blue-700' :
                         'bg-orange-50 text-orange-700'
                       }`}>
                          {getTypeIcon(m.type)}
                          {m.type}
                       </div>
                    </div>
                    <div className="col-span-1 text-center font-black text-gray-900 text-sm">
                       {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </div>
                    <div className="col-span-2 text-right">
                       <p className="text-[9px] font-bold text-gray-300 uppercase leading-none mb-1">Rp Satuan</p>
                       <p className="font-bold text-gray-700 text-sm">{(m.batch?.purchasePrice || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="col-span-3 pl-4">
                       <p className="text-[10px] font-black text-gray-700 uppercase tracking-tight truncate">{m.referenceType?.replace(/_/g, ' ') || 'PENYESUAIAN MANUAL'}</p>
                       <p className="text-[10px] text-gray-400 italic truncate">"{m.notes || 'Tanpa keterangan'}"</p>
                    </div>
                  </div>

                  {/* Mobile Native Card */}
                  <div className="lg:hidden bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                       <div className="flex gap-4">
                          <div className="bg-gray-50 px-3 py-2 rounded-2xl flex flex-col items-center">
                             <span className="text-[8px] font-black text-gray-400 uppercase leading-none">{format(new Date(m.createdAt), 'MMM')}</span>
                             <span className="text-base font-black text-gray-900">{format(new Date(m.createdAt), 'dd')}</span>
                          </div>
                          <div className="min-w-0">
                             <h3 className="text-sm font-black text-gray-900 uppercase truncate leading-tight">{m.product.productName}</h3>
                             <p className="text-[9px] font-bold text-gray-400 mt-0.5">{format(new Date(m.createdAt), 'HH:mm')} • {m.product.productCode}</p>
                          </div>
                       </div>
                       <div className={`p-2 rounded-xl ${m.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {getTypeIcon(m.type)}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Perubahan</p>
                          <p className={`text-base font-black ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                             {m.quantity > 0 ? `+${m.quantity}` : m.quantity} <span className="text-[10px] font-bold text-gray-300 ml-1">Unit</span>
                          </p>
                       </div>
                       <div className="p-3 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Satuan</p>
                          <p className="text-sm font-black text-gray-900">Rp {(m.batch?.purchasePrice || 0).toLocaleString('id-ID')}</p>
                       </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 group">
                       <div className="p-2 bg-indigo-50 rounded-lg">
                          <FileText className="w-3 h-3 text-indigo-400" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-gray-700 uppercase">{m.referenceType?.replace(/_/g, ' ') || 'Manual'}</p>
                          <p className="text-[9px] text-gray-400 italic truncate">"{m.notes || '-'}"</p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
