'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { 
  FiCalendar, FiClock, FiPlus, FiSearch, FiCheckCircle, 
  FiXCircle, FiMessageSquare, FiUser, FiExternalLink, FiInfo,
  FiPhone, FiCalendar as FiCalendarIcon, FiEdit, FiTrash
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'
const MASTER_API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

const STATUS_COLORS: any = {
  scheduled: 'text-blue-600 bg-blue-50 border-blue-100',
  confirmed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'checked-in': 'text-purple-600 bg-purple-50 border-purple-100',
  cancelled: 'text-rose-600 bg-rose-50 border-rose-100',
  'no-show': 'text-gray-600 bg-gray-50 border-gray-100'
}

export default function AppointmentPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('') // Default empty to show all
  
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false) // Modal baru buat Konfirmasi
  const [showWaConfirm, setShowWaConfirm] = useState(false)
  const [showCancelWaConfirm, setShowCancelWaConfirm] = useState(false)
  const [showConfirmWaConfirm, setShowConfirmWaConfirm] = useState(false) // State WA Konfirmasi
  const [isEditing, setIsEditing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rescheduledData, setRescheduledData] = useState<any>(null)
  const [cancelledData, setCancelledData] = useState<any>(null)
  const [confirmedData, setConfirmedData] = useState<any>(null) // Data baut WA Konfirmasi
  const [cancelReason, setCancelReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '', // Kosongkan dulu buat hindari Hydration Error
    appDurationMin: 30,
    notes: '',
    newPatientName: '',
    newPatientPhone: '',
    newPatientDob: ''
  })

  // Inisialisasi Jam Lokal di Client Saja
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localIso = now.toISOString().substring(0, 16);
    setForm(prev => ({ ...prev, appointmentDate: localIso }));
  }, [])


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { search }
      if (dateFilter) {
          params.startDate = `${dateFilter}T00:00:00Z`
          params.endDate = `${dateFilter}T23:59:59Z`
      }

      const { data: res } = await api.get('/transactions/appointments', { 
        params
      })
      setData(res.data || [])
    } catch (e) {
      console.error('Failed to fetch appointments', e)
    } finally {
      setLoading(false)
    }
  }, [dateFilter, search])

  const fetchMasters = useCallback(async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        api.get('/master/doctors'),
        api.get('/master/patients', { params: { limit: 100 } })
      ])
      setDoctors(docRes.data || [])
      setPatients(patRes.data?.data || patRes.data || [])
    } catch (e) {
      console.error('Failed to fetch masters', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchMasters()
  }, [fetchData, fetchMasters])

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      let updatedAppt = null
      if (isEditing && selectedId) {
          const { data: res } = await api.put(`/transactions/appointments/${selectedId}`, {
            doctorId: form.doctorId,
            appointmentDate: form.appointmentDate,
            appDurationMin: form.appDurationMin,
            notes: form.notes
          })
          updatedAppt = res
          setRescheduledData(updatedAppt)
          setShowWaConfirm(true)
      } else {
          await api.post('/transactions/appointments', {
            ...form,
            clinicId: activeClinicId
          })
          setModalOpen(false)
          resetForm()
      }
      fetchData()
    } catch (e: any) {
      console.error(e)
      setError(e.response?.data?.message || 'Gagal menyimpan janji temu. Pastikan semua data terisi.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setSelectedId(null)
    setRescheduledData(null)
    setCancelledData(null)
    setConfirmedData(null)
    setShowWaConfirm(false)
    setShowCancelWaConfirm(false)
    setShowConfirmWaConfirm(false)
    setConfirmModalOpen(false)
    setCancelReason('')
    setForm({
      patientId: '',
      doctorId: '',
      appointmentDate: (() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().substring(0, 16);
      })(),
      appDurationMin: 30,
      notes: '',
      newPatientName: '',
      newPatientPhone: '',
      newPatientDob: ''
    })
  }

  const handleEdit = (appt: any) => {
    setIsEditing(true)
    setSelectedId(appt.id)
    setIsNewPatient(false)
    setShowWaConfirm(false)
    setForm({
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      appointmentDate: (() => {
          const d = new Date(appt.appointmentDate);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().substring(0, 16);
      })(),
      appDurationMin: appt.appDurationMin,
      notes: appt.notes || '',
      newPatientName: '',
      newPatientPhone: '',
      newPatientDob: ''
    })
    setModalOpen(true)
  }

  const handleStatusChange = async (id: string, status: string) => {
    if (status === 'cancelled') {
        setSelectedId(id)
        setCancelReason('')
        setCancelModalOpen(true)
        return
    }

    try {
      const { data: res } = await api.patch(`/transactions/appointments/${id}/status`, { status })
      if (status === 'confirmed') {
          setConfirmedData(res)
          setShowConfirmWaConfirm(true)
          setConfirmModalOpen(true)
      }
      fetchData()
    } catch (e) {
      alert('Gagal mengubah status')
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelReason) return alert('Silakan isi alasan pembatalan')
    setSaving(true)
    try {
        const { data: res } = await api.patch(`/transactions/appointments/${selectedId}/status`, { 
            status: 'cancelled',
            cancelReason
        })
        setCancelledData(res)
        setShowCancelWaConfirm(true) // Munculkan layar WA
        fetchData()
    } catch (e) {
        alert('Gagal membatalkan janji temu')
    } finally {
        setSaving(false)
    }
  }

  const handleCheckIn = async (id: string) => {
    if (!confirm('Proses Check-In sekarang? Pasien akan masuk ke antrean dokter.')) return
    try {
      await api.post(`/transactions/appointments/${id}/check-in`, {})
      fetchData()
      alert('Check-in berhasil! Pasien telah masuk ke daftar antrean.')
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal melakukan check-in')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin MENGHAPUS janji temu ini selamanya? Data tidak bisa dikembalikan.')) return
    try {
        await api.delete(`/transactions/appointments/${id}`)
        fetchData()
    } catch (e) {
        alert('Gagal menghapus janji temu')
    }
  }

  const openWhatsApp = (appt: any, type: 'confirm' | 'reschedule' | 'cancel' | 'auto' = 'auto') => {
    const phone = appt.patient.phone
    if (!phone) return alert('Nomor HP pasien tidak ditemukan')
    
    const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '62')
    const time = format(new Date(appt.appointmentDate), 'HH:mm', { locale: id })
    const date = format(new Date(appt.appointmentDate), 'EEEE, dd MMMM yyyy', { locale: id })
    
    let message = ''

    // Logika Pemilihan Template
    if (type === 'reschedule') {
        message = `*KLINIK YASFINA - RESCHEDULE*\n\nHalo Kak *${appt.patient.name}*,\nMenginformasikan perubahan jadwal Janji Temu Anda dengan *${appt.doctor.name}* menjadi hari *${date}* jam *${time}* WIB.\n\nMohon konfirmasinya jika Kakak bersedia dengan jadwal baru ini. Terima kasih 🙏`
    } else if (type === 'cancel' || appt.status === 'cancelled') {
        const reason = appt.cancelReason || 'keperluan mendesak klinik'
        message = `*KLINIK YASFINA - PEMBATALAN*\n\nHalo Kak *${appt.patient.name}*,\nKami memohon maaf menginformasikan bahwa Janji Temu Anda dengan *${appt.doctor.name}* pada *${date}* terpaksa kami *BATALKAN* dikarenakan: _${reason}_.\n\nSilakan hubungi kami kembali jika Kakak ingin menjadwalkan ulang. Terima kasih atas pengertiannya 🙏`
    } else if (appt.status === 'confirmed' || type === 'confirm') {
        message = `*KLINIK YASFINA - KONFIRMASI*\n\nHalo Kak *${appt.patient.name}*,\nJanji Temu Anda dengan *${appt.doctor.name}* pada *${date}* jam *${time}* WIB telah *DIKONFIRMASI* ✅.\n\nMohon hadir 15 menit sebelum jadwal untuk verifikasi data di bagian pendaftaran. Terima kasih.`
    } else {
        message = `*KLINIK YASFINA - PENDAFTARAN*\n\nHalo Kak *${appt.patient.name}*,\nKonfirmasi Janji Temu Anda di Klinik Yasfina dengan *${appt.doctor.name}* pada hari *${date}* jam *${time}* WIB.\n\nApakah Kakak bisa hadir sesuai jadwal tersebut? Mohon informasinya ya Kak. Terima kasih 🙏`
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const columns: Column<any>[] = [
    { key: 'time', label: 'Waktu / Tanggal', render: (r) => (
      <div className="flex flex-col">
        <span className="text-sm font-black text-gray-900">{format(new Date(r.appointmentDate), 'HH:mm')}</span>
        <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{format(new Date(r.appointmentDate), 'dd MMM yyyy')}</span>
      </div>
    )},
    { key: 'patient', label: 'Pasien', render: (r) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 leading-none">{r.patient.name}</span>
            {r.patient.medicalRecordNo.startsWith('TEMP-') && (
                <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100">BARU</span>
            )}
        </div>
        <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{r.patient.medicalRecordNo}</span>
      </div>
    )},
    { key: 'doctor', label: 'Dokter / Layanan', render: (r) => (
      <div className="flex flex-col">
        <span className="text-xs font-black text-primary uppercase">{r.doctor.name}</span>
        <span className="text-[10px] text-gray-400 font-bold">{r.doctor.specialization}</span>
      </div>
    )},
    { key: 'status', label: 'Status', render: (r) => (
        <span className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl border shadow-sm ${STATUS_COLORS[r.status]}`}>
            {r.status.replace('-', ' ')}
        </span>
    )},
    { key: 'actions', label: 'Aksi', render: (r) => (
      <div className="flex items-center gap-2">
        {r.status === 'scheduled' && (
            <button 
                onClick={() => handleStatusChange(r.id, 'confirmed')} 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-200"
            >
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">KONFIRMASI</span>
            </button>
        )}
        {(r.status === 'scheduled' || r.status === 'confirmed') && (
            <>
                <div className="has-tooltip">
                    <span className="tooltip-blue">Reschedule</span>
                    <button onClick={() => handleEdit(r)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <FiEdit className="w-4 h-4" />
                    </button>
                </div>
                <button onClick={() => handleCheckIn(r.id)} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-[10px] font-bold shadow-sm">
                    <span>CHECK-IN</span>
                </button>
                <div className="has-tooltip">
                    <span className="tooltip-blue">Konfirmasi / Jadwal Ulang</span>
                    <button onClick={() => openWhatsApp(r)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                        <FaWhatsapp className="w-4 h-4" />
                    </button>
                </div>
                <div className="has-tooltip">
                    <span className="tooltip-blue">Batalkan</span>
                    <button onClick={() => handleStatusChange(r.id, 'cancelled')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                        <FiXCircle className="w-4 h-4" />
                    </button>
                </div>
            </>
        )}

        {r.status === 'cancelled' && (
            <div className="flex gap-2">
                <div className="has-tooltip">
                    <span className="tooltip-blue">Konfirmasi / Jadwal Ulang</span>
                    <button onClick={() => openWhatsApp(r)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                        <FaWhatsapp className="w-4 h-4" />
                    </button>
                </div>
                <div className="has-tooltip">
                    <span className="tooltip-blue">Hapus</span>
                    <button onClick={() => handleDelete(r.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                        <FiTrash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    )}
  ]

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-gray-50/30">
      <PageHeader 
        title="Janji Temu (Appointment)" 
        subtitle="Kelola reservasi jadwal dokter dan konfirmasi kedatangan pasien"
        icon={<FiCalendar className="w-6 h-6 text-primary" />}
        onAdd={() => { resetForm(); setModalOpen(true); }}
        addLabel="Buat Janji Temu"
        breadcrumb={['Transaksi', 'Appointment']}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-1 p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Filter Tanggal Layanan</label>
            <div className="relative">
                <FiCalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <input 
                    type="date" 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary font-black text-gray-700" 
                />
            </div>
            
            {dateFilter && (
                <button 
                    onClick={() => setDateFilter('')}
                    className="mt-3 w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all border border-rose-100"
                >
                    Tampilkan Semua Janji Temu
                </button>
            )}
            
            <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-800 uppercase">Total Booking</span>
                    <span className="text-xl font-black text-blue-900">{data.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] font-black text-purple-800 uppercase">Tunggu Check-in</span>
                    <span className="text-xl font-black text-purple-900">{data.filter(i => ['scheduled', 'confirmed'].includes(i.status)).length}</span>
                </div>
            </div>
        </div>

        <div className="md:col-span-3">
            <DataTable 
                data={data} 
                columns={columns} 
                loading={loading}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Cari nama pasien, No. RM, atau dokter..."
            />
        </div>
      </div>

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Reschedule / Edit Janji Temu' : 'Buat Janji Temu Baru'} size="lg">
        {showWaConfirm ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                    <FiCheckCircle className="w-12 h-12" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Perubahan Berhasil Disimpan!</h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-10">Jadwal baru telah diperbarui di sistem. Informasikan perubahan ini sekarang ke pasien.</p>
                </div>

                <div className="w-full pt-4 space-y-3 px-4">
                    <button 
                        onClick={() => openWhatsApp(rescheduledData, 'reschedule')}
                        className="w-full py-5 bg-green-500 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-green-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <FaWhatsapp className="w-5 h-5" />
                        Beritahu Pasien Via WhatsApp
                    </button>
                    <button 
                        onClick={() => { setModalOpen(false); resetForm(); }}
                        className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                        Tutup & Selesai
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-2"><FiInfo /> {error}</div>}
            
            {!isEditing && (
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                    <button 
                        onClick={() => setIsNewPatient(false)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${!isNewPatient ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                    >
                        Pasien Terdaftar
                    </button>
                    <button 
                        onClick={() => setIsNewPatient(true)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${isNewPatient ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                    >
                        Pasien Baru (Lite)
                    </button>
                </div>
            )}

            {isEditing ? (
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm font-black">
                        {patients.find(p => p.id === form.patientId)?.name?.[0]}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Rescheduling Untuk Pasien</p>
                        <p className="font-extrabold text-blue-900">{patients.find(p => p.id === form.patientId)?.name}</p>
                    </div>
                 </div>
            ) : isNewPatient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap Sesuai KTP</label>
                        <input type="text" value={form.newPatientName} onChange={e => setForm(p => ({...p, newPatientName: e.target.value}))} className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary" placeholder="cth: Budi Santoso" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                        <input type="tel" value={form.newPatientPhone} onChange={e => setForm(p => ({...p, newPatientPhone: e.target.value}))} className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary" placeholder="cth: 081234567xxx" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</label>
                        <input type="date" value={form.newPatientDob} onChange={e => setForm(p => ({...p, newPatientDob: e.target.value}))} className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary" />
                    </div>
                </div>
            ) : (
                <SearchableSelect 
                    label="Pilih Pasien Terdaftar"
                    options={patients.map(p => ({ id: p.id, label: p.name, code: p.medicalRecordNo }))}
                    value={form.patientId}
                    onChange={(id) => setForm(p => ({...p, patientId: id}))}
                    placeholder="Ketik nama atau No. RM..."
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <SearchableSelect 
                        label="Pilih Dokter Tujuan"
                        options={doctors.map(d => ({ id: d.id, label: d.name, code: d.specialization }))}
                        value={form.doctorId}
                        onChange={(id) => setForm(p => ({...p, doctorId: id}))}
                        placeholder="Cari dokter atau poli..."
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tanggal & Jam Sesi</label>
                    <input type="datetime-local" value={form.appointmentDate} onChange={e => setForm(p => ({...p, appointmentDate: e.target.value}))} className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Durasi (Menit)</label>
                    <input type="number" value={form.appDurationMin} onChange={e => setForm(p => ({...p, appDurationMin: Number(e.target.value)}))} className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary" />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Keluhan atau Catatan CS</label>
                <textarea 
                    value={form.notes} 
                    onChange={e => setForm(p => ({...p, notes: e.target.value}))} 
                    className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-primary min-h-[100px]"
                    placeholder="cth: Pasien ingin konsultasi hasil lab sebelumnya..."
                />
            </div>

            <div className="flex gap-4 pt-4">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-4 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all">
                    {saving ? 'MENYIMPAN...' : (isEditing ? 'SIMPAN PERUBAHAN' : 'BUAT JANJI TEMU')}
                </button>
            </div>
        </div>
        )}
      </MasterModal>

      {/* Modal Konfirmasi Pembatalan */}
      <MasterModal isOpen={cancelModalOpen} onClose={() => { setCancelModalOpen(false); resetForm(); }} title="Konfirmasi Pembatalan Janji" size="md">
        {showCancelWaConfirm ? (
             <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                    <FiXCircle className="w-12 h-12" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-rose-900 uppercase tracking-tight">Janji Temu Dibatalkan</h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-10">Status telah diperbarui di sistem. Beritahu pasien mengenai pembatalan ini.</p>
                </div>

                <div className="w-full pt-4 space-y-3 px-4">
                    <button 
                        onClick={() => openWhatsApp(cancelledData, 'cancel')}
                        className="w-full py-5 bg-green-500 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-green-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <FaWhatsapp className="w-5 h-5" />
                        Kirim Kabar Pembatalan Via WA
                    </button>
                    <button 
                        onClick={() => { setCancelModalOpen(false); resetForm(); }}
                        className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                        Tutup & Selesai
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                        <FiXCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-rose-900 uppercase tracking-tight">Yakin ingin membatalkan?</p>
                        <p className="text-[10px] font-bold text-rose-600 leading-normal mt-0.5">Tindakan ini tidak dapat dibatalkan. Pasien akan diberitahu jika diperlukan.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Alasan Pembatalan <span className="text-rose-500">*</span></label>
                    <textarea 
                        value={cancelReason} 
                        onChange={e => setCancelReason(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-2xl font-bold focus:outline-none focus:border-rose-400 min-h-[100px] text-sm"
                        placeholder="cth: Dokter mendadak ada operasi, ganti ke lusa..."
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-4 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">Gak Jadi</button>
                    <button onClick={handleCancelSubmit} disabled={saving} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 disabled:opacity-50 active:scale-95 transition-all">
                        {saving ? 'MEMPROSES...' : 'YA, BATALKAN SEKARANG'}
                    </button>
                </div>
            </div>
        )}
      </MasterModal>

      {/* Modal Konfirmasi Paska-Confirm Status */}
      <MasterModal isOpen={confirmModalOpen} onClose={() => { setConfirmModalOpen(false); resetForm(); }} title="Konfirmasi Berhasil" size="md">
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                    <FiCheckCircle className="w-12 h-12" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Janji Temu Dikonfirmasi</h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-10">Jadwal telah dikunci. Kirim pesan konfirmasi ke pasien sekarang.</p>
                </div>

                <div className="w-full pt-4 space-y-3 px-4">
                    <button 
                        onClick={() => openWhatsApp(confirmedData, 'confirm')}
                        className="w-full py-5 bg-green-500 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-green-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <FaWhatsapp className="w-5 h-5" />
                        Kirim Konfirmasi Via WA
                    </button>
                    <button 
                        onClick={() => { setConfirmModalOpen(false); resetForm(); }}
                        className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                        Tutup & Selesai
                    </button>
                </div>
            </div>
      </MasterModal>
    </div>
  )
}
