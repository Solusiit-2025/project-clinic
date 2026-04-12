'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiShoppingBag, FiAlertCircle, FiPlus, FiHash, FiImage, FiUpload, FiX, FiCamera } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'
import DeleteConfirmModal from '@/components/admin/master/DeleteConfirmModal'
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductInventory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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
      const { data } = await axios.get(`${API}/inventory`, { headers, params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, catFilter, token])

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
      ...EMPTY,
      masterProductId: r.id,
      productCode: r.masterCode,
      productName: r.masterName,
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
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value instanceof File) formData.append('image', value)
        } else if (key === 'clinicIds') {
          (value as string[]).forEach(id => formData.append('clinicIds[]', id))
        } else {
          formData.append(key, String(value))
        }
      })

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
      await axios.delete(`${API}/products/${itemToDelete.id}`, { headers })
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
    { key: 'image', label: '', width: '50px', render: (r: ProductInventory) => {
      const img = getProductImage(r)
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      return (
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative group shadow-sm">
          {img ? (
            <img 
              src={`${apiBase}${img}`} 
              alt={r.masterName} 
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
          {r.medicine && (
            <div className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-bl-lg shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          )}
        </div>
      )
    }},
    { key: 'masterName', label: 'Produk & Master Code', width: '450px', render: (r: ProductInventory) => (
      <div className="flex flex-col py-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md tracking-widest uppercase border border-gray-200">
            {r.masterCode}
          </span>
          <span className="text-sm font-black text-gray-900 tracking-tight truncate max-w-[400px] uppercase">
              {r.masterName}
          </span>
        </div>
        {r.description && <p className="text-[10px] text-gray-500 font-medium italic line-clamp-1">{r.description}</p>}
      </div>
    )},
    { key: 'category', label: 'Kategori', mobileHide: true, render: (r: ProductInventory) => <CategoryBadge category={r.productCategory?.categoryName || 'General'} /> },
    { key: 'isActive', label: 'STATUS', render: (r: ProductInventory) => <StatusBadge active={r.isActive} /> },
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
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari kode atau nama produk..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada data master produk."
        extraFilters={
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="text-[11px] font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary capitalize shadow-sm">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Master Produk' : 'Tambah Master Produk'} size="lg">
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Produk *</label>
              <input value={form.productName} onChange={(e) => setForm(p => ({...p, productName: e.target.value}))} placeholder="cth: Paracetamol"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode Master *</label>
              <input value={form.productCode} onChange={(e) => setForm(p => ({...p, productCode: e.target.value}))} placeholder="cth: PR-001"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold uppercase" />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori Produk</label>
              <select 
                value={form.masterProductId} // Using this field for categoryId in simplified form or similar
                onChange={(e) => setForm(p => ({ ...p, masterProductId: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi Produk</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Tambahkan info tambahan mengenai produk ini..."
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60">
              {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah Produk')}
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
