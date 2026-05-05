'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FiShoppingBag, FiAlertCircle, FiPlus, FiHash, FiImage, FiUpload, FiX, FiCamera, FiShield } from 'react-icons/fi'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'
import DeleteConfirmModal from '@/components/admin/master/DeleteConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'

const EMPTY = { 
  masterProductId: '', 
  productCode: '', 
  sku: '', 
  productName: '', 
  purchaseUnit: 'box',
  storageUnit: 'pcs',
  usedUnit: 'tablet',
  purchasePrice: 0, 
  sellingPrice: 0, 
  clinicIds: [] as string[],
  description: '',
  isActive: true,
  image: null as File | string | null,
  brand: '',
  manufacturer: '',
  defaultUnit: 'pcs',
  supplier: '',
  minStock: 0,
  reorderPoint: 0
}

type ProductCategory = { id: string; categoryName: string; description?: string }
type ProductMaster = { id: string; masterName: string; masterCode: string; description?: string }
type Clinic = { id: string; name: string; code: string }

type ProductInventory = {
  id: string;
  masterCode: string;
  masterName: string;
  image?: string;
  description?: string;
  isActive: boolean;
  productCategory?: ProductCategory;
  medicine?: {
    image?: string;
    medicineName: string;
  };
  brand?: string;
  manufacturer?: string;
  sku?: string;
  defaultUnit?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  minStock?: number;
  reorderPoint?: number;
  purchaseUnit?: string;
  storageUnit?: string;
  usedUnit?: string;
  supplier?: string;
  totalStock?: number;
  stock?: number;
  unit?: string;
  products?: any[];
}

