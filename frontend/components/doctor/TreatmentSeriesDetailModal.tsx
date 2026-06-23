'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { FiX, FiEdit2, FiPlus, FiTrash2, FiPlay, FiCheckCircle, FiClock } from 'react-icons/fi'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'
import TreatmentStepModal from './TreatmentStepModal'

interface TreatmentSeriesDetailModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  userRole: string
}

export default function TreatmentSeriesDetailModal({ isOpen, onClose, planId, userRole }: TreatmentSeriesDetailModalProps) {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  // Modal for add/edit visit
  const [isStepModalOpen, setIsStepModalOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<any>(null)

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/treatment-plans/${planId}`)
      setPlan(res.data)
    } catch (err: any) {
      toast.error('Gagal memuat detail rangkaian perawatan')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVisit = async (visitId: string) => {
    if (!window.confirm('Yakin ingin menghapus tahap ini? Semua tindakan di dalamnya akan ikut terhapus.')) return;
    try {
      await api.delete(`/treatment-plans/${planId}/visits/${visitId}`)
      toast.success('Tahap berhasil dihapus')
      fetchPlan()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus tahap')
    }
  }

  // #7: Handle visit status change
  const handleUpdateStatus = async (visitId: string, status: string) => {
    try {
      await api.put(`/treatment-plans/${planId}/visits/${visitId}/status`, { status })
      toast.success('Status berhasil diperbarui')
      fetchPlan()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status')
    }
  }

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlan()
    }
  }, [isOpen, planId])

  if (!isOpen) return null

  // Calculate stats
  const totalKunjungan = plan?.visits?.length || 0
  const tahapSelesai = plan?.visits?.filter((v: any) => v.status === 'SELESAI').length || 0
  
  let calculatedTotalAmount = 0
  plan?.visits?.forEach((v: any) => {
    v.services?.forEach((s: any) => {
      calculatedTotalAmount += Number(s.adjustedPrice ?? s.subtotal)
    })
  })

  return (
    <>
      {mounted && createPortal(
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="relative bg-[#1e1e1e] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col border border-[#333]"
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors z-10">
              <FiX className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="p-20 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : plan ? (
              <div className="p-8">
                {/* Header */}
                <div className="mb-8 pr-12">
                  <p className="text-gray-400 text-sm mb-1">Rangkaian perawatan</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white">{plan.description}</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#444] text-white rounded-lg text-sm font-medium hover:bg-white/5 transition-colors whitespace-nowrap">
                      <FiEdit2 className="w-4 h-4" /> Edit nama
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Pasien: {plan.patient?.name} · No. RM {plan.patient?.medicalRecordNo}
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className="bg-[#2a2a2a] p-5 rounded-2xl border border-[#333]">
                    <p className="text-gray-400 text-sm mb-2">Total tahapan</p>
                    <p className="text-3xl font-bold text-white">{totalKunjungan}</p>
                  </div>
                  <div className="bg-[#2a2a2a] p-5 rounded-2xl border border-[#333]">
                    <p className="text-gray-400 text-sm mb-2">Tahap selesai</p>
                    <p className="text-3xl font-bold text-white">{tahapSelesai} / {totalKunjungan}</p>
                  </div>
                  <div className="bg-[#2a2a2a] p-5 rounded-2xl border border-[#333]">
                    <p className="text-gray-400 text-sm mb-2">Estimasi total biaya</p>
                    <p className="text-3xl font-bold text-white">Rp {calculatedTotalAmount.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Table Section */}
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Tahapan & tindakan</h3>
                  <button 
                    onClick={() => { setEditingVisit(null); setIsStepModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#444] text-white rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Tambah tahap
                  </button>
                </div>

                <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">tindakan</div>
                    <div className="col-span-2">jadwal</div>
                    <div className="col-span-2">status</div>
                    <div className="col-span-2">aksi</div>
                    <div className="col-span-2 text-right">harga</div>
                  </div>

                  {/* Table Body */}
                  {plan.visits?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Belum ada tahapan. Silakan tambah tahap baru.</div>
                  ) : (
                    <div className="divide-y divide-[#333]">
                      {plan.visits?.map((visit: any, index: number) => {
                        const isSelesai = visit.status === 'SELESAI'
                        const isBerjalan = visit.status === 'BERJALAN'
                        
                        let badgeBg = 'bg-[#333]'
                        let badgeText = 'text-gray-400'
                        let statusBg = 'bg-[#333]'
                        let statusText = 'text-gray-400'
                        
                        if (isSelesai) {
                          badgeBg = 'bg-emerald-900/50'
                          badgeText = 'text-emerald-400'
                          statusBg = 'bg-emerald-900/40'
                          statusText = 'text-emerald-500'
                        } else if (isBerjalan) {
                          badgeBg = 'bg-blue-900/50'
                          badgeText = 'text-blue-400'
                          statusBg = 'bg-blue-900/40'
                          statusText = 'text-blue-400'
                        }

                        // Calculate visit total
                        const visitTotal = visit.services?.reduce((sum: number, s: any) => sum + Number(s.adjustedPrice ?? s.subtotal), 0) || 0

                        return (
                          <div key={visit.id} className="border-b border-[#333] last:border-0 hover:bg-[#252525] transition-colors">
                            <div className="grid grid-cols-12 gap-4 p-4 items-center">
                              {/* Number Badge */}
                              <div className="col-span-1 flex justify-center">
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + badgeBg + " " + badgeText}>
                                  {index + 1}
                                </div>
                              </div>
                                                        
                              {/* Tahap Info */}
                              <div className="col-span-3">
                                <div className="text-white font-medium mb-1">
                                  Kunjungan Tahap ke-{visit.order}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {visit.services?.length || 0} Tindakan
                                </div>
                              </div>
                                                        
                              {/* Jadwal */}
                              <div className="col-span-2">
                                {visit.visitDate ? (
                                  <span className="text-white font-medium text-sm">
                                    {new Date(visit.visitDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm whitespace-pre-wrap">
                                    belum{"\n"}dijadwalkan
                                  </span>
                                )}
                              </div>
                                                        
                              {/* Status */}
                              <div className="col-span-2 flex flex-col gap-1.5">
                                <span className={"px-3 py-1 rounded-full text-xs font-medium inline-block w-fit " + statusBg + " " + statusText}>
                                  {isSelesai ? 'Selesai' : isBerjalan ? 'Berjalan' : 'Belum'}
                                </span>
                              </div>
                                                        
                              {/* Actions */}
                              <div className="col-span-2 flex flex-col gap-1.5">
                                {/* #7: Status change buttons — hidden for SELESAI */}
                                {!isSelesai && userRole === 'DOCTOR' && (
                                  <div className="flex flex-wrap gap-1">
                                    {!isBerjalan && (
                                      <button
                                        onClick={() => handleUpdateStatus(visit.id, 'BERJALAN')}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        title="Mulai Tahap"
                                      >
                                        <FiPlay className="w-3 h-3" /> Mulai
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateStatus(visit.id, 'SELESAI')}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                      title="Selesaikan Tahap"
                                    >
                                      <FiCheckCircle className="w-3 h-3" /> Selesai
                                    </button>
                                  </div>
                                )}
                              </div>
                                                        
                              {/* Harga & Action */}
                              <div className="col-span-2 flex items-center justify-end gap-2">
                                <span className="text-white font-bold whitespace-nowrap mr-2">
                                  {visitTotal > 0 ? visitTotal.toLocaleString('id-ID') : '-'}
                                </span>
                                {/* #10: Hide edit/delete for SELESAI visits */}
                                {!isSelesai && (
                                  <>
                                    <button 
                                      onClick={() => { setEditingVisit(visit); setIsStepModalOpen(true); }}
                                      className="text-gray-500 hover:text-white p-1 transition-colors"
                                      title="Edit Tahap"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteVisit(visit.id)}
                                      className="text-gray-500 hover:text-red-500 p-1 transition-colors"
                                      title="Hapus Tahap"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Child Items (Services) */}
                            {visit.services && visit.services.length > 0 && (
                              <div className="pl-[4.5rem] pr-4 pb-4">
                                <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#333]">
                                  {visit.services.map((s:any, i:number) => (
                                    <div key={i} className="flex justify-between items-center p-3 border-b border-[#333] last:border-0">
                                      <span className="text-gray-300 text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                        {s.service?.serviceName || 'Tindakan'} {s.quantity > 1 && `(x${s.quantity})`}
                                      </span>
                                      <span className="text-gray-400 text-sm font-medium">
                                        Rp {Number(s.adjustedPrice ?? s.subtotal).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Total */}
                <div className="mt-8 flex justify-end">
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Total estimasi biaya</p>
                    <p className="text-3xl font-bold text-white">Rp {calculatedTotalAmount.toLocaleString('id-ID')}</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-20 text-center text-gray-500">Data tidak ditemukan</div>
            )}
          </motion.div>
          
          {/* Nested Modal for Step Edit */}
          {isStepModalOpen && (
            <TreatmentStepModal 
              isOpen={isStepModalOpen}
              onClose={() => setIsStepModalOpen(false)}
              onSuccess={() => { fetchPlan(); }}
              planId={planId}
              visitData={editingVisit}
              userRole={userRole}
              nextOrder={plan.visits ? plan.visits.length + 1 : 1}
            />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  )}
    </>
  )
}
