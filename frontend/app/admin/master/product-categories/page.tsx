'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FiTag, FiAlertCircle, FiPackage, FiShield } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Link from 'next/link'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import DeleteConfirmModal from '@/components/admin/master/DeleteConfirmModal'

const EMPTY = { categoryName: '', description: '', isActive: true }

type ProductCategory = {
  id: string; categoryName: string; description?: string; isActive: boolean
  createdAt: string; _count?: { productMasters: number }
}

export default function ProductCategoriesPage() {
  const { activeClinicId, user } = useAuthStore()
  const [data, setData] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/master/product-categories', { params: search ? { search } : {} })
      setData(data)
    } finally { setLoading(false) }
  }, [search, activeClinicId])

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
          Maaf, halaman Kategori Produk hanya dapat diakses oleh Super Admin dan Administrator. 
          Silakan hubungi IT Support jika Anda memerlukan akses ini.
        </p>
        <Link href="/admin" className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all">
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true) }
  const openEdit = (r: ProductCategory) => {
    setEditing(r)
    setForm({ categoryName: r.categoryName, description: r.description || '', isActive: r.isActive })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.categoryName) { setError('Nama kategori wajib diisi'); return }
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/master/product-categories/${editing.id}`, form)
      else await api.post('/master/product-categories', form)
      setModalOpen(false); fetchData()
      toast.success(editing ? 'Kategori diperbarui' : 'Kategori baru ditambahkan')
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = (r: ProductCategory) => {
    setItemToDelete(r)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteModalOpen(false)
    setIsDeleting(true)
    try { 
      await api.delete(`/master/product-categories/${itemToDelete.id}`)
      fetchData() 
      toast.success('Kategori berhasil dihapus')
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Gagal menghapus kategori'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
      setItemToDelete(null)
    }
  }

  const columns: Column<ProductCategory>[] = [
    { key: 'categoryName', label: 'Nama Kategori', render: (r) => <span className="text-sm font-bold text-gray-800">{r.categoryName}</span> },
    { key: 'description', label: 'Keterangan', mobileHide: true, render: (r) => <span className="text-sm text-gray-500">{r.description || '—'}</span> },
    { key: '_count', label: 'Total Produk', mobileHide: true, render: (r) => (
      <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
        {r._count?.productMasters || 0} item
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (r) => (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {r.isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Kategori Produk" subtitle="Kelola kategori master produk, obat, dan aset"
        icon={<FiTag className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Kategori" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Kategori Produk']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama kategori..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada kategori produk."
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori Produk'} size="sm">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Kategori *</label>
            <input value={form.categoryName} onChange={(e) => setForm(p => ({...p, categoryName: e.target.value}))} placeholder="cth: Medicine, Radiology, IT Infrastructure..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Keterangan</label>
            <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="Deskripsi singkat kategori..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm font-semibold text-gray-700">{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60">{saving ? 'Menyimpan...' : (editing ? 'Simpan' : 'Tambah')}</button>
          </div>
        </div>
      </MasterModal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Kategori Produk"
        message="Apakah Anda yakin ingin menghapus kategori ini secara permanen?"
        itemName={itemToDelete?.categoryName}
        loading={isDeleting}
      />
    </div>
  )
}
