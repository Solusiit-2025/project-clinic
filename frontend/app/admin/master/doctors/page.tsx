'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { FiUserCheck, FiAlertCircle, FiLock, FiCamera, FiX, FiUser, FiEye, FiPhone, FiMail, FiBriefcase, FiCalendar, FiMapPin, FiEdit2 } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const UPLOADS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const EMPTY = { userId: '', licenseNumber: '', name: '', email: '', phone: '', specialization: '', departmentId: '', bio: '', yearsOfExperience: '', isActive: true, clinicId: '' }

type Doctor = {
  id: string; 
  name: string; 
  email?: string; 
  phone: string; 
  licenseNumber: string
  specialization: string; 
  departmentId?: string;
  department?: { 
    id: string; 
    name: string;
    clinic?: { id: string; name: string; code: string }
  };
  user?: { id: string; username: string };
  userId: string;
  profilePicture?: string;
  bio?: string;
  yearsOfExperience?: number; 
  isActive: boolean; 
  createdAt: string
}

type Dept = { 
  id: string; 
  name: string; 
  level: number;
  clinic?: { id: string; name: string; code: string }
}
type UnlinkedUser = { id: string; name: string; username: string }

const SPECIALIZATIONS = ['Umum','Gigi','Anak','Kandungan','Bedah','Dalam','Saraf','Mata','THT','Kulit','Jantung','Orthopedi','Radiologi','Anestesi','Jiwa','Rehab Medik','Gizi Klinik']

