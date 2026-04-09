'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { FiActivity, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { serviceCode: '', serviceName: '', description: '', categoryId: '', unit: 'session', price: '', isActive: true }

type ServiceCategory = { id: string; categoryName: string }
type Service = {
  id: string; serviceCode: string; serviceName: string; description?: string
  categoryId?: string; serviceCategory?: ServiceCategory; unit?: string; price: number; isActive: boolean
}

const formatRupiah = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function ServicesPage() {
  const token = useAuthStore(state => state.token)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const [data, setData] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (catFilter) params.categoryId = catFilter
      const { data } = await axios.get(`${API}/services`, { headers, params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, catFilter, token, activeClinicId])

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/service-categories`, { headers })
      setCategories(data)
    } catch (e) { }
  }, [headers])

  useEffect(() => { 
    fetchData()
    fetchCategories()
  }, [fetchData, fetchCategories])

  const fetchNextCode = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/services/next-code`, { headers })
      setForm(p => ({ ...p, serviceCode: data.nextCode }))
    } catch (e) { console.error('Failed to fetch next code', e) }
  }, [headers])

  const openAdd = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setError(''); 
    setModalOpen(true)
    fetchNextCode()
  }
  const openEdit = (r: Service) => {
    setEditing(r)
    setForm({ 
      serviceCode: r.serviceCode, 
      serviceName: r.serviceName, 
      description: r.description || '', 
      categoryId: r.categoryId || '', 
      unit: r.unit || 'session', 
      price: String(r.price), 
      isActive: r.isActive 
    })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.serviceCode || !form.serviceName || !form.price || !form.categoryId) { 
      setError('Kode, nama, harga, dan kategori wajib diisi')
      return 
    }
    setSaving(true); setError('')
    try {
      const payload = { ...form, price: Number(form.price) }
      if (editing) await axios.put(`${API}/services/${editing.id}`, payload, { headers })
      else await axios.post(`${API}/services`, payload, { headers })
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Service) => {
    if (!confirm(`Hapus layanan "${r.serviceName}"?`)) return
    try { await axios.delete(`${API}/services/${r.id}`, { headers }); fetchData() } catch { }
  }

  const columns: Column<Service>[] = [
    { key: 'serviceCode', label: 'Kode', render: (r) => <span className="text-xs font-bold font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{r.serviceCode}</span> },
    { key: 'serviceName', label: 'Nama Layanan', render: (r) => <span className="text-sm font-semibold text-gray-800">{r.serviceName}</span> },
    { key: 'categoryId', label: 'Kategori', render: (r) => <CategoryBadge category={r.serviceCategory?.categoryName || 'Uncategorized'} /> },
    { key: 'price', label: 'Harga', render: (r) => <span className="text-sm font-bold text-emerald-700">{formatRupiah(r.price)}</span> },
    { key: 'unit', label: 'Satuan', mobileHide: true, render: (r) => <span className="text-xs text-gray-500">{r.unit}</span> },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Layanan & Tindakan" subtitle="Kelola daftar layanan medis dan harga tindakan"
        icon={<FiActivity className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Layanan" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Layanan']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r) => r.serviceCategory?.categoryName || 'Lainnya'}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari kode atau nama layanan..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada data layanan."
        extraFilters={
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary capitalize">
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id} className="capitalize">{c.categoryName}</option>)}
          </select>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Layanan' : 'Tambah Layanan'} size="md">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex justify-between items-center">
                <span>Kode Layanan *</span>
                {!editing && (
                  <button type="button" onClick={fetchNextCode} className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                    <FiRefreshCw className="w-3 h-3" />
                    <span className="text-[10px] font-bold">Generate</span>
                  </button>
                )}
              </label>
              <input value={form.serviceCode} onChange={(e) => setForm(p => ({...p, serviceCode: e.target.value}))}
                placeholder="SVC-001" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <span>Harga (Rp) *</span>
              </label>
              <input type="number" value={form.price} onChange={(e) => setForm(p => ({...p, price: e.target.value}))}
                placeholder="50000" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Layanan *</label>
              <input value={form.serviceName} onChange={(e) => setForm(p => ({...p, serviceName: e.target.value}))} placeholder="cth: Konsultasi Dokter Umum"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori *</label>
              <select value={form.categoryId} onChange={(e) => setForm(p => ({...p, categoryId: e.target.value}))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium capitalize">
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id} className="capitalize">{c.categoryName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Satuan</label>
              <input value={form.unit} onChange={(e) => setForm(p => ({...p, unit: e.target.value}))} placeholder="session, item, package"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={2}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium resize-none" placeholder="Keterangan layanan..." />
            </div>
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
