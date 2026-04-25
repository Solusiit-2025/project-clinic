'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Search, Filter, MoreVertical, RefreshCw, Layers, ShieldAlert,
  History
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import StockMutationDialog from '@/components/admin/inventory/StockMutationDialog'

interface Stock {
  id: string
  productId: string
  branchId: string
  batchId: string | null
  onHandQty: number
  reservedQty: number
  minStockAlert: number
  product: {
    productName: string
    productCode: string
    isMedicine: boolean
    purchasePrice: number
  }
  batch?: {
    batchNumber: string
    expiryDate: string
    purchasePrice: number
  }
}

export default function InventoryDashboard() {
  const { activeClinicId } = useAuthStore()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'medicine' | 'asset'>('all')
  
  // Mutation Dialog State
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isMutationDialogOpen, setIsMutationDialogOpen] = useState(false)

  const openMutationHistory = (stock: Stock) => {
    setSelectedStock(stock)
    setIsMutationDialogOpen(true)
  }

  const fetchStocks = async () => {
    try {
      if (!activeClinicId) return
      setIsLoading(true)
      const res = await api.get('/inventory/stocks', {
        params: { branchId: activeClinicId }
      })
      setStocks(res.data)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Gagal mengambil data stok')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()
  }, [activeClinicId])

  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterType === 'all') return matchesSearch
    if (filterType === 'medicine') return matchesSearch && s.product.isMedicine
    if (filterType === 'asset') return matchesSearch && !s.product.isMedicine
    return matchesSearch
  })

  const lowStockItems = stocks.filter(s => (s.onHandQty || 0) <= (s.minStockAlert || 0))
  const totalAssetValue = stocks.reduce((sum, s) => {
    const price = s.batch?.purchasePrice || s.product?.purchasePrice || 0;
    return sum + ((s.onHandQty || 0) * price);
  }, 0)

  return (
    <div className="p-4 w-full mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            Stok & Inventaris
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Ketersediaan obat dan aset cabang.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-1.5 flex flex-col items-end shadow-sm">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Nilai Aset</span>
            <span className="text-sm font-black text-primary leading-none">Rp {(totalAssetValue || 0).toLocaleString('id-ID')}</span>
          </div>
          <button 
            onClick={fetchStocks}
            className="p-2 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-all text-gray-400 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="px-4 py-2 bg-primary text-white font-black rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95">
            Laporan
          </button>
        </div>
      </div>

      {/* Alert Section - Always on Top as requested */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6"
          >
            <div className="bg-white border-l-4 border-l-red-500 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <h2 className="text-[10px] font-black text-red-900 uppercase tracking-[0.2em]">Peringatan Stok Rendah</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {lowStockItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50/50 border border-red-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-900 truncate uppercase">{item.product?.productName || 'Unknown'}</p>
                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-tighter">Sisa: {item.onHandQty} / Min: {item.minStockAlert}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtering & Search */}
      <div className="flex flex-col xl:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 shadow-sm"
          />
        </div>
        
        <div className="flex items-center p-1 bg-white border border-gray-100 rounded-xl shadow-sm self-start">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-400'}`}
          >
            SEMUA
          </button>
          <button 
            onClick={() => setFilterType('medicine')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'medicine' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400'}`}
          >
            OBAT
          </button>
          <button 
            onClick={() => setFilterType('asset')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'asset' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-400'}`}
          >
            ASET
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Item / Batch</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Tipe</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Fisik</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Proses</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Avail</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Beli</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Total</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-[8px]">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 font-bold">Menyiapkan data inventaris...</p>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Kosong</p>
                    <p className="text-gray-300 text-[10px] mt-1">Belum ada stok yang terdaftar di cabang ini.</p>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const onHand = stock.onHandQty || 0;
                  const reserved = stock.reservedQty || 0;
                  const available = onHand - reserved;
                  const isLow = onHand <= (stock.minStockAlert || 0);
                  const price = stock.batch?.purchasePrice || stock.product?.purchasePrice || 0;
                  
                  return (
                    <motion.tr 
                      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      key={stock.id} 
                      className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${stock.product?.isMedicine ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                            {stock.product?.productName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight text-[11px] uppercase">{stock.product?.productName || 'Unknown Product'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter bg-gray-100 px-1 py-0.5 rounded leading-none">
                                {stock.product?.productCode || 'N/A'}
                              </span>
                              {stock.batch && (
                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter leading-none">
                                  BN: {stock.batch.batchNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${stock.product?.isMedicine ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {stock.product?.isMedicine ? 'Obat' : 'Aset'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {onHand}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase">u</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-[11px] font-bold text-orange-600/50">
                        {reserved}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[11px] font-black ${available <= 0 ? 'text-red-500' : 'text-primary'}`}>
                          {available}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-900 font-bold leading-none">Rp {price.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-primary leading-none text-[11px]">Rp {(onHand * price).toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {isLow ? (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md border border-red-100">
                               <AlertTriangle className="w-2.5 h-2.5" />
                               <span className="text-[8px] font-black uppercase tracking-tighter leading-none">Kritis</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                               <span className="text-[8px] font-black uppercase tracking-tighter leading-none">Aman</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button 
                          onClick={() => openMutationHistory(stock)}
                          className="p-1.5 text-gray-300 hover:text-primary transition-colors active:scale-95"
                          title="Histori"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        {!isLoading && filteredStocks.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Menampilkan {filteredStocks.length} of {stocks.length} Items
            </p>
            <div className="flex gap-2">
              <button disabled className="p-2 rounded-lg border border-gray-100 bg-white text-gray-300 disabled:opacity-50">
                <ArrowDownRight className="w-4 h-4 rotate-45" />
              </button>
              <button className="p-2 rounded-lg border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                <ArrowUpRight className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        )}
      </div>

      <StockMutationDialog 
        isOpen={isMutationDialogOpen}
        onClose={() => setIsMutationDialogOpen(false)}
        stock={selectedStock}
      />
    </div>
  )
}
