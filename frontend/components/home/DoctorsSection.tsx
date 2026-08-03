'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Link from 'next/link'
import { FiClock, FiCalendar, FiActivity } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

interface Schedule {
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  bio?: string
  profilePicture?: string
  schedules?: Schedule[]
}

export default function DoctorsSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSpecialty, setActiveSpecialty] = useState<string>('Semua')
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006'

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

  const isFemaleDoctor = (name: string): boolean => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('hj.') || lowerName.includes('hajah') || lowerName.includes('ibu') || lowerName.includes('ny.')) return true
    if (lowerName.includes('h.') || lowerName.includes('haji') || lowerName.includes('bapak') || lowerName.includes('bpk.')) return false
    const femaleKeywords = ['siti', 'sri', 'dewi', 'sintia', 'balqish', 'putri', 'diah', 'fitri', 'indah', 'rina', 'ani', 'ria', 'kartika', 'aisyah', 'fatimah', 'nurmala', 'lilis', 'yanti', 'wulan', 'lestari', 'rahayu', 'ningsih', 'amalia', 'lidya', 'ayu', 'sari', 'widya', 'agustina', 'maria', 'theresia', 'sarah', 'diana', 'indri', 'desi', 'ratna', 'novita', 'dhyandra', 'lia', 'anisa', 'annisa', 'mutia', 'ulia', 'mega', 'ita', 'ratu']
    const maleKeywords = ['prasetyo', 'bambang', 'agus', 'budi', 'hadi', 'hendra', 'ahmad', 'muhammad', 'rudi', 'eko', 'joko', 'dedi', 'dedy', 'toni', 'tony', 'rian', 'ryan', 'aris', 'andi', 'aditya', 'yanto', 'wawan', 'teguh', 'sigit', 'fajar', 'surya', 'rizal', 'gunawan', 'agung', 'deny', 'deni', 'roni', 'rony', 'hasan', 'husain', 'ridwan', 'taufik', 'yusuf', 'arief', 'arif', 'imran', 'zulkifli', 'setiawan', 'kurniawan', 'sugeng', 'slamet', 'mulyono', 'susilo', 'heru', 'triyono', 'supriadi', 'anwar', 'wibowo', 'saputra', 'wahyudi']
    for (const kw of femaleKeywords) if (lowerName.includes(kw)) return true
    for (const kw of maleKeywords) if (lowerName.includes(kw)) return false
    if (lowerName.endsWith('o') || lowerName.endsWith('us') || lowerName.endsWith('an') || lowerName.endsWith('am') || lowerName.endsWith('ad') || lowerName.endsWith('in') || lowerName.endsWith('ar')) return false
    return true
  }

  const getDefaultDoctorPhoto = (name: string): string => {
    return isFemaleDoctor(name) ? '/default-doctor-female.png' : '/default-doctor-male.png'
  }

  const getDoctorPhoto = (pic: string | undefined, name: string) => {
    if (!pic) return getDefaultDoctorPhoto(name)
    const cleanPic = pic.replace(/\\/g, '/')
    if (cleanPic.startsWith('http')) return cleanPic
    const slash = cleanPic.startsWith('/') ? '' : '/'
    return `${API_URL}${slash}${cleanPic}`
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/doctors`)
        setDoctors(response.data || [])
      } catch (error) {
        console.error('Failed to fetch doctors:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [API_URL])

  const specialties = ['Semua', ...Array.from(new Set(doctors.map(d => d.specialization || 'Umum')))]

  const filteredDoctors = activeSpecialty === 'Semua' 
    ? doctors 
    : doctors.filter(d => (d.specialization || 'Umum') === activeSpecialty)

  return (
    <section id="doctors" className="section-padding bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-primary/20"
          >
            <FiCalendar className="w-3.5 h-3.5" />
            Tim Medis & Jadwal Praktik
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight"
          >
            Dokter & <span className="text-primary">Jadwal Praktik</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium text-sm md:text-base"
          >
            Kenali tim dokter spesialis berpengalaman kami dan temukan jadwal konsultasi yang sesuai untuk Anda.
          </motion.p>
        </div>

        {/* Specialty Filter Tabs */}
        {!loading && specialties.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setActiveSpecialty(spec)}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 ${
                  activeSpecialty === spec 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-sky-400 border border-gray-100 dark:border-slate-800'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-slate-800 animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-2/3"></div>
                <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSpecialty}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 hover:shadow-2xl dark:hover:shadow-primary/10 transition-all duration-500 flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Image Container */}
                      <div className="relative h-72 overflow-hidden bg-gray-100 dark:bg-slate-800">
                        <img 
                          src={getDoctorPhoto(doctor.profilePicture, doctor.name)} 
                          alt={doctor.name} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultDoctorPhoto(doctor.name);
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-primary/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md shadow-md">
                          {doctor.specialization}
                        </span>
                      </div>

                      {/* Doctor Meta & Bio */}
                      <div className="p-6 pb-2">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-snug">
                          {doctor.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2 mb-6">
                          {doctor.bio || 'Dokter profesional berpengalaman yang siap memberikan penanganan medis terbaik untuk Anda.'}
                        </p>

                        {/* Schedules Container */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 mb-4 space-y-2.5">
                          <div className="flex items-center gap-2 text-[10px] font-black text-primary dark:text-sky-400 uppercase tracking-widest">
                            <FiClock className="w-3.5 h-3.5 text-primary dark:text-sky-400" />
                            <span>Jadwal Praktik Dokter</span>
                          </div>

                          {doctor.schedules && doctor.schedules.length > 0 ? (
                            <div className="space-y-1.5">
                              {doctor.schedules
                                .sort((a, b) => daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek))
                                .map((sched, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/80 text-[10px]">
                                    <span className="font-black text-gray-700 dark:text-gray-200">{sched.dayOfWeek}</span>
                                    <span className="font-extrabold text-primary dark:text-sky-400 bg-primary/5 dark:bg-sky-400/10 px-2 py-0.5 rounded">
                                      {sched.startTime} - {sched.endTime}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 italic py-1">
                              Jadwal praktik fleksibel (Konfirmasi via WA)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="p-6 pt-0 space-y-2">
                      <div className="flex gap-2">
                        <Link 
                          href="/register"
                          className="flex-1 py-3.5 bg-gray-900 dark:bg-slate-800 hover:bg-primary dark:hover:bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                          <FiActivity className="w-3.5 h-3.5" />
                          Buat Janji
                        </Link>
                        <a 
                          href={`https://wa.me/6289629353621?text=Halo%20Team%20Admin%20Klinik%20Yasfina,%20saya%20ingin%20tanya%20jadwal%20dan%20konsultasi%20mengenai%20${encodeURIComponent(doctor.name)}%20(${encodeURIComponent(doctor.specialization)}).`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
                          title="Klik untuk terhubung langsung dengan Team Admin Klinik kami"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          <span>Chat Admin</span>
                        </a>
                      </div>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold text-center italic">
                        *Klik Chat Admin untuk terhubung langsung dengan Team Admin Klinik kami
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-gray-400 font-bold text-sm">
                  Belum ada data dokter untuk kategori ini.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
