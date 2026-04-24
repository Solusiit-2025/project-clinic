'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, Search, Plus, Trash2, Save, CheckCircle, 
  Printer, History, AlertTriangle, ArrowRight, Loader2,
  FileText, TrendingUp, TrendingDown, DollarSign, ChevronDown,
  XCircle
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface OpnameItem {
  id: string
  productId: string
  batchId: string | null
  systemQty: number
  physicalQty: number
  diffQty: number
  unitPrice: number
  subtotal: number
  notes: string | null
  product: {
    productName: string
    productCode: string
  }
  batch?: {
    batchNumber: string
  } | null
}

interface OpnameSession {
  id: string
  branchId: string
  status: 'DRAFT' | 'COMPLETED'
  totalValue: number
  items: OpnameItem[]
  createdAt: string
}

export default function StockOpnamePage() {
  const { activeClinicId } = useAuthStore()
  const [session, setSession] = useState<OpnameSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Search & Input state
  const [searchProducts, setSearchProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [physicalQty, setPhysicalQty] = useState<number>(0)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (activeClinicId) {
      fetchSession()
    }
  }, [activeClinicId])

  const fetchSession = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('inventory/opname/session', {
        params: { branchId: activeClinicId }
      })
      setSession(res.data)
    } catch (error) {
      console.error('Error fetching session:', error)
      toast.error('Gagal memuat sesi opname')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (val: string, forceAll = false) => {
    setSearchTerm(val)
    if (!forceAll && val.length < 2) {
      setSearchProducts([])
      return
    }
    try {
      const res = await api.get('inventory/opname/products', {
        params: { branchId: activeClinicId, search: val }
      })
      setSearchProducts(res.data)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const toggleShowAll = () => {
    if (searchProducts.length > 0) {
      setSearchProducts([])
    } else {
      handleSearch('', true)
    }
  }

  const selectProduct = (stock: any) => {
    setSelectedProduct(stock)
    setPhysicalQty(stock.onHandQty) // Default to current system qty
    setUnitPrice(stock.purchasePrice || 0) // Default to current system price
    setSearchTerm('')
    setSearchProducts([])
  }

  const addItem = async () => {
    if (!session || !selectedProduct) return
    try {
      setIsSubmitting(true)
      await api.post('inventory/opname/item', {
        sessionId: session.id,
        productId: selectedProduct.productId,
        masterProductId: selectedProduct.masterProductId,
        batchId: selectedProduct.batchId,
        physicalQty,
        unitPrice,
        notes,
        branchId: activeClinicId
      })
      toast.success('Item berhasil ditambahkan ke draft')
      setSelectedProduct(null)
      setPhysicalQty(0)
      setUnitPrice(0)
      setNotes('')
      fetchSession()
    } catch (error) {
      toast.error('Gagal menambahkan item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`inventory/opname/item/${itemId}`)
      toast.success('Item dihapus')
      fetchSession()
    } catch (error) {
    }
  }

  const finalizeOpname = async () => {
    if (!session) return
    if (session.items.length === 0) {
      toast.error('Daftar item masih kosong')
      return
    }

    if (!confirm('Apakah Anda yakin ingin melakukan rekonsiliasi stok? Tindakan ini akan langsung merubah data stok sistem.')) {
      return
    }

    try {
      setIsSubmitting(true)
      await api.post('inventory/opname/finalize', {
        sessionId: session.id
      })
      toast.success('Rekonsiliasi stok berhasil!')
      fetchSession()
    } catch (error) {
      toast.error('Gagal melakukan rekonsiliasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkLoad = async () => {
    if (!session) return
    
    if (!confirm('Muat seluruh stok sistem saat ini ke dalam draft? Item yang sudah ada tidak akan diduplikasi.')) {
      return
    }

    try {
      setIsSubmitting(true)
      console.log('StockOpnamePage: Performing bulk load...', {
        sessionId: session.id,
        branchId: activeClinicId,
        fullUrl: `/api/inventory/opname/bulk-load`
      })
      const res = await api.post('inventory/opname/bulk-load', {
        sessionId: session.id,
        branchId: activeClinicId
      })
      setSession(res.data)
      toast.success('Seluruh stok sistem berhasil dimuat ke draft')
    } catch (error) {
      console.error('Bulk load error:', error)
      toast.error('Gagal memuat stok sistem')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateQty = async (item: OpnameItem, newQty: number) => {
    if (!session) return
    try {
      // Optimistic update in UI
      const updatedItems = session.items.map(i => {
        if (i.id === item.id) {
          const diff = newQty - i.systemQty
          return { 
            ...i, 
            physicalQty: newQty, 
            diffQty: diff,
            subtotal: newQty * i.unitPrice
          }
        }
        return i
      })
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0)
      setSession({ ...session, items: updatedItems, totalValue: newTotal })

      // API Call
      await api.post('/inventory/opname/item', {
        sessionId: session.id,
        productId: item.productId,
        batchId: item.batchId,
        physicalQty: newQty,
        branchId: activeClinicId
      })
    } catch (error) {
      toast.error('Gagal memperbarui jumlah')
      fetchSession() // Revert on error
    }
  }

  const handleUpdatePrice = async (item: OpnameItem, newPrice: number) => {
    if (!session) return
    try {
      // Optimistic update in UI
      const updatedItems = session.items.map(i => {
        if (i.id === item.id) {
          return { 
            ...i, 
            unitPrice: newPrice, 
            subtotal: i.physicalQty * newPrice
          }
        }
        return i
      })
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0)
      setSession({ ...session, items: updatedItems, totalValue: newTotal })

      // API Call
      await api.post('/inventory/opname/item', {
        sessionId: session.id,
        productId: item.productId,
        batchId: item.batchId,
        physicalQty: item.physicalQty,
        unitPrice: newPrice,
        branchId: activeClinicId
      })
    } catch (error) {
      toast.error('Gagal memperbarui harga')
      fetchSession() // Revert on error
    }
  }

  const handleSaveDraft = () => {
    toast.success('Stock opname berhasil disimpan ke draft dan menunggu rekonsiliasi', {
      position: 'top-center',
      duration: 4000
    })
    router.push('/admin/inventory')
  }

  const handleCancelSession = async () => {
    try {
      if (!session) return
      setIsSubmitting(true)
      await api.post('inventory/opname/cancel', {
        sessionId: session.id,
        reason: cancelReason
      })
      toast.success('Sesi opname dibatalkan')
      setShowCancelDialog(false)
      setCancelReason('')
      fetchSession()
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Gagal membatalakan sesi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const printSheet = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <History className="w-8 h-8 text-primary" />
            </div>
            Stock Opname
          </h1>
          <p className="text-gray-500 font-medium mt-1">Lakukan rekonsiliasi stok fisik dengan sistem.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleBulkLoad}
            disabled={isSubmitting || !session}
            className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Package className="w-4 h-4" />
            Muat Semua Stok Sistem
          </button>
          <button 
            onClick={printSheet}
            className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-600 font-bold flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Lembar Kerja
          </button>
          <button 
            onClick={fetchSession}
            className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400"
          >
            <Loader2 className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Side: Input Form */}
        <div className="xl:col-span-4 space-y-6 print:hidden">
          <Card className="p-6 border-none shadow-xl shadow-gray-200/50 bg-white rounded-[32px]">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Input Item Opname
            </h3>

            <div className="space-y-5">
              {/* Product Search */}
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cari Produk</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Ketik nama atau kode barang..."
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  <button 
                    onClick={toggleShowAll}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${searchProducts.length > 0 ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchProducts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[50] max-h-60 overflow-y-auto overflow-hidden divide-y divide-gray-50"
                    >
                      {searchProducts.map((stock, index) => (
                        <button
                          key={index}
                          onClick={() => selectProduct(stock)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-black text-gray-900 truncate">{stock.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                 {stock.productCode} {stock.batchNumber ? `• BN: ${stock.batchNumber}` : ''}
                               </span>
                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                 stock.status === 'IN_STOCK' ? 'bg-green-100 text-green-600' :
                                 stock.status === 'IN_CATALOG' ? 'bg-blue-100 text-blue-600' :
                                 'bg-gray-100 text-gray-600'
                               }`}>
                                 {stock.status === 'IN_STOCK' ? 'In Stock' : stock.status === 'IN_CATALOG' ? 'In Catalog' : 'Global'}
                               </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="text-xs font-black text-primary">{stock.onHandQty} Unit</p>
                             <p className="text-[9px] font-bold text-gray-300">Sistem</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected Product Details */}
              <AnimatePresence>
                {selectedProduct && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Item Terpilih</p>
                        <p className="font-black text-gray-900">{selectedProduct.productName}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedProduct(null)}
                        className="p-1 hover:bg-white rounded-lg transition-colors text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 p-3 rounded-xl border border-white">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stok Sistem</p>
                        <p className="text-lg font-black text-gray-900">{selectedProduct.onHandQty}</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-xl border border-white">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Harga Sistem</p>
                        <p className="text-sm font-black text-primary">
                          Rp {(selectedProduct.purchasePrice || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Harga Beli</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-sm text-gray-900"
                              value={unitPrice}
                              onChange={(e) => setUnitPrice(Number(e.target.value))}
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Jumlah Fisik</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-white border-2 border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-sm text-primary"
                              value={physicalQty}
                              onChange={(e) => setPhysicalQty(Number(e.target.value))}
                            />
                         </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Catatan / Alasan</label>
                          <textarea 
                            rows={2}
                            placeholder="Contoh: Barang rusak, Saldo awal, dll"
                            className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-xs text-gray-600"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                       </div>
                       
                       <button 
                        disabled={isSubmitting}
                        onClick={addItem}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                       >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        TAMBAHKAN KE LIST
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedProduct && (
                 <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                    <Package className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-300 font-bold text-xs uppercase tracking-widest">Pilih produk untuk memulai</p>
                 </div>
              )}
            </div>
          </Card>

          {/* Statistics Card */}
          {session && session.items.length > 0 && (
            <Card className="p-6 border-none shadow-xl shadow-indigo-100/50 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] text-white">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-200" />
                  </div>
                  <h3 className="font-black uppercase tracking-widest text-sm">Ringkasan Draft</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Item</span>
                    <span className="text-2xl font-black">{session.items.length}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Nilai Fisik</span>
                    <span className="text-2xl font-black">Rp {session.totalValue.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 mt-4">
                     <button 
                      onClick={finalizeOpname}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:shadow-white/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                     >
                       <CheckCircle className="w-5 h-5" />
                       REKONSILIASI STOK SEKARANG
                     </button>

                     <button 
                       onClick={handleSaveDraft}
                       className="w-full py-4 bg-indigo-500/20 text-white border border-indigo-400/30 font-black rounded-2xl hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 mt-3"
                     >
                       <Save className="w-5 h-5" />
                       SIMPAN SEBAGAI DRAFT
                     </button>

                     <button 
                        onClick={() => setShowCancelDialog(true)}
                        className="w-full py-4 bg-red-500/10 text-red-200 border border-red-500/20 font-black rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 mt-3"
                      >
                        <XCircle className="w-5 h-5" />
                        BATALKAN SESI (DRAFT)
                      </button>

                     <p className="text-[9px] font-bold text-indigo-300 mt-3 text-center leading-relaxed">
                        Tindakan ini akan memproses semua penyesuaian Stok Fisik dan membuat riwayat Mutasi ke dalam database.
                     </p>
                  </div>
               </div>
            </Card>
          )}
        </div>

        {/* Right Side: Draft Table */}
        <div className="xl:col-span-8">
           <Card className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden flex flex-col min-h-[600px]">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                       <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-gray-900 leading-tight">Daftar Draft Opname</h2>
                       <p className="text-xs font-bold text-gray-400">Barang yang akan disesuaikan pada sesi ini.</p>
                    </div>
                 </div>
                 
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Sesi</p>
                    <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                       Draft Aktif
                    </span>
                 </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="bg-gray-50/50">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Item / Batch</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Sistem</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Fisik</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Selisih</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Harga</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Total Fisik</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-100 uppercase tracking-[0.2em]"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {session?.items.length === 0 ? (
                          <tr>
                             <td colSpan={7} className="px-8 py-32 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                   <Search className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-gray-900 font-black tracking-tight text-lg">Belum Ada Barang</h3>
                                <p className="text-gray-400 text-sm mt-1">Cari dan pilih produk di panel kiri untuk memulai input.</p>
                             </td>
                          </tr>
                       ) : (
                          session?.items.map((item) => {
                             const isLoss = item.diffQty < 0
                             const isGain = item.diffQty > 0
                             const diffValue = Math.abs(item.diffQty * item.unitPrice)
                             
                             return (
                                <motion.tr 
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  key={item.id} 
                                  className="group hover:bg-gray-50/50 transition-colors"
                                >
                                   <td className="px-8 py-5">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                            {item.product.productName[0]}
                                         </div>
                                         <div className="max-w-[180px]">
                                            <p className="font-black text-gray-900 leading-none truncate">{item.product.productName}</p>
                                            <div className="flex items-center gap-2 mt-1.5 min-w-0">
                                               <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate">
                                                  {item.product.productCode}
                                               </span>
                                               {item.batch && (
                                                  <span className="text-[9px] font-black text-primary uppercase truncate tracking-tighter">
                                                     BN: {item.batch.batchNumber}
                                                  </span>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5 text-center">
                                      <span className="text-sm font-black text-gray-400">{item.systemQty}</span>
                                   </td>
                                   <td className="px-6 py-5 text-center">
                                      <input 
                                         type="number"
                                         className="w-20 px-2 py-1 bg-gray-50 border-2 border-transparent focus:border-primary/30 rounded-lg text-center font-black text-gray-900 outline-none transition-all"
                                         value={item.physicalQty}
                                         onChange={(e) => handleUpdateQty(item, Number(e.target.value))}
                                       />
                                   </td>
                                   <td className="px-6 py-5">
                                      <div className={`flex flex-col items-center gap-0.5 ${isLoss ? 'text-red-600' : isGain ? 'text-green-600' : 'text-gray-300'}`}>
                                         <div className="flex items-center gap-1 font-black text-base">
                                            {isGain && <TrendingUp className="w-4 h-4" />}
                                            {isLoss && <TrendingDown className="w-4 h-4" />}
                                            {isGain ? '+' : ''}{item.diffQty}
                                         </div>
                                         <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                                            {diffValue > 0 ? `Rp ${diffValue.toLocaleString('id-ID')}` : 'Balance'}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5 text-right">
                                       <input 
                                          type="number"
                                          className="w-28 px-2 py-1 bg-gray-50 border-2 border-transparent focus:border-primary/30 rounded-lg text-right font-black text-gray-400 text-xs outline-none transition-all"
                                          value={item.unitPrice}
                                          onChange={(e) => handleUpdatePrice(item, Number(e.target.value))}
                                        />
                                   </td>
                                   <td className="px-6 py-5 text-right whitespace-nowrap">
                                      <span className="text-base font-black text-primary">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                   </td>
                                   <td className="px-8 py-5 text-right">
                                      <button 
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                                      >
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </td>
                                </motion.tr>
                             )
                          })
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gain (Stok Berlebih)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loss (Stok Hilang)</span>
                    </div>
                 </div>
                 
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Nilai Sesi</p>
                    <p className="text-2xl font-black text-primary leading-none">
                       Rp {session?.totalValue.toLocaleString('id-ID') || '0'}
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .p-6 { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #eee !important; padding: 12px 8px !important; }
          .xl\\:col-span-12 { width: 100% !important; }
          h1, h2, h3 { color: black !important; }
          .bg-gray-50 { background: #f9fafb !important; }
        }
      `}</style>
      
      {/* Hidden Print Content */}
      <div className="hidden print:block p-10">
         <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-6">
            <div>
               <h1 className="text-4xl font-black text-gray-900 mb-1">LEMBAR KERJA STOCK OPNAME</h1>
               <p className="text-lg font-bold text-gray-500">Klinik Yasfina Management System</p>
            </div>
            <div className="text-right">
               <p className="font-black text-xl">CABANG: {session?.branchId.slice(0, 8)}</p>
               <p className="text-gray-500 font-bold">TANGGAL: {format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
            </div>
         </div>
         
         <table className="w-full text-sm border-2 border-black">
            <thead>
               <tr className="bg-gray-100">
                  <th className="border-2 border-black p-3 text-left font-black w-[40%]">NAMA BARANG / BATCH</th>
                  <th className="border-2 border-black p-3 text-center font-black">STOK SISTEM</th>
                  <th className="border-2 border-black p-3 text-center font-black w-[20%]">STOK FISIK (PENCATATAN)</th>
                  <th className="border-2 border-black p-3 text-center font-black">CATATAN</th>
               </tr>
            </thead>
            <tbody>
               {/* Note: In a real app we might fetch the full inventory for print sheet, 
                   but here we could use session items if session is used as a template, 
                   or just use a placeholder to show the design. */}
               {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
                  <tr key={i}>
                     <td className="border border-gray-300 p-4 h-12"></td>
                     <td className="border border-gray-300 p-4 h-12 text-center text-gray-100">----</td>
                     <td className="border-2 border-black p-4 h-12"></td>
                     <td className="border border-gray-300 p-4 h-12"></td>
                  </tr>
               ))}
            </tbody>
         </table>

         <div className="mt-20 grid grid-cols-3 gap-10 text-center">
            <div className="space-y-20">
               <p className="font-bold">PETUGAS GUDANG</p>
               <div className="border-b border-black w-40 mx-auto" />
            </div>
            <div className="space-y-20">
               <p className="font-bold">KEPALA CABANG</p>
               <div className="border-b border-black w-40 mx-auto" />
            </div>
            <div className="space-y-20">
               <p className="font-bold">ADMIN FINANCE</p>
               <div className="border-b border-black w-40 mx-auto" />
            </div>
         </div>
         
         <p className="mt-20 text-[10px] text-gray-400 italic font-medium">
            Dokumen ini dihasilkan secara otomatis oleh Yasfina Management System pada {format(new Date(), 'PPPP HH:mm:ss', { locale: id })}
         </p>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelDialog(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Batalkan Sesi?</h3>
                <p className="text-gray-500 font-medium mb-6">
                  Seluruh data draft yang belum direkonsiliasi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Alasan Pembatalan</label>
                    <textarea 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Contoh: Kesalahan input data, stok sudah disesuaikan manual, dll..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button 
                    onClick={() => setShowCancelDialog(false)}
                    className="py-4 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                  >
                    KEMBALI
                  </button>
                  <button 
                    onClick={handleCancelSession}
                    disabled={isSubmitting}
                    className="py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'MEMPROSES...' : 'YA, BATALKAN'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
