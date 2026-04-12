'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiBriefcase, FiAlertCircle, FiChevronRight, FiCornerDownRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { name: '', code: '', description: '', parentId: '', isActive: true, location: '', phone: '', email: '', color: '', icon: '', headId: '', operatingHours: '' }

type Dept = { 
  id: string; 
  name: string; 
  code?: string;
  description?: string; 
  isActive: boolean; 
  parentId?: string;
  level: number;
  location?: string;
  phone?: string;
  email?: string;
  headId?: string;
  color?: string;
  icon?: string;
  operatingHours?: any;
  parent?: { id: string; name: string };
  head?: { id: string; name: string };
  clinic?: { id: string; name: string; code: string };
  createdAt: string 
}

export default function DepartmentsPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<Dept[]>([])
  const [doctors, setDoctors] = useState<{id: string, name: string, specialization: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dept | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (levelFilter === 'root') params.parentId = 'null'
      
      const { data } = await axios.get(`${API}/departments`, { headers, params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, levelFilter, token, activeClinicId])

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/doctors`, { headers })
      setDoctors(data)
    } catch {}
  }, [token])

  useEffect(() => { fetch(); fetchDoctors() }, [fetch, fetchDoctors])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true) }
  const openEdit = (r: Dept) => { 
    setEditing(r)
    setForm({ 
      name: r.name, 
      code: r.code || '',
      description: r.description || '', 
      parentId: r.parentId || '', 
      isActive: r.isActive,
      location: r.location || '',
      phone: r.phone || '',
      email: r.email || '',
      color: r.color || '',
      icon: r.icon || '',
      headId: r.headId || '',
      operatingHours: typeof r.operatingHours === 'string' ? r.operatingHours : (r.operatingHours ? JSON.stringify(r.operatingHours) : '')
    })
    setError(''); 
    setModalOpen(true) 
  }

  const handleSave = async () => {
    if (!form.name) { setError('Nama departemen wajib diisi'); return }
    if (editing && form.parentId === editing.id) { setError('Departemen tidak bisa menjadi parent untuk dirinya sendiri'); return }
    
    setSaving(true); setError('')
    try {
      const payload = { ...form, parentId: form.parentId || null }
      if (editing) await axios.put(`${API}/departments/${editing.id}`, payload, { headers })
      else await axios.post(`${API}/departments`, payload, { headers })
      setModalOpen(false); fetch()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Dept) => {
    if (!confirm(`Hapus departemen "${r.name}"?`)) return
    try { await axios.delete(`${API}/departments/${r.id}`, { headers }); fetch() } catch { }
  }

  const columns: Column<Dept>[] = [
    { 
      key: 'name', 
      label: 'Kode & Nama Departemen', 
      render: (r) => (
        <div className="flex items-center gap-2" style={{ paddingLeft: `${r.level * 24}px` }}>
          {r.level > 0 && <FiCornerDownRight className="text-gray-300 w-4 h-4 flex-shrink-0" />}
          <div>
            {r.code && <div className="text-[10px] text-gray-500 font-bold tracking-wider">{r.code}</div>}
            <span className={`${r.level === 0 ? 'text-sm font-extrabold text-gray-900' : 'text-xs font-bold text-gray-600'}`}>
              {r.name}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Info Detail',
      mobileHide: true,
      render: (r) => (
        <div className="flex flex-col gap-0.5 mt-1">
          {r.location ? <span className="text-[11px] text-gray-600 font-medium">📍 {r.location}</span> : <span className="text-[10px] text-gray-300 italic">Tanpa Lokasi</span>}
          {r.phone && <span className="text-[10px] text-gray-500 font-medium">📞 Ext/Telp: {r.phone}</span>}
          {r.head && <span className="text-[10px] text-indigo-700 font-bold mt-1 bg-indigo-50 self-start px-1.5 py-0.5 rounded">👨‍⚕️ Ka. Poli: {r.head.name}</span>}
          {r.operatingHours && <span className="text-[10px] text-amber-700 font-semibold mt-0.5 bg-amber-50 self-start px-1.5 py-0.5 rounded">⏰ {String(r.operatingHours)}</span>}
        </div>
      )
    },
    { 
      key: 'parent', 
      label: 'Induk', 
      mobileHide: true,
      render: (r) => r.parent ? (
        <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-lg">
          {r.parent.name}
        </span>
      ) : <span className="text-gray-300 text-xs italic">— Root</span>
    },
    { key: 'description', label: 'Deskripsi', mobileHide: true, render: (r) => <span className="text-xs text-gray-500 line-clamp-1">{r.description || '—'}</span> },
    { 
      key: 'clinic', 
      label: 'Cabang', 
      mobileHide: true,
      render: (r) => {
        const clinic = r.clinic;
        if (!clinic) return <span className="text-gray-300 text-xs">—</span>;
        
        const isPusat = clinic.code === 'K001';
        const isBekasi = clinic.code === 'K002';
        const badgeClass = isPusat 
          ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
          : isBekasi 
            ? "bg-amber-50 text-amber-600 border-amber-100"
            : "bg-gray-50 text-gray-400 border-gray-200";

        return (
          <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border ${badgeClass}`}>
            {clinic.code} - {clinic.name}
          </span>
        )
      }
    },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  // Filter possible parents (avoid self and nesting too deep if desired, or just allow any except self)
  const parentOptions = data.filter(d => !editing || d.id !== editing.id)

  return (
    <div>
      <PageHeader
        title="Departemen & Unit" subtitle="Kelola struktur organisasi, poli, dan penunjang medis"
        icon={<FiBriefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Departemen" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Departemen']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama departemen..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada departemen. Tambahkan poli atau departemen pertama."
        extraFilters={
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">Semua Level</option>
            <option value="root">Hanya Root</option>
          </select>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Departemen' : 'Tambah Departemen'} size="md">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Departemen *</label>
            <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="cth: Poli Umum, Radiologi..." className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode</label>
              <input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="cth: POLUM" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Lokasi / Lantai</label>
              <input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="cth: Lt. 1, R.102" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">No. Telepon / Ext</label>
              <input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="cth: 102 atau 0812..." className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
              <input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="cth: umum@klinik.com" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Departemen Induk (Parent)</label>
            <select 
              value={form.parentId} 
              onChange={(e) => setForm(p => ({ ...p, parentId: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium shadow-sm transition-all"
            >
              <option value="">— Tidak Ada (Jadikan Root) —</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>
                  {'- '.repeat(p.level)}{p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-gray-400 font-medium italic">Kosongkan jika ingin menjadikan ini departemen utama.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kepala Poli/Departemen</label>
              <select 
                value={form.headId} 
                onChange={(e) => setForm(p => ({ ...p, headId: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium shadow-sm transition-all"
              >
                <option value="">— Tidak Ada/Belum Ditentukan —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.specialization && `(${d.specialization})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode Warna UI (Hex/Nama)</label>
              <input value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} placeholder="cth: #3b82f6 atau blue" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Jam Operasional Khusus</label>
            <input value={form.operatingHours} onChange={(e) => setForm(p => ({ ...p, operatingHours: e.target.value }))} placeholder="cth: Senin - Jumat (08:00 - 15:00)" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            <p className="mt-1 text-[10px] text-gray-400 font-medium italic">Bisa diisi jika beda dengan jam operasional klinik.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detail layanan atau cakupan departemen..." rows={4} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium resize-none shadow-sm" />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
            <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
              <span className="text-[10px] text-gray-400 font-medium">Departemen yang nonaktif tidak akan muncul di form pendaftaran</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-60 active:scale-95">{saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Buat Departemen')}</button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
