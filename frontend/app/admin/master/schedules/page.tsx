'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiClock, FiAlertCircle, FiGrid, FiList, FiChevronRight, FiUser, FiCalendar, FiPlus, FiMoreVertical, FiEdit3, FiTrash2 } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'

const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']
const EMPTY = { doctorId: '', dayOfWeek: 'Senin', startTime: '08:00', endTime: '12:00', isActive: true }

type Schedule = {
  id: string; doctorId: string; dayOfWeek: string; startTime: string; endTime: string; isActive: boolean; clinicId: string
  doctor?: { name: string; specialization: string; profilePicture?: string | null }
  clinic?: { name: string; code: string }
}
type Doctor = { id: string; name: string; specialization: string; profilePicture?: string | null }

export default function SchedulesPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<Schedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorFilter, setDoctorFilter] = useState('')
  const [clinicFilter, setClinicFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [schRes, docRes, cliRes] = await Promise.all([
        api.get('/master/schedules', { params: { doctorId: doctorFilter, clinicId: clinicFilter } }),
        api.get('/master/doctors'),
        api.get('/master/clinics')
      ])
      setData(schRes.data)
      setDoctors(docRes.data)
      setClinics(cliRes.data)
    } finally { setLoading(false) }
  }, [doctorFilter, clinicFilter, activeClinicId])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true) }
  const openEdit = (r: Schedule) => {
    setEditing(r)
    setForm({ doctorId: r.doctorId, dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime, isActive: r.isActive })
    setError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.doctorId) { setError('Pilih dokter terlebih dahulu'); return }
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/master/schedules/${editing.id}`, form)
      else await api.post('/master/schedules', form)
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Schedule) => {
    if (!confirm(`Hapus jadwal ini?`)) return
    try { await api.delete(`/master/schedules/${r.id}`); fetchData() } catch { }
  }

  const dayOrder = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']
  const dayColors: Record<string, string> = {
    Senin: 'bg-blue-50 text-blue-700', Selasa: 'bg-purple-50 text-purple-700',
    Rabu: 'bg-emerald-50 text-emerald-700', Kamis: 'bg-orange-50 text-orange-700',
    Jumat: 'bg-cyan-50 text-cyan-700', Sabtu: 'bg-pink-50 text-pink-700',
    Minggu: 'bg-red-50 text-red-700',
  }

  const columns: Column<Schedule>[] = [
    { key: 'doctor', label: 'Dokter', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
          {r.doctor?.profilePicture ? (
            <img 
              src={`${process.env.NEXT_PUBLIC_API_URL}${r.doctor.profilePicture}`} 
              className="w-full h-full object-cover" 
              alt={r.doctor.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <FiUser className="w-4 h-4" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">dr. {r.doctor?.name || '—'}</p>
          <p className="text-xs text-gray-400">Poli {r.doctor?.specialization || ''}</p>
        </div>
      </div>
    )},
    { key: 'dayOfWeek', label: 'Hari', render: (r) => (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${dayColors[r.dayOfWeek] || 'bg-gray-50 text-gray-600'}`}>{r.dayOfWeek}</span>
    )},
    { key: 'time', label: 'Jam Praktek', render: (r) => (
      <div className="flex items-center gap-1.5">
        <FiClock className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{r.startTime} – {r.endTime}</span>
      </div>
    )},
    { key: 'clinic', label: 'Cabang', render: (r) => (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-wider">{r.clinic?.code || '—'}</span>
        <span className="text-xs font-bold text-gray-700">{r.clinic?.name || 'Semua Cabang'}</span>
      </div>
    )},
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  const gridData = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    DAYS.forEach(day => grouped[day] = [])
    data.forEach(s => {
      if (grouped[s.dayOfWeek]) grouped[s.dayOfWeek].push(s)
    })
    return grouped
  }, [data])

  return (
    <div className="w-full pb-20">
      <PageHeader
        title="Jadwal Dokter" subtitle="Kelola jadwal praktek dan jam operasional dokter"
        icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Jadwal" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Jadwal Dokter']}
      >
        <div className="flex items-center gap-3">
           <select 
             value={clinicFilter} 
             onChange={(e) => setClinicFilter(e.target.value)}
             className="text-[10px] font-black bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary uppercase tracking-widest shadow-sm ring-4 ring-gray-50"
           >
              <option value="">Semua Cabang</option>
              {clinics.map(c => <option key={c.id} value={c.id}>Klinik {c.name}</option>)}
           </select>

           <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                 <FiGrid /> Tampilan Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                 <FiList /> Tampilan List
              </button>
           </div>
        </div>
      </PageHeader>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <DataTable
              data={data} columns={columns} loading={loading}
              onEdit={openEdit} onDelete={handleDelete}
              emptyText="Belum ada jadwal dokter."
              extraFilters={
                <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
                  className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary">
                  <option value="">Semua Dokter</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>dr. {d.name}</option>)}
                </select>
              }
            />
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {DAYS.map(day => (
                <div key={day} className="space-y-2">
                  <div className={`p-2.5 rounded-2xl border-b-2 text-center ${dayColors[day] || 'bg-gray-50 text-gray-400 border-gray-200'} shadow-sm`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">{day}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {gridData[day].length === 0 ? (
                      <div className="py-6 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                         <p className="text-[8px] font-black text-gray-200 uppercase tracking-widest">Libur</p>
                      </div>
                    ) : (
                      gridData[day].map(s => (
                        <div key={s.id} className="group bg-white p-3.5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                          <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${dayColors[day]}`} />
                          
                          <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden border border-gray-50 shadow-inner">
                                  {s.doctor?.profilePicture ? (
                                    <img 
                                      src={`${process.env.NEXT_PUBLIC_API_URL}${s.doctor.profilePicture}`} 
                                      className="w-full h-full object-cover" 
                                      alt={s.doctor.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.doctor?.name || '') + '&background=random'
                                      }}
                                    />
                                  ) : (
                                    <FiUser className="w-4 h-4" />
                                  )}
                                </div>
                                <span className="text-[8px] font-black bg-indigo-50 text-primary px-2 py-1 rounded-lg border border-indigo-100/50 uppercase tracking-widest leading-none">
                                  {s.clinic?.code || 'PST'}
                                </span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(s)} className="p-1 px-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"><FiEdit3 className="w-3 h-3" /></button>
                                <button onClick={() => handleDelete(s)} className="p-1 px-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><FiTrash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-gray-900 text-[11px] leading-tight mb-0.5 truncate">dr. {s.doctor?.name}</h4>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate">{s.doctor?.specialization}</p>
                            
                            <div className="space-y-1.5 pt-2 border-t border-gray-50">
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-700 uppercase tracking-tighter">
                                 <FiClock className="w-3 h-3 text-primary" />
                                 {s.startTime} - {s.endTime}
                               </div>
                               <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">{s.clinic?.name || 'Cabang'}</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Jadwal' : 'Tambah Jadwal Praktek'} size="sm">
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700"><FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Dokter *</label>
            <select value={form.doctorId} onChange={(e) => setForm(p => ({...p, doctorId: e.target.value}))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium">
              <option value="">-- Pilih Dokter --</option>
              {doctors.map(d => <option key={d.id} value={d.id}>dr. {d.name} — {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Hari *</label>
            <select value={form.dayOfWeek} onChange={(e) => setForm(p => ({...p, dayOfWeek: e.target.value}))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white font-medium">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Jam Mulai *', 'startTime'],['Jam Selesai *', 'endTime']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{label}</label>
                <input type="time" value={(form as any)[key]} onChange={(e) => setForm(p => ({...p, [key]: e.target.value}))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium" />
              </div>
            ))}
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
