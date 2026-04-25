'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FiUserCheck, FiAlertCircle, FiLock, FiCamera, FiX, FiUser, FiEye, FiPhone, FiMail, FiBriefcase, FiCalendar, FiMapPin, FiEdit2, FiArrowRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import DeleteConfirmModal from '@/components/admin/master/DeleteConfirmModal'

const UPLOADS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004'
const EMPTY = { 
  userId: '', licenseNumber: '', name: '', email: '', phone: '', 
  specialization: '', departmentIds: [] as string[], bio: '', 
  yearsOfExperience: '', isActive: true, clinicIds: [] as string[], queueCode: '' 
}

type Doctor = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  licenseNumber: string
  specialization: string;
  departments: {
    id: string;
    name: string;
    clinic?: { id: string; name: string; code: string }
  }[];
  user?: { id: string; username: string; clinics: { clinicId: string }[] };
  userId: string;
  profilePicture?: string;
  bio?: string;
  yearsOfExperience?: number;
  isActive: boolean;
  queueCode?: string;
  createdAt: string
}

type Dept = {
  id: string;
  name: string;
  level: number;
  clinic?: { id: string; name: string; code: string }
}
type UnlinkedUser = { id: string; name: string; username: string }

const SPECIALIZATIONS = ['Umum', 'Gigi', 'Anak', 'Kandungan', 'Bedah', 'Dalam', 'Saraf', 'Mata', 'THT', 'Kulit', 'Jantung', 'Orthopedi', 'Radiologi', 'Anestesi', 'Jiwa', 'Rehab Medik', 'Gizi Klinik']