export default function DoctorsPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Dept[]>([])
  const [clinics, setClinics] = useState<{ id: string, name: string, code: string }[]>([])
  const [unlinkedUsers, setUnlinkedUsers] = useState<UnlinkedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Photo states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchDepts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/departments`, { headers })
      setDepartments(data)
    } catch { }
  }, [token, activeClinicId])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/master/clinics`, { headers })
      setClinics(data)
    } catch { }
  }, [token])

  const fetchUnlinked = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/users/unlinked-doctors`, { headers })
      setUnlinkedUsers(data)
    } catch { }
  }, [token, activeClinicId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (specFilter) params.specialization = specFilter
      if (deptFilter) params.departmentId = deptFilter
      const { data } = await axios.get(`${API}/doctors`, { headers, params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, specFilter, deptFilter, token, activeClinicId])

  useEffect(() => { 
    fetchData()
    fetchDepts()
    fetchClinics()
    fetchUnlinked()
  }, [fetchData, fetchDepts, fetchClinics, fetchUnlinked])

  const openAdd = () => { 
    setEditing(null); 
    setForm({ ...EMPTY, clinicId: activeClinicId || '' }); 
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(''); 
    setModalOpen(true) 
  }

  const openEdit = (r: Doctor) => {
    setEditing(r)
    setForm({ 
      userId: r.userId, 
      licenseNumber: r.licenseNumber, 
      name: r.name, 
      email: r.email || '', 
      phone: r.phone, 
      specialization: r.specialization, 
      departmentId: r.departmentId || '', 
      clinicId: r.department?.clinic?.id || '',
      bio: r.bio || '', 
      yearsOfExperience: String(r.yearsOfExperience || ''), 
      isActive: r.isActive 
    })
    setPreviewUrl(r.profilePicture ? `${UPLOADS_URL}${r.profilePicture}` : null)
    setSelectedFile(null)
    setError(''); 
    setModalOpen(true)
  }
  
  const openView = (r: Doctor) => {
    setViewingDoctor(r)
    setViewModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.licenseNumber || !form.phone || !form.specialization || !form.userId) {
      setError('Nama, No. SIP, telepon, spesialisasi, dan akun login wajib diisi'); return
    }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      if (selectedFile) {
        formData.append('photo', selectedFile)
      }

      if (editing) await axios.put(`${API}/doctors/${editing.id}`, formData, { 
        headers: { ...headers, 'Content-Type': 'multipart/form-data' } 
      })
      else await axios.post(`${API}/doctors`, formData, { 
        headers: { ...headers, 'Content-Type': 'multipart/form-data' } 
      })
      
      setModalOpen(false); fetchData(); fetchUnlinked()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Doctor) => {
    if (!confirm(`Hapus dokter "${r.name}"?`)) return
    try { await axios.delete(`${API}/doctors/${r.id}`, { headers }); fetchData(); fetchUnlinked() } catch { }
  }

  const columns: Column<Doctor>[] = [
    { key: 'name', label: 'Dokter', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center">
          {r.profilePicture ? (
            <img src={`${UPLOADS_URL}${r.profilePicture}`} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <FiUser className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">dr. {r.name}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
            <FiLock className="w-2.5 h-2.5" />
            <span>@{r.user?.username || 'no-account'}</span>
            <span className="text-gray-200">|</span>
            <span>SIP: {r.licenseNumber}</span>
          </div>
        </div>
      </div>
    )},
    { key: 'specialization', label: 'Spesialisasi', render: (r) => (
      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg uppercase tracking-tight">Poli {r.specialization}</span>
    )},
    { key: 'department', label: 'Unit / Departemen', mobileHide: true, render: (r) => {
      const isPusat = r.department?.clinic?.code === 'K001';
      const isBekasi = r.department?.clinic?.code === 'K002';
      const badgeClass = isPusat 
        ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
        : isBekasi 
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-gray-50 text-gray-400 border-gray-200";

      return (
        <div>
          <p className="text-xs font-semibold text-gray-600">
            {r.department?.name || <span className="text-gray-300 italic">Belum diset</span>}
          </p>
          {r.department?.clinic && (
            <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border ${badgeClass}`}>
              {r.department.clinic.code} - {r.department.clinic.name}
            </span>
          )}
        </div>
      )
    }},
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={(form as any)[key]} onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Tenaga Medis (Dokter)" subtitle="Kelola data dokter, spesialisasi, dan penempatan unit"
        icon={<FiUserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Dokter" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Dokter']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama dokter, SIP..."
        onView={openView} onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada data dokter."
        extraFilters={
          <div className="flex gap-2">
            <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary">
              <option value="">Semua Spesialisasi</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary max-w-[200px]">
              <option value="">Semua Unit</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {'-'.repeat(d.level)} {d.name} {d.clinic ? `(${d.clinic.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Profil Dokter' : 'Registrasi Dokter Baru'} size="lg">
        <div className="space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 hover:border-primary/30 transition-all group relative overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="relative z-10 flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-white shadow-xl shadow-gray-200/50 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform border-4 border-white"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <FiCamera className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Foto</span>
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
              >
                {previewUrl ? 'Ubah Foto' : 'Unggah Foto'}
              </button>
              {previewUrl && (
                <button 
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null) }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="mt-3 text-[10px] text-gray-400 font-medium italic">Format yang didukung: JPG, PNG, WEBP. Maks 5MB.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FiLock className="w-3.5 h-3.5" /> Akun Login (User) *
              </label>
              <select 
                value={form.userId} 
                onChange={(e) => setForm(p => ({ ...p, userId: e.target.value }))}
                disabled={!!editing}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium shadow-sm transition-all disabled:bg-gray-50 disabled:text-gray-400"
              >
                {!editing ? (
                  <>
                    <option value="">-- Pilih Akun User --</option>
                    {unlinkedUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))}
                  </>
                ) : (
                  <option value={editing.userId}>{editing.name} (@{editing.user?.username})</option>
                )}
              </select>
              {!editing && <p className="mt-1 text-[10px] text-gray-400 font-medium italic">Hanya menampilkan user dengan role DOCTOR yang belum memiliki profil.</p>}
            </div>

            <div className="sm:col-span-2">{field('Nama Lengkap (dengan gelar) *', 'name', 'text', 'cth: dr. Ahmad Fauzi, Sp.PD')}</div>
            {field('Nomor SIP (Lisensi) *', 'licenseNumber', 'text', 'SIP/12345/2024')}
            {field('No. Telepon / WhatsApp *', 'phone', 'tel', '08xxxxxxxxxx')}
            {field('Email Profesional', 'email', 'email', 'dokter@klinik.com')}
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Spesialisasi *</label>
              <select value={form.specialization} onChange={(e) => setForm(p => ({ ...p, specialization: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white font-medium shadow-sm transition-all">
                <option value="">-- Pilih Spesialisasi --</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                Cabang / Klinik *
              </label>
              <select value={form.clinicId} onChange={(e) => setForm(p => ({ ...p, clinicId: e.target.value, departmentId: '' }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white font-medium shadow-sm transition-all">
                <option value="">-- Pilih Cabang --</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Unit Penempatan (Departemen)</label>
              <select value={form.departmentId} onChange={(e) => setForm(p => ({ ...p, departmentId: e.target.value }))}
                disabled={!form.clinicId}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white font-medium shadow-sm transition-all disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">-- Pilih Unit --</option>
                {departments
                  .filter(d => d.clinic?.id === form.clinicId)
                  .map(d => (
                  <option key={d.id} value={d.id}>
                    {'-'.repeat(d.level)} {d.name}
                  </option>
                ))}
              </select>
              {form.clinicId && departments.filter(d => d.clinic?.id === form.clinicId).length === 0 && (
                <p className="mt-1 text-[10px] text-orange-500 font-medium italic">Belum ada unit terdaftar di cabang ini.</p>
              )}
            </div>

            {field('Pengalaman Kerja (tahun)', 'yearsOfExperience', 'number', '5')}
            
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
              <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">{form.isActive ? 'Aktif Praktek' : 'Cuti / Tidak Aktif'}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Profil / Biografi Singkat</label>
            <textarea value={form.bio} onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Keahlian khusus, riwayat pendidikan, atau pesan untuk pasien..." rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium resize-none shadow-sm" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-60 active:scale-95">{saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Daftarkan Dokter')}</button>
          </div>
        </div>
      </MasterModal>

      {/* Profile Detail Modal - Ultra Premium Luxury Redesign */}
      <MasterModal
        isOpen={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        title=""
        size="lg"
      >
        {viewingDoctor && (
          <div className="space-y-0 overflow-hidden -m-4 sm:-m-6 bg-[#fcfcfd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header: Dynamic Holographic Mesh */}
            <div className="h-40 sm:h-48 relative bg-slate-900" 
                 style={{ 
                   backgroundImage: `
                     radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.45) 0px, transparent 50%), 
                     radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.45) 0px, transparent 50%),
                     radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.25) 0px, transparent 50%),
                     radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.2) 0px, transparent 50%)
                   ` 
                 }}>
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
              
              {/* Profile Image & Status Glow */}
              <div className="absolute -bottom-14 left-8 sm:left-12">
                <div className="relative group">
                  {/* Subtle Glow Backdrop */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-purple-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                  
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] bg-white p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                    <div className="w-full h-full rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                      {viewingDoctor.profilePicture ? (
                        <img src={`${UPLOADS_URL}${viewingDoctor.profilePicture}`} alt={viewingDoctor.name} 
                             className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                      ) : (
                        <FiUser className="w-16 h-16 text-slate-200" />
                      )}

                    </div>
                  </div>

                  {/* High-End Status Indicator */}
                  {viewingDoctor.isActive && (
                    <div className="absolute bottom-5 right-5 w-7 h-7 bg-white rounded-full p-1.5 shadow-2xl ring-1 ring-black/5 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                      <div className="w-full h-full bg-green-500 rounded-full animate-pulse shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content: Glassmorphism Era */}
            <div className="pt-16 sm:pt-20 px-8 sm:px-12 pb-8 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600/70 py-1 px-3 bg-indigo-50/50 rounded-full border border-indigo-100/50">Medical Specialist</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">ID: DOC-{viewingDoctor.id.slice(-5).toUpperCase()}</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.04em] leading-tight">dr. {viewingDoctor.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold ring-1 ring-slate-200/50">
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                       Poli Spesialis {viewingDoctor.specialization}
                    </div>

                    {viewingDoctor.department?.clinic && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${
                        viewingDoctor.department.clinic.code === 'K001' ? 'bg-indigo-50 text-indigo-700 ring-indigo-100' : 'bg-amber-50 text-amber-700 ring-amber-100'
                      }`}>
                         <FiMapPin className="w-3 h-3" />
                         {viewingDoctor.department.clinic.name}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => { setViewModalOpen(false); openEdit(viewingDoctor); }} 
                        className="group relative flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-black text-white text-[10px] font-black rounded-2xl transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>Update Profile Data</span>
                </button>
              </div>


              {/* Stats: Advanced Glassmorphism Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative bg-white/40 backdrop-blur-3xl p-5 rounded-3xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:bg-white/60 transition-all duration-500 ring-1 ring-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <FiBriefcase className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Years of Practice</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">{viewingDoctor.yearsOfExperience || 0} Years+</p>
                </div>
                
                <div className="group relative bg-white/40 backdrop-blur-3xl p-5 rounded-3xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:bg-white/60 transition-all duration-500 ring-1 ring-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-purple-50/80 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Certification</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-tight">{viewingDoctor.licenseNumber}</p>
                </div>
 
                <div className="group relative bg-white/40 backdrop-blur-3xl p-5 rounded-3xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:bg-white/60 transition-all duration-500 ring-1 ring-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-rose-50/80 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Assigned Unit</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-tight">{viewingDoctor.department?.name || 'Central Unit'}</p>
                </div>
              </div>


              {/* Bio & Philosophy: Editorial Look */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span className="w-8 h-[2px] bg-indigo-500" />
                    Clinical Biography
                  </h4>
                  <p className="text-sm sm:text-base text-slate-600 leading-[1.6] font-medium italic font-serif opacity-90">
                    "{viewingDoctor.bio || `dr. ${viewingDoctor.name} is recognized for their commitment to evidence-based medicine and patient-centric care. They specialize in ${viewingDoctor.specialization}, ensuring that every visitor to ${viewingDoctor.department?.name || 'our facility'} receives unparalleled medical attention and guidance.`}"
                  </p>
                </div>


                {/* Contact Strip: Floating Style */}
                <div className="lg:col-span-4 space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Channel</h4>
                   <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FiPhone className="w-5 h-5" />
                         </div>
                         <p className="text-sm font-black text-slate-800 tracking-tight">{viewingDoctor.phone}</p>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FiMail className="w-5 h-5" />
                         </div>
                         <p className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[150px]">{viewingDoctor.email || '—'}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </MasterModal>
    </div>
  )
}
