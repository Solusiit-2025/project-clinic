'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FiArrowLeft, FiUserPlus, FiCalendar, FiArrowRight, FiCheckCircle, FiClock, FiUser, FiSmartphone } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL + '/api/public'

export default function BookingPublicPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('') // Jebakan Robot

  const [form, setForm] = useState({
    newPatientName: '',
    newPatientPhone: '',
    newPatientDob: '',
    doctorId: '',
    clinicId: '',
    appointmentDate: '',
    appointmentTime: '08:00',
    notes: ''
  })

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [docRes, clinicRes] = await Promise.all([
          axios.get(`${PUBLIC_API}/doctors`),
          axios.get(`${PUBLIC_API}/clinics`)
        ])
        setDoctors(docRes.data || [])
        setClinics(clinicRes.data?.data || clinicRes.data || [])
      } catch (e) {
        console.error('Failed to fetch public data', e)
      }
    }
    fetchMasters()
  }, [])

  const handleSubmit = async () => {
    // Keamanan 1: Jika Honeypot (Jebakan Robot) terisi, abaikan (anggap robot)
    if (honeypot) {
      console.warn('Bot detected via Honeypot')
      setSuccess(true) // Pura-pura sukses biar robotnya pergi
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        appointmentDate: `${form.appointmentDate}T${form.appointmentTime}:00`
      }
      await axios.post(`${PUBLIC_API}/appointments`, payload)
      setSuccess(true)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal mengirim pendaftaran. Mohon cek kembali data Anda.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
                <FiCheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">PENDAFTARAN BERHASIL!</h1>
            <p className="text-gray-500 font-bold leading-relaxed mb-10">
                Terima kasih {form.newPatientName}. Admin kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi jadwal.
            </p>
            <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                KEMBALI KE BERANDA
            </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8 font-black text-[10px] uppercase tracking-widest"
        >
          <FiArrowLeft className="w-4 h-4" />
          {step > 1 ? 'KEMBALI KE LANGKAH SEBELUMNYA' : 'BATALKAN'}
        </button>

        <div className="bg-white overflow-hidden rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Sidebar / Progress */}
            <div className="md:col-span-2 bg-primary p-12 text-white flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-md">
                        <FiCalendar className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4">Booking Online</h2>
                    <p className="text-white/70 text-sm font-bold leading-relaxed">
                        Daftar janji temu dengan dokter spesialis kami langsung dari rumah.
                    </p>
                </div>

                <div className="space-y-6 mt-12">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-black ${step === s ? 'bg-white text-primary border-white' : (step > s ? 'bg-emerald-400 border-emerald-400 text-white' : 'border-white/30 text-white/30')}`}>
                                {step > s ? <FiCheckCircle /> : s}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-white' : 'text-white/30'}`}>
                                {s === 1 ? 'Data Diri' : s === 2 ? 'Pilih Dokter' : 'Konfirmasi'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-3 p-10 lg:p-14">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 mb-8">Informasi Pasien</h3>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nama Lengkap Pasien</label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input type="text" value={form.newPatientName} onChange={e => setForm({...form, newPatientName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary transition-all" placeholder="Sesuai kartu identitas..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nomor WhatsApp Aktif</label>
                                <div className="relative group">
                                    <FiSmartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input type="tel" value={form.newPatientPhone} onChange={e => setForm({...form, newPatientPhone: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary transition-all" placeholder="Contoh: 081234567xxx" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tanggal Lahir</label>
                                <input type="date" value={form.newPatientDob} onChange={e => setForm({...form, newPatientDob: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary transition-all" />
                            </div>
                            <button 
                                onClick={() => form.newPatientName && form.newPatientPhone ? setStep(2) : alert('Mohon lengkapi data Anda')}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-900/10"
                            >
                                LANGKAH SELANJUTNYA <FiArrowRight />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 mb-8">Pilih Layanan & Dokter</h3>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Klinik Cabang</label>
                                <select value={form.clinicId || ''} onChange={e => setForm({...form, clinicId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary">
                                    <option value="">-- Pilih Klinik --</option>
                                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Dokter Spesialis</label>
                                <select value={form.doctorId || ''} onChange={e => setForm({...form, doctorId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary">
                                    <option value="">-- Pilih Dokter --</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                                </select>
                            </div>

                            {/* Doctor Schedule Card */}
                            <AnimatePresence>
                                {form.doctorId && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <FiClock className="w-3 h-3" /> Jadwal Praktek Dokter
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {doctors.find(d => d.id === form.doctorId)?.schedules?.length > 0 ? (
                                                    doctors.find(d => d.id === form.doctorId).schedules.map((s: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-blue-200/30">
                                                            <span className="text-[10px] font-black text-gray-700">{s.dayOfWeek}</span>
                                                            <span className="text-[10px] font-bold text-primary">{s.startTime} - {s.endTime}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="col-span-2 text-[10px] font-bold text-gray-400 italic">Jadwal belum tersedia, silakan konfirmasi via WA.</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tanggal Janji</label>
                                    <input type="date" value={form.appointmentDate} onChange={e => setForm({...form, appointmentDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Jam Kedatangan</label>
                                    <input type="time" value={form.appointmentTime} onChange={e => setForm({...form, appointmentTime: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary" />
                                </div>
                            </div>
                            {/* Honeypot Field (Hidden for Humans) */}
                            <div className="hidden" aria-hidden="true">
                                <input 
                                    type="text" 
                                    name="confirm_email_address_confirmation" 
                                    value={honeypot} 
                                    onChange={(e) => setHoneypot(e.target.value)} 
                                    tabIndex={-1} 
                                    autoComplete="off"
                                />
                            </div>

                            <button 
                                onClick={() => form.doctorId && form.appointmentDate ? setStep(3) : alert('Mohon pilih dokter dan tanggal')}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-900/10"
                            >
                                LANGKAH TERAKHIR <FiArrowRight />
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                             <h3 className="text-xl font-black text-gray-900 mb-4">Konfirmasi Janji Temu</h3>
                             <div className="p-8 bg-gray-50/80 rounded-[2.5rem] border border-gray-100 space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pasien</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <FiUser className="text-primary w-4 h-4" />
                                        <span className="font-extrabold text-lg tracking-tight">{form.newPatientName}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Dokter & Spesialisasi</span>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span className="font-extrabold">{doctors.find(d => d.id === form.doctorId)?.name}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 ml-4 uppercase tracking-wider">{doctors.find(d => d.id === form.doctorId)?.specialization}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jadwal Kedatangan</span>
                                    <div className="flex items-center gap-2 text-primary">
                                        <FiCalendar className="w-4 h-4" />
                                        <span className="font-extrabold">
                                            {form.appointmentDate ? format(new Date(form.appointmentDate), 'EEEE, dd MMMM yyyy', { locale: id }) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary ml-6">
                                        <FiClock className="w-3 h-3" />
                                        <span className="text-sm font-black">Pukul {form.appointmentTime} WIB</span>
                                    </div>
                                </div>
                             </div>

                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Keluhan Singkat (Opsional)</label>
                                <textarea 
                                    value={form.notes} 
                                    onChange={e => setForm({...form, notes: e.target.value})} 
                                    className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:outline-none focus:border-primary min-h-[100px]"
                                    placeholder="Contoh: Sakit tenggorokan sudah 3 hari..."
                                />
                             </div>

                             {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 p-4 rounded-2xl border border-rose-100">{error}</p>}

                             <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-6 bg-primary text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
                            >
                                {loading ? 'MENGIRIM...' : 'KONFIRMASI JADWAL SAYA'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 font-extrabold uppercase tracking-[0.3em] mt-12 mb-20">
          Powered by Klinik Yasfina &copy; 2026 • Professional Medical Management
        </p>
      </div>
    </div>
  )
}
