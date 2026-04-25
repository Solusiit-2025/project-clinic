'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { FiUsers, FiAlertCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, RoleBadge } from '@/components/admin/master/StatusBadge'

const ROLES = ['SUPER_ADMIN','ADMIN','DOCTOR','RECEPTIONIST','FARMASI','ACCOUNTING','LOGISTIC','STAFF']

type User = {
  id: string; email: string; username: string; name: string
  phone?: string; role: string; isActive: boolean; lastLogin?: string; createdAt: string
  clinics?: { clinic: { id: string, name: string, code: string } }[]
}

type ClinicShort = { id: string; name: string; code: string }

const EMPTY_FORM = { email:'', username:'', password:'', name:'', phone:'', role:'STAFF', isActive: true, clinicIds: [] as string[] }

export default function UsersPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<User[]>([])
  const [clinics, setClinics] = useState<ClinicShort[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')


  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await api.get('/master/clinics')
      setClinics(data)
    } catch { /* ignore */ }
  }, [])

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/master/users', { params })
      const usersArray = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setData(usersArray)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [search, roleFilter, activeClinicId])

  useEffect(() => { 
    fetch()
    fetchClinics()
  }, [fetch, fetchClinics])

  const openAdd = () => { 
    setEditing(null)
    setForm({ ...EMPTY_FORM, clinicIds: [activeClinicId || ''] })
    setError('')
    setModalOpen(true) 
  }

  const openEdit = (row: User) => {
    setEditing(row)
    setForm({ 
      email: row.email, 
      username: row.username, 
      password: '', 
      name: row.name, 
      phone: row.phone || '', 
      role: row.role, 
      isActive: row.isActive,
      clinicIds: row.clinics?.map(c => c.clinic.id) || []
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email || !form.username || (!editing && !form.password)) {
      setError('Nama, email, username, dan password wajib diisi'); return
    }
    if (!form.clinicIds || form.clinicIds.length === 0) {
      setError('Minimal satu cabang harus dipilih'); return
    }

    setSaving(true); setError('')
    try {
      const payload: any = { ...form }
      if (editing && !payload.password) delete payload.password
      if (editing) {
        await api.put(`/master/users/${editing.id}`, payload)
      } else {
        await api.post('/master/users', payload)
      }
      setModalOpen(false); fetch()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: User) => {
    if (!confirm(`Hapus user "${row.name}"?`)) return
    try { await api.delete(`/master/users/${row.id}`); fetch() } catch { /* */ }
  }

  const columns: Column<User>[] = [
    { key: 'name', label: 'Nama', render: (r) => (
      <div>
        <p className="text-sm font-bold text-gray-900">{r.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {r.clinics?.map(c => {
            const isPusat = c.clinic.code === 'K001';
            const isBekasi = c.clinic.code === 'K002';
            const badgeClass = isPusat ? "bg-indigo-50 text-indigo-600" : isBekasi ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500";
            return (
              <span key={c.clinic.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
                {c.clinic.code}
              </span>
            );
          })}
          {(!r.clinics || r.clinics.length === 0) && <span className="text-[9px] text-gray-400 italic">No assigned clinics</span>}
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (r) => <RoleBadge role={r.role} /> },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
    { key: 'contact', label: 'Kontak', mobileHide: true, render: (r) => (
      <div className="text-xs space-y-0.5">
        <p className="font-medium text-gray-700">{r.email}</p>
        <p className="text-gray-400 font-bold tracking-tight">@{r.username}</p>
      </div>
    )},
    { key: 'lastLogin', label: 'Login Terakhir', mobileHide: true, render: (r) => (
      <span className="text-xs text-gray-500">{r.lastLogin ? new Date(r.lastLogin).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
    )},
  ]

  const toggleClinic = (id: string) => {
    setForm(p => {
      const exists = p.clinicIds.includes(id)
      if (exists) return { ...p, clinicIds: p.clinicIds.filter(x => x !== id) }
      return { ...p, clinicIds: [...p.clinicIds, id] }
    })
  }

  return (
    <div>
      <PageHeader
        title="Manajemen Users"
        subtitle="Kelola akun pengguna dan hak akses cabang sistem"
        icon={<FiUsers className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd}
        addLabel="Tambah User"
        count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Users']}
      />

      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama, email, username..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada pengguna. Tambahkan pengguna pertama."
        extraFilters={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-all"
          >
            <option value="">Semua Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
          </select>
        }
      />

      <MasterModal
        isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Tambah User Baru'}
        subtitle={editing ? `Mengedit: ${editing.name}` : 'Lengkapi data pengguna dan cabang'}
        size="lg"
      >
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Data Section */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nama Lengkap *', key: 'name', type: 'text', placeholder: 'John Doe', full: true },
                  { label: 'Email *', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  { label: 'Username *', key: 'username', type: 'text', placeholder: 'johndoe' },
                  { label: editing ? 'Password Baru (kosongkan jika tetap)' : 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
                  { label: 'No. Telepon', key: 'phone', type: 'tel', placeholder: '08xxxxxxxxxx' },
                ].map((f) => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium bg-white"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">{form.isActive ? 'Akun Aktif' : 'Akun Nonaktif'}</span>
                </div>
              </div>
            </div>

            {/* Clinic Assignment Section */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col h-full">
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">Akses Cabang *</label>
              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {clinics.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="checkbox" 
                      checked={form.clinicIds.includes(c.id)}
                      onChange={() => toggleClinic(c.id)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" 
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-none mb-1">{c.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.code}</p>
                    </div>
                  </label>
                ))}
                {clinics.length === 0 && <p className="text-[10px] text-gray-400 italic text-center py-4">Belum ada cabang terdaftar</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-60">
              {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah User')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
