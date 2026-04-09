'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { FiTag, FiAlertCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { categoryName: '', description: '', isActive: true }

type ServiceCategory = {
  id: string; categoryName: string; description?: string; isActive: boolean
  createdAt: string; _count?: { services: number }
}

export default function ServiceCategoriesPage() {
  const token = useAuthStore(state => state.token)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const [data, setData] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceCategory | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/service-categories`, { headers, params: search ? { search } : {} })
      setData(data)
    } finally { setLoading(false) }
  }, [search, token, activeClinicId])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true) }
  const openEdit = (r: ServiceCategory) => {
    setEditing(r)
    setForm({ categoryName: r.categoryName, description: r.description || '', isActive: r.isActive })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.categoryName) { setError('Nama kategori wajib diisi'); return }
    setSaving(true); setError('')
    try {
      if (editing) await axios.put(`${API}/service-categories/${editing.id}`, form, { headers })
      else await axios.post(`${API}/service-categories`, form, { headers })
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: ServiceCategory) => {
    if (!confirm(`Hapus kategori "${r.categoryName}"?`)) return
    try { await axios.delete(`${API}/service-categories/${r.id}`, { headers }); fetchData() } catch { }
  }

  const columns: Column<ServiceCategory>[] = [
    { key: 'categoryName', label: 'Nama Kategori', render: (r) => <span className="text-sm font-bold text-gray-800">{r.categoryName}</span> },
    { key: 'description', label: 'Keterangan', mobileHide: true, render: (r) => <span className="text-sm text-gray-500">{r.description || '—'}</span> },
    { key: '_count', label: 'Total Layanan', mobileHide: true, render: (r) => (
      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
        {r._count?.services || 0} layanan
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
        title="Kategori Layanan" subtitle="Kelola kategori tindakan dan layanan medis klinik"
        icon={<FiTag className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Kategori" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Kategori Layanan']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama kategori..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada kategori layanan."
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori Layanan'} size="sm">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Kategori *</label>
            <input value={form.categoryName} onChange={(e) => setForm(p => ({...p, categoryName: e.target.value}))} placeholder="cth: Konsultasi, Tindakan Bedah, Lab..."
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
    </div>
  )
}
