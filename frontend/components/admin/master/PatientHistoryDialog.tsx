import React, { useState, useEffect } from 'react'
import { FiX, FiFileText, FiClock, FiActivity, FiDollarSign, FiList, FiAlertCircle } from 'react-icons/fi'
import api from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface PatientHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  patientId: string | null
}

export default function PatientHistoryDialog({ isOpen, onClose, patientId }: PatientHistoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'medical' | 'registration' | 'invoice'>('medical')

  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory()
      setActiveTab('medical')
    } else {
      setData(null)
      setError('')
    }
  }, [isOpen, patientId])

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/master/patients/${patientId}/history`)
      setData(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal memuat riwayat pasien')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: id })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-primary text-white flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Riwayat Transaksi & Medis</h2>
            {data && (
              <p className="text-sm text-primary-100 mt-1 flex items-center gap-2">
                <FiFileText /> {data.patient.name} ({data.patient.medicalRecordNo})
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse">Memuat riwayat pasien...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 max-w-md text-center">
                <p className="font-bold mb-1">Gagal Memuat Data</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Allergy Alert */}
              {data.patient.allergies && (
                <div className="mx-4 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 shrink-0">
                  <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Peringatan Alergi</h4>
                    <p className="text-xs text-rose-600 mt-0.5 leading-relaxed">{data.patient.allergies}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex p-2 gap-2 bg-white border-b border-slate-200 shrink-0 mt-2">
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'medical' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FiActivity /> Rekam Medis ({data.medicalRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab('registration')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'registration' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FiClock /> Pendaftaran ({data.registrations.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'invoice' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FiDollarSign /> Tagihan / Invoice ({data.invoices.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  
                  {activeTab === 'medical' && (
                    <motion.div key="medical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {data.medicalRecords.length === 0 ? (
                        <EmptyState message="Belum ada riwayat rekam medis" />
                      ) : (
                        data.medicalRecords.map((rm: any) => (
                          <div key={rm.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{formatDate(rm.recordDate)}</p>
                                <h4 className="font-bold text-slate-800 mt-1">{rm.recordNo}</h4>
                              </div>
                              <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                {rm.doctor?.name || rm.guestDoctor?.name || 'Tanpa Dokter'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Keluhan Utama</p>
                                <p className="text-slate-700">{rm.chiefComplaint || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Diagnosis (ICD-10)</p>
                                <p className="text-slate-700">
                                  {rm.icd10 ? `[${rm.icd10.code}] ${rm.icd10.nameId || rm.icd10.nameEn || '-'}` : (rm.diagnosis || '-')}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Rencana Tindakan / Layanan</p>
                                <p className="text-slate-700">
                                  {rm.services && rm.services.length > 0 
                                    ? rm.services.map((s: any) => s.service?.serviceName).join(', ')
                                    : (rm.treatmentPlan || '-')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'registration' && (
                    <motion.div key="registration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {data.registrations.length === 0 ? (
                        <EmptyState message="Belum ada riwayat pendaftaran" />
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3">No. Daftar</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Poli / Tujuan</th>
                                <th className="px-4 py-3">Dokter</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {data.registrations.map((reg: any) => (
                                <tr key={reg.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-medium text-slate-800">{reg.registrationNo}</td>
                                  <td className="px-4 py-3 text-slate-600">{formatDate(reg.registrationDate)}</td>
                                  <td className="px-4 py-3 text-slate-600">{reg.department?.name || reg.visitType}</td>
                                  <td className="px-4 py-3 text-slate-600">{reg.doctor?.name || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                      reg.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                      reg.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {reg.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'invoice' && (
                    <motion.div key="invoice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {data.invoices.length === 0 ? (
                        <EmptyState message="Belum ada riwayat tagihan" />
                      ) : (
                        data.invoices.map((inv: any) => (
                          <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                              <div>
                                <h4 className="font-bold text-slate-800">{inv.invoiceNo}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{formatDate(inv.invoiceDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-lg text-primary">{formatRupiah(inv.total)}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                  inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {inv.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </span>
                              </div>
                            </div>
                            {inv.items && inv.items.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><FiList /> Item Ditagihkan</p>
                                <div className="space-y-1.5">
                                  {inv.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                      <span>{item.quantity}x {item.description}</span>
                                      <span className="font-medium text-slate-700">{formatRupiah(item.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
        <FiFileText className="w-6 h-6" />
      </div>
      <p className="font-medium">{message}</p>
    </div>
  )
}
