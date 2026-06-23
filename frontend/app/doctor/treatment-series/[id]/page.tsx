'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiPlus, FiClock, FiCheckCircle, FiActivity, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import TreatmentStepModal from '@/components/doctor/TreatmentStepModal'
import { toast } from 'react-hot-toast'

export default function TreatmentSeriesDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()

  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<any>(null)

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/treatment-plans/${id}`)
      setPlan(res.data)
    } catch (err: any) {
      toast.error('Gagal memuat detail rangkaian perawatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchPlan()
  }, [id])

  const handleDeleteVisit = async (visitId: string) => {
    if (!window.confirm('Yakin ingin menghapus tahap ini?')) return
    try {
      await api.delete(`/treatment-plans/${id}/visits/${visitId}`)
      toast.success('Tahap berhasil dihapus')
      fetchPlan()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus tahap')
    }
  }

  const handleUpdateStatus = async (visitId: string, status: string) => {
    try {
      await api.put(`/treatment-plans/${id}/visits/${visitId}/status`, { status })
      toast.success('Status berhasil diperbarui')
      fetchPlan()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status')
    }
  }
  
  const handleCompletePlan = async () => {
    if (!window.confirm('Selesaikan rangkaian perawatan ini?')) return
    try {
      await api.patch(`/treatment-plans/${id}/status`, { status: 'COMPLETED' })
      toast.success('Rangkaian perawatan selesai')
      fetchPlan()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyelesaikan rangkaian')
    }
  }

  if (loading) {
    return <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!plan) return <div className="p-10 text-center text-gray-500">Data tidak ditemukan</div>

  const isCompleted = plan.status === 'COMPLETED'
  const isDoctor = user?.role === 'DOCTOR'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {isCompleted ? 'Selesai' : 'Aktif'}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {new Date(plan.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">{plan.description}</h1>
            <p className="text-sm font-bold text-gray-500">Pasien: {plan.patient?.name} ({plan.patient?.medicalRecordNo})</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isCompleted && isDoctor && (
             <button onClick={handleCompletePlan} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
               <FiCheckCircle /> Tandai Selesai
             </button>
          )}
          {!isCompleted && isDoctor && (
            <button onClick={() => { setEditingVisit(null); setIsModalOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <FiPlus /> Tahap Baru
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><FiActivity className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tahapan</p>
            <p className="text-2xl font-black text-gray-900">{plan.visits?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><FiCheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tahap Selesai</p>
            <p className="text-2xl font-black text-gray-900">{plan.visits?.filter((v:any) => v.status === 'SELESAI').length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><FiFileText className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Biaya (Estimasi)</p>
            <p className="text-xl font-black text-gray-900">Rp {plan.calculatedTotalAmount?.toLocaleString('id-ID') || 0}</p>
          </div>
        </div>
      </div>

      {/* Timeline of Visits */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Daftar Tahapan Kunjungan</h3>
        
        {plan.visits?.length === 0 ? (
           <div className="text-center py-10 text-gray-400 text-sm">Belum ada tahap yang ditambahkan</div>
        ) : (
          <div className="space-y-6">
            {plan.visits?.map((visit: any, index: number) => (
               <div key={visit.id} className="relative pl-6 md:pl-10">
                 {/* Timeline Line */}
                 {index !== plan.visits.length - 1 && (
                   <div className="absolute left-2.5 md:left-4 top-8 bottom-[-24px] w-0.5 bg-gray-100" />
                 )}
                 {/* Timeline Dot */}
                 <div className={`absolute left-0 md:left-1.5 top-2 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                   visit.status === 'SELESAI' ? 'bg-emerald-500' : 
                   visit.status === 'BERJALAN' ? 'bg-amber-500' : 'bg-gray-300'
                 }`} />

                 <div className="bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-blue-200 rounded-xl p-4 transition-all group">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-black text-gray-800">Tahap {visit.order}</span>
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                           visit.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 
                           visit.status === 'BERJALAN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                         }`}>
                           {visit.status}
                         </span>
                       </div>
                       {visit.visitDate && (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                           <FiClock className="w-3.5 h-3.5" /> 
                           Jadwal: {new Date(visit.visitDate).toLocaleDateString('id-ID')}
                         </div>
                       )}
                     </div>

                     {/* Actions */}
                     {!isCompleted && isDoctor && (
                       <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         {visit.status !== 'SELESAI' && (
                           <>
                             {visit.status === 'BELUM' && (
                                <button onClick={() => handleUpdateStatus(visit.id, 'BERJALAN')} className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg hover:bg-amber-100">
                                  Mulai Tahap
                                </button>
                             )}
                             {visit.status === 'BERJALAN' && (
                                <button onClick={() => handleUpdateStatus(visit.id, 'SELESAI')} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-100">
                                  Tandai Selesai
                                </button>
                             )}
                             <button onClick={() => { setEditingVisit(visit); setIsModalOpen(true) }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><FiEdit2 className="w-3.5 h-3.5" /></button>
                             <button onClick={() => handleDeleteVisit(visit.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><FiTrash2 className="w-3.5 h-3.5" /></button>
                           </>
                         )}
                       </div>
                     )}
                   </div>

                   {/* Services */}
                   {visit.services && visit.services.length > 0 && (
                     <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                       <table className="w-full text-left text-xs">
                         <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                           <tr>
                             <th className="px-4 py-2">Tindakan</th>
                             <th className="px-4 py-2 text-right">Harga</th>
                             <th className="px-4 py-2 text-right">Qty</th>
                             <th className="px-4 py-2 text-right">Subtotal</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                           {visit.services.map((svc: any) => (
                             <tr key={svc.id}>
                               <td className="px-4 py-2.5 font-bold text-gray-800">{svc.service?.serviceName || 'Layanan Umum'}</td>
                               <td className="px-4 py-2.5 text-right text-gray-600">Rp {svc.price.toLocaleString('id-ID')}</td>
                               <td className="px-4 py-2.5 text-right font-mono text-gray-500">{svc.quantity}</td>
                               <td className="px-4 py-2.5 text-right font-black text-gray-900">Rp {(svc.adjustedPrice ?? svc.subtotal).toLocaleString('id-ID')}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>

      <TreatmentStepModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPlan}
        planId={id as string}
        visitData={editingVisit}
        userRole={user?.role || 'DOCTOR'}
      />
    </div>
  )
}
