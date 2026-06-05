'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiXCircle, FiLoader, FiShield } from 'react-icons/fi'
import { FaHeartbeat } from 'react-icons/fa'

interface VerifiedData {
  id: string
  orderNo: string
  orderDate: string
  completedAt: string
  patient: {
    name: string
    gender: string
    age: string
    medicalRecordNoMasked: string
  }
  doctor: {
    name: string
  }
  results: Array<{
    testName: string
    category: string
    resultValue: string
    unit: string
    normalRangeText: string
    isCritical: boolean
  }>
}

export default function VerifyLabPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<VerifiedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006'}/api/public/verify/lab/${id}`)
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error('Terlalu banyak permintaan. Silakan coba lagi dalam 5 menit.')
          }
          throw new Error('Dokumen tidak ditemukan atau tidak valid.')
        }
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Gagal memverifikasi dokumen.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchVerification()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <FiLoader className="w-12 h-12 text-teal-600" />
        </motion.div>
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-sm">Memverifikasi Dokumen...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-rose-100">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiXCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Verifikasi Gagal</h1>
          <p className="text-slate-600 mb-8">{error}</p>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
              <FiShield /> Keamanan Sistem Yasfina
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500 rounded-t-3xl p-8 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center pointer-events-none">
            <FaHeartbeat className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
              <FiCheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">Dokumen Valid</h1>
            <p className="text-emerald-50 font-medium tracking-wide">Terverifikasi oleh Sistem Laboratorium Yasfina</p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-b-3xl shadow-xl p-8 border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Informasi Pasien</p>
              <h2 className="text-lg font-bold text-slate-800">{data.patient.name}</h2>
              <p className="text-sm text-slate-600">{data.patient.age} • {data.patient.gender}</p>
              <p className="text-xs text-slate-500 mt-2 font-mono bg-slate-200/50 inline-block px-2 py-1 rounded">RM: {data.patient.medicalRecordNoMasked}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Informasi Layanan</p>
              <p className="text-sm font-bold text-slate-800 mb-1">Dokter: {data.doctor.name}</p>
              <p className="text-xs text-slate-600 mb-1">ID Order: <span className="font-mono">{data.orderNo}</span></p>
              <p className="text-xs text-slate-600">Selesai: {new Date(data.completedAt).toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 border-b border-slate-100 pb-2">Ringkasan Hasil Pemeriksaan</h3>
            <div className="space-y-3">
              {data.results.map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm font-bold text-slate-700">{r.testName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{r.category}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={`text-sm font-black ${r.isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                      {r.resultValue} <span className="text-xs text-slate-500 font-normal">{r.unit}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Normal: {r.normalRangeText}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <FiShield className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Yasfina Secure Document Verification</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
