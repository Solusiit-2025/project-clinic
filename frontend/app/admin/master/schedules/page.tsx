'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiClock, FiAlertCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']
const EMPTY = { doctorId: '', dayOfWeek: 'Senin', startTime: '08:00', endTime: '12:00', isActive: true }

type Schedule = {
  id: string; doctorId: string; dayOfWeek: string; startTime: string; endTime: string; isActive: boolean
  doctor?: { name: string; specialization: string }
}
type Doctor = { id: string; name: string; specialization: string }

export default function SchedulesPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<Schedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorFilter, setDoctorFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [schRes, docRes] = await Promise.all([
        axios.get(`${API}/schedules`, { headers, params: doctorFilter ? { doctorId: doctorFilter } : {} }),
        axios.get(`${API}/doctors`, { headers }),
      ])
      setData(schRes.data); setDoctors(docRes.data)
    } finally { setLoading(false) }
  }, [doctorFilter, token, activeClinicId])

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
      if (editing) await axios.put(`${API}/schedules/${editing.id}`, form, { headers })
      else await axios.post(`${API}/schedules`, form, { headers })
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Schedule) => {
    if (!confirm(`Hapus jadwal ini?`)) return
    try { await axios.delete(`${API}/schedules/${r.id}`, { headers }); fetchData() } catch { }
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
      <div>
        <p className="text-sm font-bold text-gray-900">dr. {r.doctor?.name || '—'}</p>
        <p className="text-xs text-gray-400">Poli {r.doctor?.specialization || ''}</p>
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
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Jadwal Dokter" subtitle="Kelola jadwal praktek dan jam operasional dokter"
        icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd} addLabel="Tambah Jadwal" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Jadwal Dokter']}
      />
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
