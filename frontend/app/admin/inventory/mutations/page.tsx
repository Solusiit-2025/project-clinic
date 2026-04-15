'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ClipboardList, Search, Calendar, Filter, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, FileText, 
  Settings, Truck, ShoppingCart
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
    <div className="p-6 w-full mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            Kartu Stok (Mutasi)
          </h1>
          <p className="text-gray-500 font-medium mt-1">Riwayat lengkap mutasi barang masuk dan keluar.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm ring-1 ring-gray-100">
        <div className="lg:col-span-2 relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cari Produk / Catatan</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Ketik nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Dari Tanggal</label>
          <input 
            type="date" 
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none text-sm font-medium"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Sampai Tanggal</label>
          <input 
            type="date" 
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Timeline Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Waktu & Produk</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Jenis Mutasi</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kuantitas</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Harga Satuan</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Nilai</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Referensi / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat riwayat...</p>
                  </td>
                </tr>
              ) : filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Belum ada mutasi</p>
                    <p className="text-gray-300 text-[10px] mt-1 font-bold">Coba ubah filter tanggal atau pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={m.id} 
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase leading-none">{format(new Date(m.createdAt), 'MMM', { locale: localeID })}</span>
                          <span className="text-lg font-black text-gray-900 my-0.5">{format(new Date(m.createdAt), 'dd')}</span>
                          <span className="text-[9px] font-black text-primary/60 tracking-wider font-mono">{format(new Date(m.createdAt), 'HH:mm')}</span>
                        </div>
                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{m.product.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                              {m.product.productCode}
                            </span>
                            {m.batch && (
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                BATCH: {m.batch.batchNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                        m.type === 'IN' ? 'bg-green-50 text-green-700 border-green-100' :
                        m.type === 'OUT' ? 'bg-red-50 text-red-700 border-red-100' :
                        m.type === 'TRANSFER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {getTypeIcon(m.type)}
                        {m.type}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-black ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Unit</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Satuan</span>
                        <span className="font-bold text-gray-700">Rp {(m.batch?.purchasePrice || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nilai Transaksi</span>
                        <span className={`font-black ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Rp {(Math.abs(m.quantity) * (m.batch?.purchasePrice || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-xs">
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight truncate">
                          {m.referenceType?.replace(/_/g, ' ') || 'PENYESUAIAN MANUAL'}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 italic">
                          "{m.notes || 'Tanpa keterangan tambahan'}"
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
