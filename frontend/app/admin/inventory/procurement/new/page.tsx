'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Search, Plus, Trash2, 
  ShoppingBag, CheckCircle, AlertTriangle, ChevronDown,
  ShieldAlert, X, Loader2
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'

interface Product {
  id: string
  productName: string
  productCode: string
  isMedicine: boolean
  basePrice: number
}

interface SelectedItem extends Product {
  requestedQty: number
  unitPrice: number
  minimumStock?: number
  currentQuantity?: number
}

export default function NewProcurementPage() {
  const router = useRouter()
  const { activeClinicId } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState('')
  const [type, setType] = useState<'MEDICINE' | 'ASSET' | 'GENERAL'>('MEDICINE')
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Low Stock Pick State
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [isFetchingLowStock, setIsFetchingLowStock] = useState(false)
  const [selectedLowStockIds, setSelectedLowStockIds] = useState<string[]>([])

  useEffect(() => {
    // Fetch products based on branch and type
    const fetchProducts = async () => {
      try {
        if (!activeClinicId) return
        const res = await api.get('/inventory/products', {
          params: { branchId: activeClinicId, search: searchTerm }
        })
        const data = res.data.map((p: any) => ({
          id: p.id,
          productName: p.productName || p.masterProduct?.masterName,
          productCode: p.productCode || p.masterProduct?.masterCode,
          isMedicine: !!p.masterProduct?.medicineId,
          basePrice: p.purchasePrice || 0
        }))
        setProducts(data)
      } catch (error) {
        console.error(error)
      }
    }
    
    const timeout = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timeout)
  }, [activeClinicId, searchTerm])

  const handleAddItem = (product: Product) => {
    if (selectedItems.some(i => i.id === product.id)) {
      toast.error('Item sudah ditambahkan')
      return
    }
    setSelectedItems(prev => [...prev, { ...product, requestedQty: 1, unitPrice: product.basePrice }])
    setSearchTerm('')
    setIsDropdownOpen(false)
  }

  const handleUpdateItem = (id: string, field: 'requestedQty' | 'unitPrice', value: number) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id))
  }

  const fetchLowStock = async () => {
    setIsFetchingLowStock(true)
    try {
      const res = await api.get('/inventory/products', {
        params: { 
          branchId: activeClinicId, 
          lowStock: 'true' 
        }
      })
      
      // Filter by type if needed
      const filtered = res.data.filter((p: any) => {
        const isMed = !!p.masterProduct?.medicineId
        if (type === 'MEDICINE') return isMed
        if (type === 'ASSET') return !isMed // Simplified asset vs medicine
        return true
      })

      setLowStockProducts(filtered)
      setSelectedLowStockIds(filtered.map((p: any) => p.id)) // Default all selected
      setIsLowStockModalOpen(true)
    } catch (error) {
      toast.error('Gagal mengambil data stok menipis')
    } finally {
      setIsFetchingLowStock(false)
    }
  }

  const handleAddLowStockBatch = () => {
    const toAdd = lowStockProducts.filter(p => selectedLowStockIds.includes(p.id))
    
    let addedCount = 0
    setSelectedItems(prev => {
      const currentIds = prev.map(i => i.id)
      const newItems = toAdd
        .filter(p => !currentIds.includes(p.id))
        .map(p => ({
          id: p.id,
          productName: p.productName || p.masterProduct?.masterName,
          productCode: p.productCode || p.masterProduct?.masterCode,
          isMedicine: !!p.masterProduct?.medicineId,
          basePrice: p.purchasePrice || 0,
          requestedQty: Math.max(1, (p.minimumStock || 0) - (p.quantity || 0)),
          unitPrice: p.purchasePrice || 0,
          minimumStock: p.minimumStock,
          currentQuantity: p.quantity
        }))
      
      addedCount = newItems.length
      return [...prev, ...newItems]
    })

    if (addedCount > 0) {
      toast.success(`${addedCount} item ditambahkan ke daftar`)
    } else {
      toast.error('Semua item terpilih sudah ada di daftar')
    }
    setIsLowStockModalOpen(false)
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 item')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/inventory/procurement', {
        branchId: activeClinicId,
        type,
        notes,
        items: selectedItems.map(item => ({
          productId: item.id,
          requestedQty: item.requestedQty,
          unitPrice: item.unitPrice
        }))
      })
      toast.success('Purchase Request berhasil dibuat')
      router.push('/admin/inventory/procurement')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat PR')
    } finally {
      setIsLoading(false)
    }
  }

  const totalEstimate = selectedItems.reduce((sum, item) => sum + (item.requestedQty * item.unitPrice), 0)

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Buat Purchase Request Baru
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Pengajuan pembelian barang atau obat untuk cabang ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Form & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Informasi Dasar</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Jenis Pengadaan</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                >
                  <option value="MEDICINE">Obat-obatan</option>
                  <option value="ASSET">Aset / Inventaris</option>
                  <option value="GENERAL">Umum</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Catatan / Alasan (Opsional)</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cth: Stok menipis"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-medium"
                />
              </div>
            </div>
            
            <button 
                type="button"
                onClick={fetchLowStock}
                disabled={isFetchingLowStock}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
            >
                {isFetchingLowStock ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <ShieldAlert className="w-4 h-4" />
                )}
                CEK & PILIH STOK MENIPIS
            </button>

            <div className="relative mt-6 z-20">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cari Produk untuk Ditambahkan</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => {
                     setSearchTerm(e.target.value)
                     setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Ketik nama produk atau kode..."
                  className="w-full pl-12 pr-12 py-3 bg-white border-2 border-primary/20 focus:border-primary rounded-2xl outline-none font-bold placeholder:font-medium transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <AnimatePresence>
                {(isDropdownOpen || searchTerm) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl max-h-60 overflow-y-auto"
                  >
                    {products.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 font-medium text-sm">Tidak ada produk ditemukan.</p>
                    ) : (
                      products.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => handleAddItem(p)}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{p.productName}</p>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest">{p.productCode}</p>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden ring-1 ring-gray-100">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Item Terpilih ({selectedItems.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {selectedItems.map(item => (
                  <div key={item.id} className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{item.productName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.productCode}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 leading-none uppercase tracking-widest mb-1 block">Qty</label>
                        <input 
                          type="number"
                          min="1"
                          value={item.requestedQty}
                          onChange={(e) => handleUpdateItem(item.id, 'requestedQty', Number(e.target.value))}
                          className="w-20 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-center outline-none focus:border-primary"
                        />
                      </div>
                      <div className="hidden md:block text-gray-300 font-light text-xl px-2">×</div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 leading-none uppercase tracking-widest mb-1 block">Est. Harga Satuan</label>
                        <input 
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-32 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-right outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-32 text-right">
                      <label className="text-[9px] font-black text-gray-400 leading-none uppercase tracking-widest mb-1 block md:hidden">Subtotal</label>
                      <p className="font-black text-gray-900">Rp {(item.requestedQty * item.unitPrice).toLocaleString('id-ID')}</p>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors md:ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 text-white p-6 rounded-[32px] sticky top-6 shadow-2xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Ringkasan PR</h2>
            
            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-sm font-bold">
                 <span className="text-gray-400">Total Item</span>
                 <span>{selectedItems.length} Varian</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold">
                 <span className="text-gray-400">Total Kuantitas</span>
                 <span>{selectedItems.reduce((sum, item) => sum + item.requestedQty, 0)} Unit</span>
               </div>
               <div className="pt-4 border-t border-gray-700 flex justify-between items-end">
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Estimasi Biaya</span>
                 <span className="text-2xl font-black text-primary">Rp {totalEstimate.toLocaleString('id-ID')}</span>
               </div>
            </div>

            {totalEstimate > 10000000 && (
               <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-orange-200 leading-relaxed uppercase tracking-widest">
                     Nilai PR melebihi Rp10 Juta dan akan membutuhkan persetujuan HQ (Pusat) sebelum dapat diproses menjadi PO.
                  </p>
               </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedItems.length === 0}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  AJUKAN PURCHASE REQUEST
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Dialog */}
      <AnimatePresence>
        {isLowStockModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLowStockModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-none">Pilih Stok Menipis</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">Saran Items Berdasarkan Nilai Minimum</p>
                  </div>
                </div>
                <button onClick={() => setIsLowStockModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                {lowStockProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Semua Aman</p>
                    <p className="text-gray-300 text-[10px] mt-1">Tidak ada item yang berada di bawah level stok minimum.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map(p => {
                      const isSelected = selectedLowStockIds.includes(p.id)
                      return (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedLowStockIds(prev => 
                              isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'border-primary bg-primary/[0.02]' : 'border-gray-50 hover:border-gray-100'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center font-black ${isSelected ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                            {isSelected ? <CheckCircle className="w-5 h-5" /> : p.productName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 truncate">{p.productName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{p.productCode}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Stok: {p.quantity} / Min: {p.minimumStock}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Butuh Min.</p>
                             <p className="text-sm font-black text-primary">+{Math.max(1, p.minimumStock - p.quantity)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4 sticky bottom-0 z-10">
                <button 
                  onClick={() => setIsLowStockModalOpen(false)}
                  className="flex-1 py-4 border border-gray-200 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                >
                  Batal
                </button>
                <button 
                  disabled={selectedLowStockIds.length === 0}
                  onClick={handleAddLowStockBatch}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                  Tambahkan ({selectedLowStockIds.length}) Item Terpilih
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
