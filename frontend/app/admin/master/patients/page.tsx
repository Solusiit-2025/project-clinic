'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiUsers, FiAlertCircle, FiRefreshCw, FiPhone, FiMapPin, FiCalendar, FiUser, FiInfo, FiPlus, FiActivity, FiLock } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { 
  medicalRecordNo: '', 
  name: '', 
  email: '', 
  phone: '', 
  address: '', 
  city: '', 
  province: '', 
  zipCode: '', 
  dateOfBirth: '', 
  gender: 'M', 
  bloodType: '-', 
  identityType: 'KTP', 
  identityNumber: '', 
  emergencyContact: '', 
  emergencyPhone: '', 
  allergies: '', 
  bpjsNumber: '',
  insuranceName: '',
  isActive: true 
}

type Patient = typeof EMPTY & { id: string; createdAt: string; updatedAt: string }

export default function PatientsPage() {
  const { user } = useAuthStore()
  const isAllowed = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR'
  const [data, setData] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      const res = await api.get('/master/patients', { params })
      // Extract the data array from the paginated response object if necessary
      const patientsArray = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setData(patientsArray)
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchNextMR = useCallback(async () => {
    try {
      const { data } = await api.get('/master/patients/next-mr')
      setForm(p => ({ ...p, medicalRecordNo: data.nextCode }))
    } catch (e) { console.error('Failed to fetch next MR No', e) }
  }, [])

  const openAdd = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setError(''); 
    setModalOpen(true)
    fetchNextMR()
  }

  const openEdit = (r: Patient) => {
    setEditing(r)
    setForm({ 
      ...r, 
      dateOfBirth: r.dateOfBirth ? r.dateOfBirth.substring(0, 10) : '',
      allergies: r.allergies || '',
      emergencyContact: r.emergencyContact || '',
      emergencyPhone: r.emergencyPhone || '',
      zipCode: r.zipCode || '',
      city: r.city || '',
      province: r.province || '',
      address: r.address || '',
      email: r.email || ''
    })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.medicalRecordNo || !form.name || !form.phone) { 
      setError('No. RM, Nama, dan No. HP wajib diisi')
      return 
    }
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/master/patients/${editing.id}`, form)
      else await api.post('/master/patients', form)
      
      // Reset flow: Clear search and close modal FIRST, then fetch
      setSearch('')
      setModalOpen(false)
      
      // Delay fetch slightly to ensure DB has indexed if needed, and search state has cleared
      setTimeout(() => fetchData(), 100)
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Patient) => {
    if (!confirm(`Hapus data pasien "${r.name}"?`)) return
    try { await api.delete(`/master/patients/${r.id}`); fetchData() } catch { }
  }

  const columns: Column<Patient>[] = [
    { key: 'medicalRecordNo', label: 'No. RM', render: (r) => (
      <div className="flex flex-col">
        <span className="text-xs font-black font-mono text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 w-fit">{r.medicalRecordNo}</span>
        <span className="text-[10px] text-gray-400 mt-1 font-bold">{new Date(r.createdAt).toLocaleDateString('id-ID')}</span>
      </div>
    )},
    { key: 'name', label: 'Nama Pasien', render: (r) => (
      <div className="flex items-center gap-3 py-1">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-sm ${r.gender === 'F' ? 'bg-rose-500' : 'bg-blue-500'}`}>
          {r.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 tracking-tight">{r.name}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.gender === 'M' ? 'Laki-laki' : 'Perempuan'} • {r.dateOfBirth ? `${new Date().getFullYear() - new Date(r.dateOfBirth).getFullYear()} Thn` : '-'}</span>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Kontak', render: (r) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-gray-700">
          <FiPhone className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-bold leading-none">{r.phone}</span>
        </div>
        {r.email && (
          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{r.email}</span>
        )}
      </div>
    )},
    { key: 'bloodType', label: 'Gol Darah', render: (r) => (
      <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm ${r.bloodType !== '-' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
        {r.bloodType}
      </span>
    )},
    { key: 'bpjsNumber', label: 'Asuransi', render: (r) => (
      <div className="flex flex-col">
        {r.bpjsNumber ? (
           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-fit">BPJS: {r.bpjsNumber}</span>
        ) : r.insuranceName ? (
           <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md w-fit">{r.insuranceName}</span>
        ) : (
           <span className="text-[10px] font-bold text-gray-300">UMUM / CASH</span>
        )}
      </div>
    )},
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input 
        type={type} value={(form as any)[key]} 
        onChange={(e) => setForm(p => ({...p, [key]: e.target.value}))} 
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300 text-gray-700" 
      />
    </div>
  )

  if (!isAllowed) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <FiLock className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Akses Terbatas</h2>
        <p className="text-sm text-gray-400 max-w-md">Maaf, halaman Database Pasien hanya dapat diakses oleh Super Admin, Admin, dan Dokter.</p>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Database Pasien" subtitle="Kelola data master pasien dan riwayat rekam medis"
        icon={<FiUsers className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Pasien Baru" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Pasien']}
      />
      
      <DataTable
        data={data} columns={columns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama, No. RM, No. HP, atau No. KTP..."
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Belum ada data pasien terdaftar."
      />

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'} size="lg">
        <div className="space-y-6">
          {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</motion.div>}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Identity Group */}
            <div className="md:col-span-3 pb-2 border-b border-gray-50 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Identitas Utama</h4>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                <span>No. Rekam Medis *</span>
                <button type="button" onClick={fetchNextMR} className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                  <FiRefreshCw className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">Gen</span>
                </button>
              </label>
              <input value={form.medicalRecordNo} onChange={(e) => setForm(p => ({...p, medicalRecordNo: e.target.value}))}
                placeholder="RM-20240409-0001" className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-black font-mono text-primary" />
            </div>

            <div className="md:col-span-2">{inp('Nama Lengkap Pasien *', 'name', 'text', 'Sesuai KTP')}</div>

            <div>
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</label>
               <div className="grid grid-cols-2 gap-2">
                  {['M', 'F'].map(g => (
                    <button 
                      key={g} type="button" 
                      onClick={() => setForm(p => ({ ...p, gender: g }))}
                      className={`py-2.5 rounded-2xl border text-[10px] font-black transition-all ${form.gender === g ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {g === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                    </button>
                  ))}
               </div>
            </div>

            {inp('Tanggal Lahir', 'dateOfBirth', 'date')}
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Golongan Darah</label>
              <select value={form.bloodType || ''} onChange={(e) => setForm(p => ({...p, bloodType: e.target.value}))}
                className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-black text-gray-700">
                {['-', 'A', 'B', 'AB', 'O'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contact Group */}
            <div className="md:col-span-3 pb-2 border-b border-gray-50 mt-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Kontak & Alamat</h4>
            </div>

            {inp('No. Handphone (WhatsApp) *', 'phone', 'tel', '0812xxxx')}
            {inp('Email (Opsional)', 'email', 'email', 'pasien@mail.com')}
            
            <div className="md:col-span-2">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Domisili</label>
               <textarea value={form.address} onChange={(e) => setForm(p => ({...p, address: e.target.value}))} rows={2}
                 className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-bold placeholder:text-gray-300 text-gray-700 resize-none" placeholder="Alamat lengkap..." />
            </div>

            {inp('Kota/Kab', 'city')}
            {inp('Provinsi', 'province')}

            {/* Medical Info Group */}
            <div className="md:col-span-3 pb-2 border-b border-gray-50 mt-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Informasi Medis & Darurat</h4>
            </div>

            <div className="md:col-span-3">
               <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FiActivity className="w-3 h-3" /> Riwayat Alergi</label>
               <textarea value={form.allergies} onChange={(e) => setForm(p => ({...p, allergies: e.target.value}))} rows={2}
                 className="w-full px-4 py-3 text-sm border border-rose-100 bg-rose-50/10 rounded-2xl focus:outline-none focus:border-rose-400 font-bold placeholder:text-gray-300 text-gray-700 resize-none" placeholder="Sebutkan alergi obat, makanan, dll (Jika ada)..." />
            </div>

            {inp('Kontak Darurat', 'emergencyContact', 'text', 'Nama Keluarga')}
            {inp('No. HP Darurat', 'emergencyPhone', 'tel', '08xxxx')}
            
            {/* Insurance Group */}
            <div className="md:col-span-3 pb-2 border-b border-gray-50 mt-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Jaminan Kesehatan / Asuransi</h4>
            </div>

            {inp('No. Kartu BPJS', 'bpjsNumber', 'text', '000xxxxxxxx')}
            <div className="md:col-span-2">{inp('Nama Asuransi Lainnya', 'insuranceName', 'text', 'cth: Prudential, Allianz (Kosongkan jika hanya BPJS)')}</div>

          </div>

          <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all active:scale-95">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 disabled:opacity-60 transition-all active:scale-95">
                {saving ? 'SEDANG MENULIS DATA...' : (editing ? 'PERBARUI DATA PASIEN' : 'REGISTRASI PASIEN')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
