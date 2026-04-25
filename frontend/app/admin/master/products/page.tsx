'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FiShoppingBag, FiAlertCircle, FiPlus, FiHash, FiImage, FiUpload, FiX, FiCamera } from 'react-icons/fi'
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
  const [masters, setMasters] = useState<ProductMaster[]>([])
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const isPusat = user?.clinics?.some(c => c.isMain) || user?.role === 'SUPER_ADMIN'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { 
        page, 
        limit: 100 // Show more items for Master data
      }
      if (search) params.search = search
      if (catFilter) params.categoryId = catFilter
      if (clinicFilter) params.clinicId = clinicFilter
      
      const { data } = await api.get('/master/products', { params })
      const results = data?.data || []
      setData(results)
      setTotalPages(data?.meta?.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch products', err)
    } finally { setLoading(false) }
  }, [search, catFilter, clinicFilter, page, isPusat])

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

  const openDuplicate = (r: ProductInventory) => {
    setEditing(null)
    setForm({ 
      ...EMPTY,
      productCode: r.masterCode + '-DUP',
      productName: r.masterName + ' (Copy)',
      description: r.description || '',
      isActive: r.isActive,
      image: getProductImage(r)
    })
    const img = getProductImage(r)
    setImagePreview(img ? process.env.NEXT_PUBLIC_API_URL + img : null)
    setError('')
    setModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 2MB')
        return
      }
      setForm(p => ({ ...p, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!form.productName || !form.sku) { setError('Nama produk dan SKU wajib diisi'); return }
    if (!editing && form.clinicIds.length === 0) { setError('Pilih minimal satu cabang'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      
      // Map form fields to backend expected keys
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
    return r.image || 
           r.medicine?.image || 
           null
  }

  const columns: Column<ProductInventory>[] = [
    { key: 'image', label: '', width: '60px', render: (r: ProductInventory) => {
      const img = getProductImage(r)
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      return (
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative group shadow-sm transition-all hover:shadow-md">
          {img ? (
            <img 
              src={`${apiBase}${img}`} 
              alt={r.masterName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as any).src = "https://placehold.co/100x100?text=No+Image"
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <FiImage className="w-6 h-6 mb-0.5 opacity-50" />
              <span className="text-[7px] font-black uppercase tracking-tighter opacity-50">NO PIC</span>
            </div>
          )}
          {r.medicine && (
            <div className="absolute top-0 right-0 p-1 bg-red-500 rounded-bl-xl shadow-lg border-b border-l border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          )}
        </div>
      )
    }},
    { key: 'masterName', label: 'Detail Produk & Branding', width: '380px', render: (r: ProductInventory) => (
      <div className="flex flex-col py-1.5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-black bg-white text-primary px-2 py-0.5 rounded-lg tracking-widest uppercase border-2 border-primary/10 shadow-sm">
            {r.masterCode}
          </span>
          <p className="text-sm font-black text-gray-900 tracking-tight leading-tight uppercase">
            {r.masterName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {r.brand && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Brand:</span>
              <span className="text-[10px] font-bold text-gray-600">{r.brand}</span>
            </div>
          )}
          {r.manufacturer && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vendor:</span>
              <span className="text-[10px] font-bold text-gray-600">{r.manufacturer}</span>
            </div>
          )}
          {(!r.brand && !r.manufacturer) && (
            <p className="text-[10px] text-gray-400 font-medium italic line-clamp-1">{r.description || 'Tanpa keterangan brand'}</p>
          )}
        </div>
      </div>
    )},
    { key: 'stock', label: 'STOK CABANG', width: '120px', render: (r: ProductInventory) => {
      const isGlobal = (r.products?.length || 0) > 1 && !clinicFilter
      const displayStock = r.stock ?? 0
      const unit = r.unit || r.defaultUnit || 'Unit'
      
      return (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-black ${displayStock <= (r.minStock || 0) ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
              {displayStock}
            </span>
            <span className="text-[10px] font-bold text-gray-400 lowercase">{unit}</span>
          </div>
          {isGlobal && <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Total Global</span>}
          {displayStock <= (r.minStock || 0) && !isGlobal && <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Low Stock</span>}
        </div>
      )
    }},
    { key: 'pricing', label: 'Harga & SKU', width: '220px', render: (r: ProductInventory) => {
      const products = r.products || []
      const prices = products.map(p => p.sellingPrice).filter(p => p > 0)
      const minPrice = prices.length > 0 ? Math.min(...prices) : (r.sellingPrice || 0)
      const isRange = prices.length > 1 && Math.min(...prices) !== Math.max(...prices) && !clinicFilter

      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[8px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded tracking-widest uppercase">SKU</span>
              <span className="text-[10px] font-bold text-gray-600 font-mono tracking-tight">{r.sku || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Beli (Est)</span>
                  <span className="text-[11px] font-black text-slate-500">
                      Rp {(r.purchasePrice || 0).toLocaleString('id-ID')}
                  </span>
              </div>
              <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Jual</span>
                  <span className="text-[11px] font-black text-emerald-600">
                      {isRange ? `Mulai Rp ${minPrice.toLocaleString('id-ID')}` : `Rp ${minPrice.toLocaleString('id-ID')}`}
                  </span>
              </div>
          </div>
        </div>
      )
    }},
    { key: 'category', label: 'Kategori', width: '150px', render: (r: ProductInventory) => (
       <div className="flex items-center gap-2">
          <CategoryBadge category={r.productCategory?.categoryName || 'General'} />
       </div>
    )},
    { key: 'isActive', label: 'STATUS', width: '100px', render: (r: ProductInventory) => <StatusBadge active={r.isActive} /> },
  ].filter(c => c.key)

  return (
    <div>
      <PageHeader
        title="Master Produk" subtitle="Kelola katalog produk global untuk seluruh cabang"
        icon={<FiShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Master Baru" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Produk']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r: ProductInventory) => r.productCategory?.categoryName || 'Uncategorized'}
        searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Cari kode atau nama produk..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada data master produk."
        // Pagination Props
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        extraFilters={
          <div className="flex gap-2">
            {isPusat && (
                <select value={clinicFilter} onChange={(e) => { setClinicFilter(e.target.value); setPage(1) }}
                  className="text-[11px] font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary capitalize shadow-sm">
                  <option value="">Seluruh Cabang</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            )}
            <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}
              className="text-[11px] font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary capitalize shadow-sm">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Master Produk' : 'Tambah Master Produk'} size="xl">
        <div className="space-y-6 pt-2">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </motion.div>
          )}
          {/* Custom Tabs */}
          <div className="flex border-b border-gray-100 -mx-6 px-6">
            <button onClick={() => setActiveTab('info')} className={`pb-4 px-4 text-xs font-bold transition-all border-b-2 ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}>UMUM</button>
            <button onClick={() => setActiveTab('logistics')} className={`pb-4 px-4 text-xs font-bold transition-all border-b-2 ${activeTab === 'logistics' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}>LOGISTIK & SATUAN</button>
            <button onClick={() => setActiveTab('pricing')} className={`pb-4 px-4 text-xs font-bold transition-all border-b-2 ${activeTab === 'pricing' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}>HARGA & STOK</button>
          </div>

          <div className="min-h-[350px]">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column (2 slots) */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Nama Produk *</label>
                        <input value={form.productName} onChange={(e) => setForm(p => ({...p, productName: e.target.value}))} placeholder="cth: Paracetamol 500mg"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Brand / Merek</label>
                          <input value={form.brand} onChange={(e) => setForm(p => ({...p, brand: e.target.value}))} placeholder="cth: Sanbe"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Manufacturer</label>
                          <input value={form.manufacturer} onChange={(e) => setForm(p => ({...p, manufacturer: e.target.value}))} placeholder="cth: PT Kimia Farma"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Kode Master *</label>
                          <input value={form.productCode} onChange={(e) => setForm(p => ({...p, productCode: e.target.value}))} placeholder="MSTR-001"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-black uppercase tracking-widest text-primary bg-primary/5" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">SKU / Barcode</label>
                          <input value={form.sku} onChange={(e) => setForm(p => ({...p, sku: e.target.value}))} placeholder="Scan Barcode..."
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (1 slot) */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Kategori *</label>
                      <select value={form.masterProductId} onChange={(e) => setForm(p => ({ ...p, masterProductId: e.target.value }))}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-bold">
                        <option value="">-- PILIH --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Description (Full width of the internal grid) */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Deskripsi Singkat</label>
                    <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="Detail teknis produk..."
                      className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium min-h-[80px]" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logistics' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Hierarki Satuan (Logistik)</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-wider">Unit Pembelian (Ex: Box)</label>
                                <input value={form.purchaseUnit} onChange={(e) => setForm(p => ({...p, purchaseUnit: e.target.value}))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-wider">Unit Penyimpanan (Ex: Pcs)</label>
                                <input value={form.storageUnit} onChange={(e) => setForm(p => ({...p, storageUnit: e.target.value}))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
                            </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-wider">Unit Penggunaan / Resep (Ex: Tablet / Ml)</label>
                          <input value={form.usedUnit} onChange={(e) => setForm(p => ({...p, usedUnit: e.target.value}))}
                              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Informasi Tambahan</h4>
                    <ul className="space-y-3">
                      <li className="text-xs text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                        <span>Master data ini akan menjadi referensi global untuk seluruh cabang.</span>
                      </li>
                      <li className="text-xs text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                        <span>Pastikan kaitan unit antar hierarki sudah sesuai (Beli → Simpan → Pakai).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border-2 border-primary/5 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Target Harga Global (Est)
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Harga Beli Est. (Rp)</label>
                        <input type="number" value={form.purchasePrice} onChange={(e) => setForm(p => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Harga Jual Est. (Rp)</label>
                        <input type="number" value={form.sellingPrice} onChange={(e) => setForm(p => ({ ...p, sellingPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ambang Batas Stok</h4>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">Minimum Stok</label>
                            <input type="number" value={form.minStock} onChange={(e) => setForm(p => ({ ...p, minStock: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-red-600" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">Reorder Point</label>
                            <input type="number" value={form.reorderPoint} onChange={(e) => setForm(p => ({ ...p, reorderPoint: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-blue-600" />
                        </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Informasi Pemasok</h4>
                        <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">Pemasok / Supplier Utama</label>
                        <input value={form.supplier} onChange={(e) => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="cth: Kimia Farma"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-8 py-3 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 uppercase tracking-widest transition-all">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 disabled:opacity-60 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95">
              {saving ? 'Menyimpan...' : (editing ? 'Update Master Catalog' : 'Daftarkan Master Baru')}
            </button>
          </div>
        </div>
      </MasterModal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Master Produk"
        message="Apakah Anda yakin ingin menghapus produk ini secara permanen dari seluruh katalog?"
        itemName={itemToDelete?.masterName}
        loading={isDeleting}
      />
    </div>
  )
}
