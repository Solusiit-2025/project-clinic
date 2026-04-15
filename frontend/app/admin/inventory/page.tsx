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

  const lowStockItems = stocks.filter(s => s.onHandQty <= s.minStockAlert)
  const totalAssetValue = stocks.reduce((sum, s) => sum + (s.onHandQty * (s.batch?.purchasePrice || 0)), 0)

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Package className="w-8 h-8 text-primary" />
            </div>
            Stok & Inventaris
          </h1>
          <p className="text-gray-500 font-medium mt-1">Pantau ketersediaan obat dan aset di cabang ini.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-2.5 flex flex-col items-end shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Nilai Aset</span>
            <span className="text-xl font-black text-primary">Rp {totalAssetValue.toLocaleString('id-ID')}</span>
          </div>
          <button 
            onClick={fetchStocks}
            className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95">
            Laporan Stok
          </button>
        </div>
      </div>

      {/* Alert Section - Always on Top as requested */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-1 rounded-3xl overflow-hidden group shadow-xl shadow-red-200">
              <div className="bg-white/95 backdrop-blur-md rounded-[calc(1.5rem-1px)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black text-red-900 uppercase tracking-tight">Kritis: Peringatan Stok Rendah</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900 truncate">{item.product.productName}</p>
                        <p className="text-xs font-bold text-red-600">Sisa: {item.onHandQty} unit (Min: {item.minStockAlert})</p>
                      </div>
                      <button className="px-3 py-1.5 bg-red-100 text-red-700 text-[10px] font-black rounded-lg hover:bg-red-200 transition-colors uppercase">
                        Order
                      </button>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-red-200 text-red-600 font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors">
                      +{lowStockItems.length - 3} Item Lainnya
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtering & Search */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama obat, kode, atau batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-gray-700 shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm self-start">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'all' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-400 hover:text-gray-700'}`}
          >
            SEMUA
          </button>
          <button 
            onClick={() => setFilterType('medicine')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'medicine' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:text-gray-700'}`}
          >
            OBAT
          </button>
          <button 
            onClick={() => setFilterType('asset')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'asset' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-400 hover:text-gray-700'}`}
          >
            ASET
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Item / Batch</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tipe</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stok Fisik</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tersedia</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Harga Beli</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Nilai</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5"></th>
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
                  const available = stock.onHandQty - stock.reservedQty;
                  const isLow = stock.onHandQty <= stock.minStockAlert;
                  
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={stock.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${stock.product.isMedicine ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                            {stock.product.productName[0]}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-none">{stock.product.productName}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">
                                {stock.product.productCode}
                              </span>
                              {stock.batch && (
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                  BN: {stock.batch.batchNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stock.product.isMedicine ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {stock.product.isMedicine ? 'Obat' : 'Aset'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {stock.onHandQty}
                          </span>
                          <span className="text-xs font-bold text-gray-400 uppercase">Unit</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={`text-xl font-black ${available <= 0 ? 'text-red-500' : 'text-primary'}`}>
                            {available}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Satuan</span>
                           <span className="font-black text-gray-900 leading-none">Rp {(stock.batch?.purchasePrice || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Value</span>
                           <span className="font-black text-primary leading-none text-lg">Rp {(stock.onHandQty * (stock.batch?.purchasePrice || 0)).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {isLow ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                               <AlertTriangle className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-black uppercase tracking-tight">Kritis</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl border border-green-100">
                               <ShieldAlert className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-black uppercase tracking-tight">Aman</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-right">
                          <button 
                            onClick={() => openMutationHistory(stock)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-primary/5 text-gray-400 hover:text-primary rounded-xl border border-transparent hover:border-primary/10 transition-all active:scale-95 group/btn shadow-sm"
                            title="Lihat Histori Mutasi"
                          >
                            <History className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-tight">Histori</span>
                          </button>
                        </div>
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
