'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiShoppingBag, FiAlertCircle, FiPlus, FiHash, FiImage, FiUpload, FiX, FiCamera } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { 
  masterProductId: '', 
  productCode: '', 
  sku: '', 
  productName: '', 
  unit: 'pcs', 
  purchaseUnit: 'box',
  storageUnit: 'pcs',
  usedUnit: 'pcs',
  quantity: 0, 
  minimumStock: 5,
  reorderQuantity: 10,
  purchasePrice: 0, 
  sellingPrice: 0, 
  clinicId: '',
  clinicIds: [] as string[],
  description: '',
  isActive: true,
  image: null as File | string | null
}

type ProductCategory = { id: string; categoryName: string; description?: string }
type ProductMaster = { id: string; masterName: string; masterCode: string; description?: string }
type Clinic = { id: string; name: string; code: string }

type ProductInventory = {
  id: string;
  productName: string;
  productCode: string;
  sku: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  clinicId: string;
  description?: string;
  isActive: boolean;
  clinic?: Clinic;
  masterProduct?: {
    masterCode: string;
    masterName: string;
    image?: string;
    productCategory?: ProductCategory;
    medicine?: {
      image?: string;
      medicineName: string;
    };
    assets?: {
      image?: string;
    }[];
  }
}

export default function ProductsPage() {
  const { token, activeClinicId, user } = useAuthStore()
  const [data, setData] = useState<ProductInventory[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [masters, setMasters] = useState<ProductMaster[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [clinicFilter, setClinicFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductInventory | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const headers = { Authorization: `Bearer ${token}` }
  const isPusat = user?.clinics?.find(c => c.id === activeClinicId)?.code === 'K001' || user?.role === 'SUPER_ADMIN'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (catFilter) params.categoryId = catFilter
      if (clinicFilter) params.clinicId = clinicFilter
      const { data } = await axios.get(`${API}/inventory`, { headers, params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, catFilter, clinicFilter, token])

  const fetchDependencies = useCallback(async () => {
    try {
      const [catRes, masterRes, clinicRes] = await Promise.all([
        axios.get(`${API}/product-categories`, { headers }),
        axios.get(`${API}/products`, { headers }), // Fetch global catalog
        axios.get(`${API}/clinics`, { headers })
      ])
      setCategories(catRes.data)
      setMasters(masterRes.data)
      setClinics(clinicRes.data)
    } catch { }
  }, [token])

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

  const openEdit = (r: ProductInventory) => {
    setEditing(r)
    setForm({ 
      masterProductId: r.masterProduct ? (r as any).masterProductId : '',
      productCode: r.productCode,
      sku: r.sku || '',
      productName: r.productName,
      unit: r.unit,
      purchaseUnit: (r as any).purchaseUnit || 'box',
      storageUnit: (r as any).storageUnit || 'pcs',
      usedUnit: (r as any).usedUnit || 'pcs',
      quantity: r.quantity,
      minimumStock: (r as any).minimumStock || 5,
      reorderQuantity: (r as any).reorderQuantity || 10,
      purchasePrice: r.purchasePrice,
      sellingPrice: r.sellingPrice,
      clinicId: r.clinicId || activeClinicId || '',
      clinicIds: [r.clinicId].filter(Boolean) as string[],
      description: r.description || '',
      isActive: r.isActive,
      image: getProductImage(r)
    })
    const img = getProductImage(r)
    setImagePreview(img ? process.env.NEXT_PUBLIC_API_URL + img : null)
    setError('')
    setModalOpen(true)
  }

  const openDuplicate = (r: ProductInventory) => {
    // regex to strip branch codes like -K001, -K002-SKU, etc.
    const stripSuffix = (str: string) => str.replace(/-K\d{3}(-.*)?$/, '')
    
    setEditing(null) // This is a new record
    setForm({ 
      masterProductId: r.masterProduct ? (r as any).masterProductId : '',
      productCode: stripSuffix(r.productCode),
      sku: stripSuffix(r.sku || ''),
      productName: r.productName,
      unit: r.unit,
      purchaseUnit: (r as any).purchaseUnit || 'box',
      storageUnit: (r as any).storageUnit || 'pcs',
      usedUnit: (r as any).usedUnit || 'pcs',
      quantity: r.quantity,
      minimumStock: (r as any).minimumStock || 5,
      reorderQuantity: (r as any).reorderQuantity || 10,
      purchasePrice: r.purchasePrice,
      sellingPrice: r.sellingPrice,
      clinicId: '',
      clinicIds: [] as string[],
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
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value instanceof File) formData.append('image', value)
        } else if (key === 'clinicIds') {
          (value as string[]).forEach(id => formData.append('clinicIds[]', id))
        } else {
          formData.append(key, String(value))
        }
      })

      if (editing) await axios.put(`${API}/inventory/${editing.id}`, formData, { headers })
      else await axios.post(`${API}/inventory`, formData, { headers })
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: ProductInventory) => {
    if (!confirm(`Hapus item "${r.productName}" dari inventaris?`)) return
    try { await axios.delete(`${API}/inventory/${r.id}`, { headers }); fetchData() } catch { }
  }

  const getProductImage = (r: ProductInventory) => {
    return r.masterProduct?.image || 
           r.masterProduct?.medicine?.image || 
           r.masterProduct?.assets?.[0]?.image || 
           null
  }

  const columns: Column<ProductInventory>[] = [
    { key: 'image', label: '', width: '50px', render: (r: ProductInventory) => {
      const img = getProductImage(r)
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      return (
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative group shadow-sm">
          {img ? (
            <img 
              src={`${apiBase}${img}`} 
              alt={r.productName} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e) => {
                (e.target as any).src = "https://placehold.co/100x100?text=No+Image"
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <FiImage className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold uppercase tracking-tighter">No Pic</span>
            </div>
          )}
          {r.masterProduct?.medicine && (
            <div className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-bl-lg shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          )}
        </div>
      )
    }},
    { key: 'sku', label: 'SKU & Nama', render: (r: ProductInventory) => (
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded tracking-tighter uppercase border border-indigo-100 flex items-center gap-1">
            <FiHash className="w-2.5 h-2.5" /> {r.sku}
          </span>
          <p className="text-sm font-extrabold text-gray-900 leading-none">{r.productName}</p>
        </div>
        <div className="flex flex-col gap-1 mt-1.5 px-1">
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.productCode}</span>
             {r.masterProduct?.medicine && <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-black uppercase italic">Clinical Medicine</span>}
           </div>
           {r.description && <p className="text-[10px] text-gray-500 font-medium italic line-clamp-1">"{r.description}"</p>}
        </div>
      </div>
    )},
    { key: 'category', label: 'Kategori', render: (r: ProductInventory) => <CategoryBadge category={r.masterProduct?.productCategory?.categoryName || 'Other'} /> },
    { key: 'quantity', label: 'Stok', render: (r: ProductInventory) => (
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-black ${r.quantity <= 5 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
            {r.quantity}
          </span>
          <span className="text-[10px] font-bold text-gray-400 lowercase">{r.unit}</span>
        </div>
        {r.quantity <= 5 && <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Low Stock</span>}
      </div>
    )},
    { key: 'sellingPrice', label: 'Harga (Rp)', mobileHide: true, render: (r: ProductInventory) => (
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Selling Price</span>
        <span className="text-sm font-black text-gray-800">
          {r.sellingPrice.toLocaleString('id-ID')}
        </span>
      </div>
    )},
    ...(isPusat ? [{ 
      key: 'clinic', 
      label: 'Cabang', 
      render: (r: ProductInventory) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-tight leading-none">
            {r.clinic?.name || 'Central'}
          </span>
          <span className="text-[9px] font-bold text-gray-400 mt-0.5">{r.clinic?.code || 'Pusat'}</span>
        </div>
      )
    }] : []),
    { key: 'isActive', label: 'Status', render: (r: ProductInventory) => <StatusBadge active={r.isActive} /> },
  ].filter(c => c.key)

  return (
    <div>
      <PageHeader
        title="Inventaris & Stok Cabang" subtitle="Kelola stok, SKU, dan harga produk per cabang"
        icon={<FiShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Stok" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Inventaris']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r: ProductInventory) => r.masterProduct?.productCategory?.categoryName || 'Uncategorized'}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari SKU, kode, atau nama produk..."
        onEdit={openEdit} onDelete={handleDelete} onDuplicate={openDuplicate}
        emptyText="Belum ada data inventaris."
        extraFilters={
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="text-[11px] font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary capitalize shadow-sm">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
            {isPusat && (
              <select value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)}
                className="text-[11px] font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary capitalize shadow-sm text-primary">
                <option value="">Semua Cabang</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Item Inventaris' : 'Registrasi Stok Baru'} size="lg">
        <div className="space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Upload Section */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Foto Produk (Katalog Master)</label>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-300">
                        <FiCamera className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Preview</span>
                      </div>
                    )}
                  </div>
                  {imagePreview && (
                    <button 
                      onClick={() => { setImagePreview(null); setForm(p => ({ ...p, image: null })) }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all z-10"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                    Update foto master untuk produk ini. Perubahan akan berlaku di <span className="font-bold text-primary">seluruh cabang</span>.
                  </p>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-black text-[10px] hover:border-primary hover:text-primary hover:bg-primary/[0.01] active:scale-95 transition-all shadow-sm mx-auto sm:mx-0 uppercase tracking-widest"
                  >
                    <FiUpload className="w-3.5 h-3.5" />
                    <span>Pilih Foto</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Master Item (Pilih dari Katalog)</label>
              <select 
                value={form.masterProductId} 
                onChange={(e) => {
                  const m = masters.find(x => x.id === e.target.value)
                  setForm(p => ({ 
                    ...p, 
                    masterProductId: e.target.value,
                    productName: m ? m.masterName : p.productName,
                    productCode: m ? m.masterCode + '-STK' : p.productCode,
                    description: m?.description || p.description
                  }))
                }}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium"
              >
                <option value="">-- Hubungkan ke Master Produk --</option>
                {masters.map(m => <option key={m.id} value={m.id}>{m.masterName} ({m.masterCode})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 font-black text-indigo-600">Unit Terkecil (Pcs/Tab)</label>
              <input value={form.unit} onChange={(e) => setForm(p => ({...p, unit: e.target.value}))}
                className="w-full px-4 py-2.5 text-sm border border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-indigo-50/30 font-bold" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Produk (Stock Label) *</label>
              <input value={form.productName} onChange={(e) => setForm(p => ({...p, productName: e.target.value}))} placeholder="cth: Paracetamol Blue Label"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Stock Keeping Unit (SKU) *</label>
              <input value={form.sku} onChange={(e) => setForm(p => ({...p, sku: e.target.value}))} placeholder="cth: SKU-PRC-001"
                className="w-full px-4 py-2.5 text-sm border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary font-black text-primary bg-primary/5 uppercase" />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Keterangan / Deskripsi Produk</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Tambahkan info tambahan mengenai stok ini..."
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium min-h-[60px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Jumlah Stok</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm(p => ({...p, quantity: Number(e.target.value)}))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Beli (Rp)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm(p => ({...p, purchasePrice: Number(e.target.value)}))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 text-emerald-600 font-black">Harga Jual (Rp) *</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => setForm(p => ({...p, sellingPrice: Number(e.target.value)}))}
                className="w-full px-4 py-2.5 text-sm border-2 border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-500 bg-emerald-50/30 font-black text-emerald-700" />
            </div>

            {!editing && isPusat && (
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Terapkan ke Cabang *</label>
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <input 
                      type="checkbox" 
                      id="select-all"
                      checked={form.clinicIds.length === clinics.length && clinics.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setForm(p => ({ ...p, clinicIds: clinics.map(c => c.id) }))
                        else setForm(p => ({ ...p, clinicIds: [] }))
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="select-all" className="text-xs font-black text-gray-900 uppercase">Pilih Semua Cabang ({clinics.length})</label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {clinics.map(c => (
                      <div key={c.id} className="flex items-center gap-2 group">
                        <input 
                          type="checkbox" 
                          id={`clinic-${c.id}`}
                          checked={form.clinicIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setForm(p => ({ ...p, clinicIds: [...p.clinicIds, c.id] }))
                            else setForm(p => ({ ...p, clinicIds: p.clinicIds.filter(id => id !== c.id) }))
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`clinic-${c.id}`} className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors cursor-pointer capitalize">
                          {c.name.toLowerCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {editing && (
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cabang (Hanya Lihat)</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 italic">
                  {editing.clinic?.name || 'Central'}
                </div>
              </div>
            )}

            {!isPusat && !editing && (
               <div className="md:col-span-3">
                 <p className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg italic">Produk akan didaftarkan ke cabang aktif: <b>{user?.clinics?.find(c => c.id === activeClinicId)?.name}</b></p>
               </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60">
              {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambahkan ke Inventaris')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
