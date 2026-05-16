'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiActivity, FiAlertCircle, FiRefreshCw, FiInfo } from 'react-icons/fi'
import { HiOutlineBeaker } from 'react-icons/hi'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'
import { useAuthStore } from '@/lib/store/useAuthStore'

const EMPTY = { code: '', name: '', category: 'HEMATOLOGI', unit: '', normalRangeText: '', minNormal: '', maxNormal: '', price: '', isActive: true, parentId: '' }

type LabTest = {
  id: string; code: string; name: string; category: string; unit?: string;
  normalRangeText?: string; minNormal?: number; maxNormal?: number; price: number; isActive: boolean;
  parentId?: string;
  parent?: { name: string };
}

export default function LabMasterPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LabTest | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = useMemo(() => user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role), [user])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/lab/test-masters')
      setData(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setError(''); 
    setModalOpen(true)
  }
  const openEdit = (r: LabTest) => {
    setEditing(r)
    setForm({ 
      code: r.code, 
      name: r.name, 
      category: r.category, 
      unit: r.unit || '', 
      normalRangeText: r.normalRangeText || '', 
      minNormal: r.minNormal ? String(r.minNormal) : '', 
      maxNormal: r.maxNormal ? String(r.maxNormal) : '', 
      price: String(r.price), 
      isActive: r.isActive,
      parentId: r.parentId || ''
    })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.name || !form.category) { 
      setError('Kode, nama, dan kategori wajib diisi')
      return 
    }
    setSaving(true); setError('')
    try {
      const payload = { ...form, price: Number(form.price) }
      if (editing) await api.put(`/lab/test-masters/${editing.id}`, payload)
      else await api.post('/lab/test-masters', payload)
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: LabTest) => {
    if (!confirm(`Hapus parameter lab "${r.name}"?`)) return
    try { await api.delete(`/lab/test-masters/${r.id}`); fetchData() } catch { }
  }

  const columns = useMemo(() => {
    const cols: Column<LabTest>[] = [
      { key: 'code', label: 'Kode', render: (r) => <span className="text-xs font-bold font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{r.code}</span> },
      { key: 'name', label: 'Nama Parameter', render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{r.name}</span>
          {r.parent && (
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
              Induk: {r.parent.name}
            </span>
          )}
        </div>
      ) },
      { key: 'category', label: 'Kategori', render: (r) => <CategoryBadge category={r.category} /> },
      { key: 'unit', label: 'Satuan', render: (r) => <span className="text-xs font-medium text-gray-500">{r.unit || '-'}</span> },
      { key: 'normalRangeText', label: 'Nilai Normal', render: (r) => <span className="text-xs font-medium text-slate-500 italic">{r.normalRangeText || '-'}</span> },
    ]

    if (isAdmin) {
      cols.push({ 
        key: 'price', 
        label: 'Harga', 
        render: (r) => <span className="text-xs font-black text-primary">Rp {(r.price || 0).toLocaleString('id-ID')}</span> 
      })
    }

    cols.push({ key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> })
    return cols
  }, [isAdmin])

  return (
    <div>
      <PageHeader
        title="Master Laboratorium" subtitle="Kelola parameter pemeriksaan, nilai rujukan, dan satuan lab"
        icon={<HiOutlineBeaker className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={isAdmin ? openAdd : undefined} addLabel="Tambah Parameter" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Laboratorium']}
      />
      
      <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-medium text-amber-800 leading-relaxed">
          <strong>Tip:</strong> Parameter ini digunakan untuk menginput hasil pemeriksaan yang terstruktur. 
          Anda dapat menyamakan nama parameter dengan Nama Layanan (Master Services) agar memudahkan identifikasi.
        </div>
      </div>

      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r) => r.category}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari kode atau nama parameter..."
        onEdit={isAdmin ? openEdit : undefined} onDelete={isAdmin ? handleDelete : undefined}
        emptyText="Belum ada data parameter laboratorium."
      />

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Parameter Lab' : 'Tambah Parameter Lab'} size="lg">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Parameter *</label>
              <input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder="cth: Hemoglobin, Glukosa Puasa"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode Parameter *</label>
              <input value={form.code} onChange={(e) => setForm(p => ({...p, code: e.target.value}))}
                placeholder="LAB-HB" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori *</label>
              <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value}))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium uppercase">
                <option value="HEMATOLOGI">HEMATOLOGI</option>
                <option value="IMUNOSEROLOGI">IMUNOSEROLOGI</option>
                <option value="KIMIA METABOLISME LEMAK">KIMIA METABOLISME LEMAK</option>
                <option value="KIMIA - METABOLISMS GULA">KIMIA - METABOLISMS GULA</option>
                <option value="METABOLISME FAAL HATI">METABOLISME FAAL HATI</option>
                <option value="KIMIA - METABOLISME FAAL GINJAL">KIMIA - METABOLISME FAAL GINJAL</option>
                <option value="URINALISA">URINALISA</option>
                <option value="PAKET LABORATORIUM">PAKET LABORATORIUM</option>
                <option value="LAINNYA">LAINNYA</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-indigo-600 mb-1.5 flex items-center gap-2">
                <HiOutlineBeaker className="w-3 h-3" /> Induk Pemeriksaan (Jika merupakan bagian dari paket)
              </label>
              <select 
                value={form.parentId} 
                onChange={(e) => setForm(p => ({...p, parentId: e.target.value}))}
                className="w-full px-4 py-2.5 text-sm border border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-indigo-50/30 font-medium"
              >
                <option value="">-- Berdiri Sendiri (Bukan bagian dari paket) --</option>
                {data
                  .filter(t => t.id !== editing?.id && !t.parentId) // Only allow top-level items as parents
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Satuan</label>
              <input value={form.unit} onChange={(e) => setForm(p => ({...p, unit: e.target.value}))} placeholder="g/dL, mg/dL, %"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga (Opsional)</label>
                <input type="number" value={form.price} onChange={(e) => setForm(p => ({...p, price: e.target.value}))}
                  placeholder="0" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nilai Normal (Teks)</label>
              <input value={form.normalRangeText} onChange={(e) => setForm(p => ({...p, normalRangeText: e.target.value}))} placeholder="cth: 12.0 - 16.0"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Min Normal (Angka)</label>
              <input type="number" value={form.minNormal} onChange={(e) => setForm(p => ({...p, minNormal: e.target.value}))} placeholder="12.0"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Normal (Angka)</label>
              <input type="number" value={form.maxNormal} onChange={(e) => setForm(p => ({...p, maxNormal: e.target.value}))} placeholder="16.0"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => isAdmin && setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'} ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm font-semibold text-gray-700">{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
          </div>

          {isAdmin && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60">{saving ? 'Menyimpan...' : (editing ? 'Simpan' : 'Tambah')}</button>
            </div>
          )}
        </div>
      </MasterModal>
    </div>
  )
}
