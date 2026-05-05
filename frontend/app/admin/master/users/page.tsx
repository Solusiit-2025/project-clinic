'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { FiUsers, FiAlertCircle, FiMail, FiUser, FiLock, FiPhone, FiCheck, FiShield, FiBriefcase, FiMapPin } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, RoleBadge } from '@/components/admin/master/StatusBadge'

const ROLES = ['ADMIN','DOCTOR','RECEPTIONIST','FARMASI','ACCOUNTING','LOGISTIC','STAFF']
const ALL_ROLES = ['SUPER_ADMIN', ...ROLES]

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
      // Filter out SUPER_ADMIN role
      const filtered = usersArray.filter((u: User) => u.role !== 'SUPER_ADMIN')
      setData(filtered)
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
        <div className="space-y-6 pt-2">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl text-sm text-red-700 shadow-sm animate-shake">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Main Form Data */}
            <div className="lg:col-span-8 space-y-6">
              {/* Account Security Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Informasi Autentikasi</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      <FiUser className="w-3 h-3 text-primary" /> Username *
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={form.username || ''}
                        onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="johndoe"
                        className="w-full pl-4 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      <FiLock className="w-3 h-3 text-primary" /> {editing ? 'Password Baru' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      value={form.password || ''}
                      onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Profil Pengguna</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    <FiBriefcase className="w-3 h-3 text-indigo-500" /> Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: John Doe, M.Kes"
                    className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      <FiMail className="w-3 h-3 text-indigo-500" /> Email *
                    </label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      <FiPhone className="w-3 h-3 text-indigo-500" /> WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="081234567890"
                      className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    <FiShield className="w-3 h-3 text-amber-500" /> Hak Akses / Role *
                  </label>
                  <select
                    value={form.role || ''}
                    onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-3 text-sm bg-amber-50/30 border border-amber-100 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-black text-amber-700 cursor-pointer appearance-none uppercase tracking-widest"
                  >
                    {ROLES.map(r => <option key={r} value={r} className="font-bold text-gray-700">{r.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm mt-2 group hover:shadow-md transition-all">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Status Akses Akun</span>
                    <span className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${form.isActive ? 'text-primary' : 'text-gray-400'}`}>
                      {form.isActive ? 'Aktif & Dapat Login' : 'Akun Terkunci'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-16 h-8 rounded-full p-1 transition-all duration-500 ease-in-out shadow-inner ${
                      form.isActive 
                        ? 'bg-gradient-to-r from-primary to-blue-600 shadow-primary/20' 
                        : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-full h-full flex items-center justify-between px-1.5 text-[10px] font-black text-white transition-opacity duration-300 ${form.isActive ? 'opacity-100' : 'opacity-0'}`}>
                       <FiCheck className="w-3 h-3" />
                       <span className="sr-only">ON</span>
                    </div>
                    <div className={`absolute inset-y-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
                      form.isActive ? 'translate-x-8' : 'translate-x-0'
                    }`}>
                       {form.isActive ? (
                         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                       ) : (
                         <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                       )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Clinic Assignment Section */}
            <div className="lg:col-span-4 flex flex-col">
               <div className="bg-gray-50/50 rounded-[2.5rem] p-6 border border-gray-100 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <FiMapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none mb-1">Akses Cabang</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Minimal pilih satu cabang</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar flex-1">
                    {clinics.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => toggleClinic(c.id)}
                        className={`group p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                          form.clinicIds.includes(c.id) 
                            ? 'bg-white border-primary shadow-lg shadow-primary/10' 
                            : 'bg-white/50 border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {form.clinicIds.includes(c.id) && (
                          <div className="absolute top-0 right-0 w-8 h-8 bg-primary text-white flex items-center justify-center rounded-bl-2xl">
                            <FiCheck className="w-4 h-4" />
                          </div>
                        )}
                        <div className="relative">
                          <p className={`text-sm font-black transition-colors ${form.clinicIds.includes(c.id) ? 'text-primary' : 'text-gray-700'}`}>{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-gray-400 transition-colors">{c.code}</span>
                            {form.clinicIds.includes(c.id) && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    {clinics.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                        <FiMapPin className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-bold">Belum ada cabang</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-100 mt-4">
            <button 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-transparent"
            >
              Batalkan
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-[2] py-4 bg-primary text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {saving ? 'Proses Sinkronisasi...' : (editing ? 'Perbarui Akses Pengguna' : 'Inisialisasi User Baru')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