export default function ProductsPage() {
  const { activeClinicId, user } = useAuthStore()
  const [data, setData] = useState<ProductInventory[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'logistics' | 'pricing'>('info')
  const [catFilter, setCatFilter] = useState('')
  const [clinicFilter, setClinicFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductInventory | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductInventory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const isPusat = user?.clinics?.some(c => c.isMain) || user?.role === 'SUPER_ADMIN'
  const hidePrices = !['SUPER_ADMIN', 'ADMIN', 'ACCOUNTING'].includes(user?.role as string)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { 
        page, 
        limit: 10,
        search,
        category: catFilter,
        clinicId: clinicFilter
      }
      const res = await api.get('/master/products', { params })
      const resData = res.data
      const products = Array.isArray(resData) ? resData : (resData?.data || resData?.products || [])
      setData(products)
      setTotalPages(resData?.meta?.totalPages || resData?.totalPages || 1)
    } catch (e) {
      console.error('Fetch data error:', e)
    } finally {
      setLoading(false)
    }
  }, [page, search, catFilter, clinicFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Security Guard: Only Super Admin and Admin can access this page
  if (!loading && user && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <FiShield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Akses Terbatas</h1>
        <p className="text-gray-500 text-sm max-w-md mb-8 font-medium">
          Maaf, halaman Master Produk hanya dapat diakses oleh Super Admin dan Administrator. 
          Silakan hubungi IT Support jika Anda memerlukan akses ini.
        </p>
        <Link href="/admin" className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all">
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  const fetchDependencies = useCallback(async () => {
    try {
      const [catRes, clinicRes] = await Promise.all([
        api.get('/master/product-categories'),
        api.get('/master/clinics')
      ])
      setCategories(catRes.data)
      setClinics(clinicRes.data)
    } catch { }
  }, [])

  useEffect(() => { 
    fetchData()
    fetchDependencies()
  }, [fetchData, fetchDependencies])

  const openAdd = () => { 
    setEditing(null)
    setForm({ ...EMPTY, clinicIds: [activeClinicId].filter(Boolean) as string[] })
    setImagePreview(null)
    setError('')
    setModalOpen(true) 
  }

  const openEdit = (r: ProductInventory | any) => {
    setEditing(r)
    setForm({ 
      ...EMPTY,
      masterProductId: r.categoryId || '',
      productCode: r.masterCode,
      productName: r.masterName,
      description: r.description || '',
      isActive: r.isActive,
      image: getProductImage(r),
      brand: r.brand || '',
      manufacturer: r.manufacturer || '',
      sku: r.sku || '',
      defaultUnit: r.defaultUnit || 'pcs',
      purchaseUnit: r.purchaseUnit || 'box',
      storageUnit: r.storageUnit || 'pcs',
      usedUnit: r.usedUnit || 'tablet',
      supplier: r.supplier || '',
      purchasePrice: r.purchasePrice || 0,
      sellingPrice: r.sellingPrice || 0,
      minStock: r.minStock || 0,
      reorderPoint: r.reorderPoint || 0
    })
    const img = getProductImage(r)
    setImagePreview(img ? process.env.NEXT_PUBLIC_API_URL + img : null)
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.productName || !form.sku) { setError('Nama produk dan SKU wajib diisi'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      const payload: any = {
        masterName: form.productName,
        masterCode: form.productCode,
        sku: form.sku,
        categoryId: form.masterProductId,
        description: form.description,
        brand: form.brand,
        manufacturer: form.manufacturer,
        defaultUnit: form.defaultUnit,
        purchaseUnit: form.purchaseUnit,
        storageUnit: form.storageUnit,
        usedUnit: form.usedUnit,
        supplier: form.supplier,
        purchasePrice: form.purchasePrice,
        sellingPrice: form.sellingPrice,
        minStock: form.minStock,
        reorderPoint: form.reorderPoint,
        isActive: form.isActive
      }

      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      if (form.image instanceof File) {
        formData.append('image', form.image)
      }

      if (editing) {
        await api.put(`/master/products/${editing.id}`, formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
      } else {
        await api.post('/master/products', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
      }

      setModalOpen(false); fetchData()
      toast.success(editing ? 'Master produk diperbarui' : 'Master produk ditambahkan')
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = (r: ProductInventory) => {
    setItemToDelete(r)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteModalOpen(false)
    setIsDeleting(true)
    try { 
      await api.delete(`/master/products/${itemToDelete.id}`)
      fetchData() 
      toast.success('Master produk berhasil dihapus')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menghapus master produk')
    } finally {
      setIsDeleting(false)
      setItemToDelete(null)
    }
  }

  const getProductImage = (r: ProductInventory) => {
    return r.image || r.medicine?.image || null
  }

  const columns: Column<ProductInventory>[] = [
    { key: 'image', label: '', render: (r: ProductInventory) => {
      const img = getProductImage(r)
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      return (
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
          {img ? (
            <img src={`${apiBase}${img}`} alt={r.masterName} className="w-full h-full object-cover" />
          ) : (
            <FiImage className="w-6 h-6 text-gray-200" />
          )}
        </div>
      )
    }},
    { key: 'masterName', label: 'Produk & Branding', render: (r: ProductInventory) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
           <p className="text-xs md:text-sm font-black text-gray-900 uppercase truncate max-w-[200px] md:max-w-none">{r.masterName}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
           <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 tracking-widest">{r.masterCode}</span>
           <span className="text-[9px] font-bold text-gray-400 uppercase hidden md:inline">{r.brand}</span>
        </div>
      </div>
    )},
    { key: 'stock', label: 'STOK', render: (r: ProductInventory) => (
        <div className="flex flex-col">
          <p className={`text-sm font-black ${(r.stock ?? 0) <= (r.minStock || 0) ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>{r.stock ?? 0}</p>
          <span className="text-[9px] font-bold text-gray-400 uppercase">{r.unit || r.defaultUnit}</span>
        </div>
    )},
    { key: 'pricing', label: 'HARGA', mobileHide: true, render: (r: ProductInventory) => (
      <div className="flex flex-col">
          <p className="text-[11px] font-black text-gray-900 leading-tight">
            {hidePrices ? '••••••' : `Rp ${(r.sellingPrice || 0).toLocaleString('id-ID')}`}
          </p>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">SKU: {r.sku}</span>
      </div>
    )},
    { key: 'category', label: 'KATEGORI', mobileHide: true, render: (r: ProductInventory) => <CategoryBadge category={r.productCategory?.categoryName || 'Common'} /> },
    { key: 'isActive', label: 'STATUS', mobileHide: true, render: (r: ProductInventory) => <StatusBadge active={r.isActive} /> },
  ]

  return (
    <div className="p-3 md:p-0">
      <PageHeader
        title="Master Produk" subtitle="Katalog produk & inventaris global"
        icon={<FiShoppingBag className="w-5 h-5 md:w-6 md:h-6" />}
        onAdd={openAdd} addLabel="Master Baru" count={data.length}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r: ProductInventory) => r.productCategory?.categoryName || 'Uncategorized'}
        searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onEdit={openEdit} onDelete={handleDelete}
        page={page} totalPages={totalPages} onPageChange={setPage}
        extraFilters={
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}
              className="text-[10px] md:text-[11px] font-black bg-white border border-gray-100 rounded-xl px-4 py-2.5 outline-none uppercase tracking-widest shadow-sm">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
        }
      />

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Produk' : 'Master Baru'} size="xl">
        <div className="space-y-6 pt-2">
          {/* Mobile Optimized Tabs */}
          <div className="flex gap-2 border-b border-gray-100 -mx-6 px-6 overflow-x-auto no-scrollbar">
            {['info', 'logistics', 'pricing'].map((t) => {
              if (t === 'pricing' && hidePrices) return null
              return (
                <button key={t} onClick={() => setActiveTab(t as any)} 
                  className={`pb-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}>
                  {t === 'info' ? 'IDENTITAS' : t === 'logistics' ? 'LOGISTIK' : 'HARGA & STOK'}
                </button>
              )
            })}
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nama Produk *</label>
                          <input value={form.productName || ''} onChange={(e) => setForm(p => ({...p, productName: e.target.value}))} className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-black" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Kode Master</label>
                             <input value={form.productCode || ''} onChange={(e) => setForm(p => ({...p, productCode: e.target.value}))} className="w-full px-5 py-3.5 bg-primary/5 text-primary border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-black uppercase tracking-widest" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">SKU / Barcode *</label>
                             <input value={form.sku || ''} onChange={(e) => setForm(p => ({...p, sku: e.target.value}))} className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold" />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Kategori *</label>
                          <select value={form.masterProductId || ''} onChange={(e) => setForm(p => ({ ...p, masterProductId: e.target.value }))} className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold uppercase">
                             <option value="">Pilih Kategori</option>
                             {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Brand</label>
                             <input value={form.brand || ''} onChange={(e) => setForm(p => ({...p, brand: e.target.value}))} className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl font-bold" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Vendor</label>
                             <input value={form.manufacturer || ''} onChange={(e) => setForm(p => ({...p, manufacturer: e.target.value}))} className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl font-bold" />
                          </div>
                       </div>
                    </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Deskripsi Singkat</label>
                     <textarea value={form.description || ''} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={3} className="w-full px-5 py-4 bg-gray-50 border-none rounded-3xl outline-none font-medium text-xs text-gray-600" />
                  </div>
                </motion.div>
              )}

              {activeTab === 'logistics' && (
                <motion.div key="logistics" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                     <div className="bg-gray-50 p-6 md:p-8 rounded-[2.5rem] space-y-6">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Mekanisme Satuan</h4>
                        <div className="space-y-4">
                           <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Unit Beli (Ex: Box/Lusin)</label>
                              <input value={form.purchaseUnit || ''} onChange={(e) => setForm(p => ({...p, purchaseUnit: e.target.value}))} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl font-black text-sm uppercase" />
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Unit Simpan (Ex: Pcs/Btl)</label>
                              <input value={form.storageUnit || ''} onChange={(e) => setForm(p => ({...p, storageUnit: e.target.value}))} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl font-black text-sm uppercase" />
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-primary uppercase mb-1 block font-mono">Unit Resep/Gunakan (Ex: Tablet)</label>
                              <input value={form.usedUnit || ''} onChange={(e) => setForm(p => ({...p, usedUnit: e.target.value}))} className="w-full px-5 py-3 bg-primary/5 text-primary border border-primary/10 rounded-2xl font-black text-sm uppercase" />
                           </div>
                        </div>
                     </div>
                     <div className="bg-indigo-600 p-8 rounded-[3rem] text-white space-y-4 shadow-xl shadow-indigo-100">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                           <FiShoppingBag className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none">Standardisasi Katalog</h4>
                        <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest leading-relaxed">Pengaturan unit ini akan berpengaruh pada konversi stok otomatis saat melakukan Stock Opname dan Procurement.</p>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pricing' && (
                <motion.div key="pricing" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Harga Beli Est.</label>
                               <input type="number" value={form.purchasePrice ?? 0} onChange={(e) => setForm(p => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-sm" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block text-right">Harga Jual Est.</label>
                               <input type="number" value={form.sellingPrice ?? 0} onChange={(e) => setForm(p => ({ ...p, sellingPrice: parseFloat(e.target.value) || 0 }))} className="w-full px-5 py-4 bg-emerald-50 text-emerald-600 border-none rounded-2xl font-black text-sm text-right" />
                            </div>
                         </div>
                         <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                            <h4 className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4">Ambang Batas Pengingat</h4>
                            <div className="grid grid-cols-2 gap-6">
                               <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Stok Minimum</label>
                                  <input type="number" value={form.minStock ?? 0} onChange={(e) => setForm(p => ({ ...p, minStock: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-rose-200 rounded-xl font-black text-center text-rose-600 outline-none" />
                               </div>
                               <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Titik Reorder</label>
                                  <input type="number" value={form.reorderPoint ?? 0} onChange={(e) => setForm(p => ({ ...p, reorderPoint: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-blue-200 rounded-xl font-black text-center text-blue-600 outline-none" />
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col justify-end">
                         <div className="bg-gray-50 p-8 rounded-[3rem] space-y-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-300">
                               <FiPlus className="w-5 h-5" />
                            </div>
                            <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Supplier Prioritas</label>
                               <input value={form.supplier || ''} onChange={(e) => setForm(p => ({ ...p, supplier: e.target.value }))} className="w-full px-5 py-3.5 bg-white border-none rounded-2xl font-black text-sm" placeholder="Ex: Kimia Farma" />
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-8 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">BATAL</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase text-[10px] tracking-widest active:scale-95 transition-all disabled:opacity-50">
              {saving ? 'PROSES...' : (editing ? 'UPDATE KATALOG MASTER' : 'DAFTARKAN PRODUK BARU')}
            </button>
          </div>
        </div>
      </MasterModal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete}
        title="Hapus Master Produk" message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan." itemName={itemToDelete?.masterName} loading={isDeleting}
      />
    </div>
  )
}
