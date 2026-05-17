'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Search, RefreshCw, Calendar, 
  ShieldAlert, Box, FileText, ArrowRight, 
  Info, EyeOff, CheckCircle2, Flame, MapPin, ChevronDown
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ExpiringBatch {
  productName: string
  productCode: string
  batchNumber: string
  expiryDate: string
  currentQty: number
  branch: string
  daysLeft: number
  isCritical: boolean
}

interface ProductSearchResult {
  id: string
  productId: string
  productName: string
  productCode: string
  category: string
  onHandQty: number
  minStockAlert: number
  unit: string
}

interface BatchStockDetail {
  id: string
  onHandQty: number
  batch?: {
    id: string
    batchNumber: string
    expiryDate: string
    purchasePrice: number
  }
  product: {
    productName: string
    productCode: string
    unit: string
  }
}

export default function ExpiredInventoryPage() {
  const { activeClinicId, user } = useAuthStore()
  const hidePrices = !['SUPER_ADMIN', 'ADMIN', 'ACCOUNTING'].includes(user?.role as string)

  // States
  const [expiringBatches, setExpiringBatches] = useState<ExpiringBatch[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<ExpiringBatch[]>([])
  const [alertSearch, setAlertSearch] = useState('')
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)

  // Product Search & Batches
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)
  const [productBatches, setProductBatches] = useState<BatchStockDetail[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)

  // Detail Modal/Drawer
  const [activeBatch, setActiveBatch] = useState<{
    productName: string
    productCode: string
    batchNumber: string
    expiryDate: string
    currentQty: number
    purchasePrice?: number
    daysLeft: number
    branch: string
  } | null>(null)

  // Fetch expiring alerts from dashboard stats
  const fetchExpiringAlerts = async () => {
    try {
      setIsLoadingAlerts(true)
      const res = await api.get('/dashboard/stats', {
        params: { range: 'week' }
      })
      if (res.data?.alerts?.expiringBatches) {
        setExpiringBatches(res.data.alerts.expiringBatches)
        setFilteredAlerts(res.data.alerts.expiringBatches)
      }
    } catch (error) {
      console.error('Fetch expiring alerts error:', error)
      toast.error('Gagal memuat data peringatan kedaluwarsa')
    } finally {
      setIsLoadingAlerts(false)
    }
  }

  // Fetch all stocks (up to 100) to populate the drop-down immediately
  const fetchAllProducts = async () => {
    try {
      if (!activeClinicId) return
      setIsSearchingProducts(true)
      const res = await api.get('/inventory/stocks', {
        params: { 
          branchId: activeClinicId,
          limit: 100
        }
      })
      const items = res.data.data || res.data || []
      setAllProducts(items)
    } catch (error) {
      console.error('Fetch all products error:', error)
    } finally {
      setIsSearchingProducts(false)
    }
  }

  // Search Products from catalog/stocks
  const handleProductSearch = async (query: string) => {
    setSearchQuery(query)
    setIsDropdownOpen(true)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearchingProducts(true)
      const res = await api.get('/inventory/stocks', {
        params: { 
          branchId: activeClinicId,
          search: query
        }
      })
      const items = res.data.data || res.data || []
      setSearchResults(items.slice(0, 10))
    } catch (error) {
      console.error('Search products error:', error)
    } finally {
      setIsSearchingProducts(false)
    }
  }

  // Load detailed batches for selected product
  const loadProductBatches = async (product: ProductSearchResult) => {
    setSelectedProduct(product)
    try {
      setIsLoadingBatches(true)
      const res = await api.get('/inventory/stocks', {
        params: {
          branchId: activeClinicId,
          productId: product.productId
        }
      })
      setProductBatches(res.data || [])
    } catch (error) {
      console.error('Load batches error:', error)
      toast.error('Gagal mengambil detail batch produk')
    } finally {
      setIsLoadingBatches(false)
    }
  }

  useEffect(() => {
    fetchExpiringAlerts()
    fetchAllProducts()
  }, [activeClinicId])

  // Filter alerts by search term
  useEffect(() => {
    if (!alertSearch.trim()) {
      setFilteredAlerts(expiringBatches)
    } else {
      const term = alertSearch.toLowerCase()
      setFilteredAlerts(
        expiringBatches.filter(
          b =>
            b.productName.toLowerCase().includes(term) ||
            b.productCode.toLowerCase().includes(term) ||
            b.batchNumber.toLowerCase().includes(term)
        )
      )
    }
  }, [alertSearch, expiringBatches])

  // Summary figures
  const expiredCount = expiringBatches.filter(b => b.daysLeft <= 0).length
  const criticalCount = expiringBatches.filter(b => b.daysLeft > 0 && b.daysLeft <= 30).length
  const warningCount = expiringBatches.filter(b => b.daysLeft > 30 && b.daysLeft <= 60).length

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
      {/* ── BANNER HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase truncate">
                Stok Kadaluarsa & Expiry
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                Pemantauan Lot Batch, Masa Edar Obat & BMHP
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchExpiringAlerts}
          className="p-3.5 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400 active:scale-95 shadow-sm self-start sm:self-auto flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAlerts ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ── STATS BENTO GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Sudah Expired</span>
            <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-600 leading-none">{expiredCount}</h3>
            <p className="text-[10px] font-semibold text-red-400 mt-1 uppercase">Batch harus ditarik</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Kritis (&le; 30 Hari)</span>
            <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-orange-600 leading-none">{criticalCount}</h3>
            <p className="text-[10px] font-semibold text-orange-400 mt-1 uppercase">Prioritas FEFO tinggi</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Peringatan (30-60 Hari)</span>
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-600 leading-none">{warningCount}</h3>
            <p className="text-[10px] font-semibold text-amber-400 mt-1 uppercase">Monitoring rutin aktif</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Status Batch</span>
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600 leading-none">
              {expiringBatches.length === 0 ? 'Aman' : 'Dalam Pantauan'}
            </h3>
            <p className="text-[10px] font-semibold text-emerald-400 mt-1 uppercase">
              {expiringBatches.length === 0 ? 'Tidak ada batch kritis' : `${expiringBatches.length} batch terpantau`}
            </p>
          </div>
        </div>
      </div>

      {/* ── SPLIT MAIN DUAL-PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PANEL KIRI: REAL-TIME EXPIRING ALERTS LIST (8 columns) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Peringatan Kadaluarsa Terkini</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lot obat yang akan segera kadaluarsa dalam waktu dekat</p>
            </div>
            
            {/* Search Input for alerts */}
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cari dalam daftar alert..."
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-xs font-bold text-gray-700"
              />
            </div>
          </div>

          {isLoadingAlerts ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-50">
              <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-4" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Data Expired...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-gray-100 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4 animate-bounce" />
              <p className="text-xs font-black text-gray-800 uppercase">Luar Biasa, Bersih!</p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Tidak ada batch produk yang kadaluarsa atau mendekati kritis saat ini</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredAlerts.map((batch, index) => {
                const isExpired = batch.daysLeft <= 0
                const isCritical = batch.daysLeft > 0 && batch.daysLeft <= 30
                const isWarning = batch.daysLeft > 30

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveBatch({
                      productName: batch.productName,
                      productCode: batch.productCode,
                      batchNumber: batch.batchNumber,
                      expiryDate: batch.expiryDate,
                      currentQty: batch.currentQty,
                      daysLeft: batch.daysLeft,
                      branch: batch.branch
                    })}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isExpired 
                        ? 'bg-red-50/40 border-red-100 hover:border-red-300' 
                        : isCritical 
                        ? 'bg-orange-50/40 border-orange-100 hover:border-orange-300' 
                        : 'bg-amber-50/40 border-amber-100 hover:border-amber-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          isExpired 
                            ? 'bg-red-100 text-red-700' 
                            : isCritical 
                            ? 'bg-orange-100 text-orange-700 animate-pulse' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isExpired ? 'Expired' : isCritical ? 'Kritis' : 'Peringatan'}
                        </span>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded">
                          Batch: {batch.batchNumber}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          Cabang: {batch.branch}
                        </span>
                      </div>
                      
                      <h3 className="text-xs font-black text-gray-900 uppercase truncate leading-tight group-hover:text-primary transition-colors">
                        {batch.productName}
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                        Kode: {batch.productCode} • Kadaluarsa: {new Date(batch.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1">Stok Tersisa</p>
                        <p className="text-xs font-black text-gray-900 leading-none">
                          {batch.currentQty} <span className="text-[9px] text-gray-400 font-bold">Unit</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1">Masa Edar</p>
                        {isExpired ? (
                          <span className="text-[9px] font-black text-red-600 uppercase bg-red-100 px-2 py-1 rounded-lg">Kadaluarsa</span>
                        ) : (
                          <span className={`text-[10px] font-black ${
                            isCritical ? 'text-orange-600' : 'text-amber-600'
                          }`}>
                            {batch.daysLeft} Hari Lagi
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-gray-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all text-gray-400 group-hover:text-primary">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* PANEL KANAN: DUAL-MODE PRODUCT SEARCH & BATCH DRILL-DOWN (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SEARCH COMPONENT */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Telusuri Produk & Batch</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4 leading-normal">
              Cari produk obat di katalog cabang Anda untuk menganalisis tanggal kadaluarsa dari seluruh batch lot yang tersimpan.
            </p>

            {/* Click-outside Backdrop */}
            {isDropdownOpen && (
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            )}

            <div className="relative z-20 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Cari atau pilih obat..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => handleProductSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-xs font-bold text-gray-700 shadow-inner"
              />
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDropdownOpen(!isDropdownOpen)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors active:scale-90"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* SEARCH RESULTS DROPDOWN */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 z-30 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-50 max-h-60 overflow-y-auto custom-scrollbar scroll-smooth"
                  >
                    {(searchQuery.trim() ? searchResults : allProducts).length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs font-bold text-gray-400 uppercase">
                        Tidak ada data obat
                      </div>
                    ) : (
                      (searchQuery.trim() ? searchResults : allProducts).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => {
                            loadProductBatches(prod)
                            setIsDropdownOpen(false)
                            setSearchQuery('')
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center justify-between transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate uppercase">{prod.productName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                              Kode: {prod.productCode} • Kategori: {prod.category}
                            </p>
                          </div>
                          <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded uppercase">Stok: {prod.onHandQty}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* DETAILED BATCH BREAKDOWN DISPLAY */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm min-h-[300px]">
            {selectedProduct ? (
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <div className="min-w-0">
                    <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-widest">{selectedProduct.category}</span>
                    <h3 className="text-xs font-black text-gray-900 uppercase truncate mt-1">{selectedProduct.productName}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">KODE: {selectedProduct.productCode}</p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-wider border border-rose-100 px-2 py-1 rounded-lg"
                  >
                    Tutup
                  </button>
                </div>

                {isLoadingBatches ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-50">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat Batch...</p>
                  </div>
                ) : productBatches.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Box className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Belum Ada Batch Aktif</p>
                    <p className="text-[8px] mt-1 leading-normal uppercase">Obat ini belum memiliki catatan penerimaan batch lot aktif di sistem.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Daftar Batch Terdaftar ({productBatches.length})</p>
                    {productBatches.map((bs, i) => {
                      if (!bs.batch) return null
                      const expiry = new Date(bs.batch.expiryDate)
                      const today = new Date()
                      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      const isExpired = daysLeft <= 0

                      return (
                        <div 
                          key={i} 
                          onClick={() => setActiveBatch({
                            productName: bs.product.productName,
                            productCode: bs.product.productCode,
                            batchNumber: bs.batch!.batchNumber,
                            expiryDate: bs.batch!.expiryDate,
                            currentQty: bs.onHandQty,
                            purchasePrice: bs.batch!.purchasePrice,
                            daysLeft,
                            branch: 'Cabang Utama'
                          })}
                          className={`p-3 rounded-xl border transition-all hover:border-primary/30 cursor-pointer flex items-center justify-between gap-3 ${
                            isExpired ? 'bg-red-50/20 border-red-100' : 'bg-gray-50/50 border-gray-100'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black text-gray-800 uppercase leading-none mb-1">BN: {bs.batch.batchNumber}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                              Exp: {expiry.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-gray-900">{bs.onHandQty} {bs.product.unit}</p>
                            {isExpired ? (
                              <span className="text-[8px] font-black text-red-500 uppercase">EXPIRED</span>
                            ) : (
                              <span className={`text-[8px] font-black uppercase ${
                                daysLeft <= 30 ? 'text-orange-500' : daysLeft <= 60 ? 'text-amber-500' : 'text-emerald-500'
                              }`}>{daysLeft} Hari Lagi</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <Box className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-xs font-black uppercase text-gray-500">Pilih Produk Untuk Menganalisis Batch</p>
                <p className="text-[9px] leading-relaxed max-w-[240px] uppercase text-gray-400 mt-1">
                  Gunakan pencarian di atas untuk memilih obat dan melacak detail batch lot lot secara dinamis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BATCH DRILL-DOWN DETAILED DRAWER/MODAL ── */}
      <AnimatePresence>
        {activeBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveBatch(null)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 md:p-8 max-w-md w-full relative z-10 overflow-hidden"
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] text-gray-400">
                <ShieldAlert className="w-48 h-48" />
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  activeBatch.daysLeft <= 0 ? 'bg-red-100 text-red-600' : activeBatch.daysLeft <= 30 ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-amber-100 text-amber-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Informasi Lengkap Batch</h3>
                  <h2 className="text-sm font-black text-gray-900 uppercase mt-0.5">{activeBatch.productName}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">KODE: {activeBatch.productCode}</p>
                </div>
              </div>

              <div className="space-y-3.5 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 mb-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Nomor Batch Lot</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">{activeBatch.batchNumber}</span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Tanggal Kadaluarsa</span>
                  <span className="text-xs font-bold text-gray-800">
                    {new Date(activeBatch.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Masa Edar Tersisa</span>
                  {activeBatch.daysLeft <= 0 ? (
                    <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-lg uppercase">KADALUARSA</span>
                  ) : (
                    <span className={`text-xs font-black ${
                      activeBatch.daysLeft <= 30 ? 'text-orange-600' : 'text-amber-600'
                    }`}>
                      {activeBatch.daysLeft} Hari Lagi
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Jumlah Stok Fisik</span>
                  <span className="text-xs font-black text-gray-900">{activeBatch.currentQty} Unit</span>
                </div>

                {!hidePrices && activeBatch.purchasePrice !== undefined && (
                  <>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Harga Beli Satuan</span>
                      <span className="text-xs font-bold text-gray-800">Rp {activeBatch.purchasePrice.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-primary uppercase">Total Kerugian / Nilai Aset</span>
                      <span className="text-sm font-black text-primary">Rp {(activeBatch.currentQty * activeBatch.purchasePrice).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/admin/inventory/stock-opname"
                  onClick={() => setActiveBatch(null)}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Lakukan Penyesuaian (Stock Opname)
                </Link>
                
                <button
                  onClick={() => setActiveBatch(null)}
                  className="w-full py-3 bg-gray-50 border border-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
