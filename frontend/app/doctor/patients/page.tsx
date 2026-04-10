'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { FiUsers, FiSearch, FiCalendar, FiFileText, FiArrowRight, FiRefreshCw } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'

const API_MASTER = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const API_TRANSACTIONS = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  gender: string
  dateOfBirth: string
  phone: string
}

interface Consultation {
  id: string
  patientId: string
  createdAt: string
  status: string
  diagnosis?: string
}

export default function DoctorPatients() {
  const { token, activeClinicId } = useAuthStore()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchPatients = useCallback(async () => {
    if (!token || !activeClinicId) return
    try {
      const { data } = await axios.get(`${API_MASTER}/patients`, { 
        headers,
        params: { limit: 100 }
      })
      setPatients(data)
    } catch (e) {
      console.error('Failed to fetch patients', e)
    } finally {
      setLoading(false)
    }
  }, [token, activeClinicId, headers])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    return patients.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medicalRecordNo.includes(searchTerm) ||
      p.phone.includes(searchTerm)
    )
  }, [patients, searchTerm])

  return (
    <div className="space-y-6 lg:ml-64">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl"><FiUsers className="text-green-600 w-6 h-6" /></div>
            Riwayat Pasien
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Lihat daftar pasien dan history konsultasi</p>
        </div>
        <button 
          onClick={fetchPatients} 
          className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm self-start"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari nama pasien, nomor rekam medis, atau nomor telepon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
        />
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient, idx) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => router.push(`/doctor/patients/${patient.id}`)}
              className="bg-white p-6 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                      {patient.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">{patient.name}</p>
                      <p className="text-xs text-gray-500 font-medium">RM: {patient.medicalRecordNo}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Jenis Kelamin</p>
                      <p className="font-bold text-gray-900 capitalize">{patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Tanggal Lahir</p>
                      <p className="font-bold text-gray-900">
                        {new Date(patient.dateOfBirth).toLocaleDateString('id-ID', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Telepon</p>
                      <p className="font-bold text-gray-900">{patient.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Aksi</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/doctor/patients/${patient.id}`)
                        }}
                        className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors"
                      >
                        Lihat <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-16 text-center bg-gray-50/80 rounded-xl border-2 border-dashed border-gray-200">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-sm">
              {searchTerm ? 'Pasien tidak ditemukan' : 'Tidak ada data pasien'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