export default function DoctorsPage() {
  const { activeClinicId } = useAuthStore()
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Doctor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Photo states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const fetchDepts = useCallback(async () => {
    try {
      const { data } = await api.get('/master/departments', { params: { allClinics: true } })
      setDepartments(data)
    } catch { }
  }, [])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await api.get('/master/clinics')
      setClinics(data)
    } catch { }
  }, [])

  const fetchUnlinked = useCallback(async () => {
    try {
      const { data } = await api.get('/master/users/unlinked-doctors')
      setUnlinkedUsers(data)
    } catch { }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (specFilter) params.specialization = specFilter
      if (deptFilter) params.departmentId = deptFilter
      const { data } = await api.get('/master/doctors', { params })
      setData(data)
    } finally { setLoading(false) }
  }, [search, specFilter, deptFilter, activeClinicId])

  useEffect(() => {
    fetchData()
    fetchDepts()
    fetchClinics()
    fetchUnlinked()
  }, [fetchData, fetchDepts, fetchClinics, fetchUnlinked])

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, clinicIds: activeClinicId ? [activeClinicId] : [] });
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
      departmentIds: r.departments?.map(d => d.id) || [],
      clinicIds: r.user?.clinics?.map(c => c.clinicId) || r.departments?.map(d => d.clinic?.id).filter(Boolean) as string[] || [],
      bio: r.bio || '',
      yearsOfExperience: String(r.yearsOfExperience || ''),
      isActive: r.isActive,
      queueCode: r.queueCode || ''
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
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      })
      if (selectedFile) {
        formData.append('photo', selectedFile)
      }

      if (editing) await api.put(`/master/doctors/${editing.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      else await api.post('/master/doctors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setModalOpen(false); fetchData(); fetchUnlinked()
      toast.success(editing ? 'Data dokter diperbarui' : 'Dokter baru ditambahkan')
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = (r: Doctor) => {
    setItemToDelete(r)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteModalOpen(false)
    setIsDeleting(true)
    try { 
      await api.delete(`/master/doctors/${itemToDelete.id}`)
      fetchData()
      fetchUnlinked() 
      toast.success('Data dokter berhasil dihapus')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menghapus dokter')
    } finally {
      setIsDeleting(false)
      setItemToDelete(null)
    }
  }

  const columns: Column<Doctor>[] = [
    {
      key: 'name', label: 'Dokter', render: (r) => (
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
      )
    },
    {
      key: 'queueCode', label: 'Initial', render: (r) => (
        <div className="flex flex-col items-center">
          <span className="text-xs font-black bg-orange-600 text-white px-3 py-1.5 rounded-xl shadow-sm border border-orange-500/20 tracking-widest min-w-[40px] text-center">
            {r.queueCode || r.name.charAt(0).toUpperCase()}
          </span>
          <span className="text-[9px] font-black text-gray-300 mt-1 uppercase tracking-tighter">Prefix Antrean</span>
        </div>
      )
    },
    {
      key: 'specialization', label: 'Spesialisasi', render: (r) => (
        <div>
          <p className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tight inline-block mb-1">Poli {r.specialization}</p>
          <p className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
            <FiBriefcase className="w-2.5 h-2.5" /> {r.yearsOfExperience || 0} th Pengalaman
          </p>
        </div>
      )
    },
    {
      key: 'phone', label: 'Kontak', mobileHide: true, render: (r) => (
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 tracking-tight">
            <FiPhone className="w-3 h-3 text-green-500" /> {r.phone}
          </p>
          <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5 lowercase italic tracking-tight">
            <FiMail className="w-3 h-3" /> {r.email || '—'}
          </p>
        </div>
      )
    },
    {
      key: 'department', label: 'Unit & Cabang', mobileHide: true, render: (r) => {
        return (
          <div className="flex flex-col gap-2">
            {r.departments?.map((dept, i) => (
              <div key={i} className="flex flex-col border-l-2 border-primary/20 pl-2 py-0.5">
                <span className="text-[10px] font-bold text-gray-600 truncate max-w-[150px]">
                  {dept.name}
                </span>
                {dept.clinic && (
                  <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md border w-fit uppercase tracking-widest ${dept.clinic.code === 'K001' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                    {dept.clinic.code} - {dept.clinic.name}
                  </span>
                )}
              </div>
            ))}
            {(!r.departments || r.departments.length === 0) && <span className="text-gray-300 italic text-[10px]">Belum ada penempatan</span>}
          </div>
        )
      }
    },
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
            <Link href="/admin/master/schedules" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm">
               <FiCalendar className="w-3.5 h-3.5" /> Lihat Jadwal
            </Link>
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
            {field('Kode Antrean (Inisial) *', 'queueCode', 'text', 'cth: AD, AI, B (Digunakan untuk Prefix No Antrean)')}
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                <FiMapPin className="text-primary w-4 h-4" /> Cabang / Klinik Penugasan (Bisa Pilih &gt; 1) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                {clinics.map(c => (
                  <label key={c.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:bg-white hover:border-gray-200 transition-all cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={form.clinicIds.includes(c.id)}
                      onChange={(e) => {
                        const ids = e.target.checked 
                          ? [...form.clinicIds, c.id] 
                          : form.clinicIds.filter(id => id !== c.id)
                        setForm(p => ({ ...p, clinicIds: ids }))
                      }} 
                      className="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary/20 transition-all"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-700 group-hover:text-primary transition-colors">{c.name}</span>
                      <span className="text-[9px] font-black text-gray-400 leading-none">{c.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                <FiBriefcase className="text-primary w-4 h-4" /> Unit Penempatan (Departemen) *
              </label>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[220px] overflow-y-auto p-4 space-y-4">
                  {form.clinicIds.length === 0 ? (
                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <FiAlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pilih Cabang Terlebih Dahulu</p>
                    </div>
                  ) : (
                    clinics.filter(c => form.clinicIds.includes(c.id)).map(clinic => (
                      <div key={clinic.id} className="space-y-2">
                        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                          <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{clinic.code}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{clinic.name}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {departments
                            .filter(d => !d.clinic || d.clinic?.id === clinic.id)
                            .map(d => (
                              <label key={d.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100 group">
                                <input 
                                  type="checkbox"
                                  checked={form.departmentIds.includes(d.id)}
                                  onChange={(e) => {
                                    const ids = e.target.checked
                                      ? [...form.departmentIds, d.id]
                                      : form.departmentIds.filter(id => id !== d.id)
                                    setForm(p => ({ ...p, departmentIds: ids }))
                                  }}
                                  className="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary/20 transition-all"
                                />
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-gray-600 group-hover:text-primary transition-colors">
                                    {'-'.repeat(d.level)} {d.name}
                                  </span>
                                  {!d.clinic && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Unit Global (Semua Cabang)</span>}
                                </div>
                              </label>
                            ))}
                          {departments.filter(d => !d.clinic || d.clinic?.id === clinic.id).length === 0 && (
                            <p className="text-[10px] text-orange-500 font-medium italic p-2">Belum ada unit terdaftar di cabang ini.</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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

                    {(viewingDoctor as any).departments?.[0]?.clinic && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${(viewingDoctor as any).departments[0].clinic.code === 'K001' ? 'bg-indigo-50 text-indigo-700 ring-indigo-100' : 'bg-amber-50 text-amber-700 ring-amber-100'
                        }`}>
                        <FiMapPin className="w-3 h-3" />
                        {(viewingDoctor as any).departments[0].clinic.name}
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
                  <div className="w-10 h-10 rounded-xl bg-orange-50/80 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <FiArrowRight className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Queue Code</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-tight">{viewingDoctor.queueCode || viewingDoctor.name.charAt(0).toUpperCase()}</p>
                </div>

                <div className="group relative bg-white/40 backdrop-blur-3xl p-5 rounded-3xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:bg-white/60 transition-all duration-500 ring-1 ring-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-rose-50/80 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Assigned Unit</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-tight">{(viewingDoctor as any).departments?.[0]?.name || 'Central Unit'}</p>
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
                    "{viewingDoctor.bio || `dr. ${viewingDoctor.name} is recognized for their commitment to evidence-based medicine and patient-centric care. They specialize in ${viewingDoctor.specialization}, ensuring that every visitor to ${(viewingDoctor as any).departments?.[0]?.name || 'our facility'} receives unparalleled medical attention and guidance.`}"
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

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Data Dokter"
        message="Apakah Anda yakin ingin menghapus data dokter ini? Akun user yang terhubung akan tetap ada namun tidak lagi tertaut ke profil dokter."
        itemName={itemToDelete ? `dr. ${itemToDelete.name}` : ''}
        loading={isDeleting}
      />
    </div>
  )
}
