'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiFileText, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiTrash2, FiUserCheck, FiX, FiDroplet, FiPhone, FiDollarSign, FiCalendar, FiUploadCloud, FiSearch, FiUser, FiArrowRight, FiHash, FiActivity, FiPackage, FiTruck, FiEye, FiPlay, FiBookOpen } from 'react-icons/fi'
import { HiOutlineBeaker } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import TreatmentSeriesDetailModal from './TreatmentSeriesDetailModal'
import GuidebookModal from './GuidebookModal'

// #1: Sync WO status config with admin page
type WorkOrderStatus = 'DRAFT' | 'PENDING_DP' | 'SENT_TO_LAB' | 'RECEIVED' | 'FITTED' | 'CANCELLED'

const WO_STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT:       { label: 'Draft',             color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',   icon: FiEdit2 },
  PENDING_DP:  { label: 'Menunggu DP',       color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: FiAlertCircle },
  SENT_TO_LAB: { label: 'Di Lab',            color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: FiTruck },
  RECEIVED:    { label: 'Diterima dari Lab', color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: FiPackage },
  FITTED:      { label: 'Sudah Dipasang',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle },
  CANCELLED:   { label: 'Dibatalkan',        color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',    icon: FiX },
}

interface TreatmentPlanModuleProps {
  patientId: string
  doctorId?: string | null
  clinicId?: string
  isReadOnly?: boolean
}

export default function TreatmentPlanModule({ patientId, doctorId, clinicId, isReadOnly }: TreatmentPlanModuleProps) {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Detail Modal
  const [detailModalPlanId, setDetailModalPlanId] = useState<string | null>(null)

  // Create Plan Form
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [createForm, setCreateForm] = useState({ description: '', items: [] as { description: string; quantity: number; price: number }[] })
  const [processingPlan, setProcessingPlan] = useState(false)

  // Guidebook
  const [showGuidebook, setShowGuidebook] = useState(false)

  // Work Order Form
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [woForm, setWoForm] = useState({
    labName: '', labContact: '', labAddress: '', itemDescription: '', jobType: '', material: '', stage: '',
    shade: '', size: '', toothNumber: '', estimatedDate: '', labFee: 0, notes: ''
  })
  const [woAttachments, setWoAttachments] = useState<File[]>([])
  const [processingWo, setProcessingWo] = useState(false)
  const [editWoId, setEditWoId] = useState<string | null>(null)
  
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      // #15: Backend now includes workOrders in the response — no more N+1 calls
      const res = await api.get('/treatment-plans', {
        params: { patientId, status: 'ACTIVE', clinicId }
      })
      
      const plansData = res.data.data || []
      setPlans(plansData)
    } catch (err) {
      console.error('Failed to fetch treatment plans', err)
      toast.error('Gagal mengambil data rangkaian perawatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) {
      fetchPlans()
    }
  }, [patientId])

  // #9: Inline edit state for plan description
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editPlanDesc, setEditPlanDesc] = useState('')

  const handleEditPlan = async (plan: any) => {
    setEditingPlanId(plan.id)
    setEditPlanDesc(plan.description)
  }

  const handleSaveEditPlan = async (planId: string) => {
    if (!editPlanDesc.trim()) return
    try {
      await api.put(`/treatment-plans/${planId}`, { description: editPlanDesc })
      fetchPlans()
      toast.success('Berhasil mengubah rangkaian perawatan')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mengubah rangkaian perawatan')
    } finally {
      setEditingPlanId(null)
      setEditPlanDesc('')
    }
  }

  const handleDeletePlan = async (plan: any) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan/menghapus rangkaian perawatan ini? Data tidak dapat dikembalikan.")) return;
    try {
      await api.delete(`/treatment-plans/${plan.id}`);
      fetchPlans();
      toast.success("Berhasil membatalkan rangkaian perawatan");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menghapus rangkaian perawatan");
    }
  }

  const handleCreatePlan = async () => {
    if (!createForm.description) return toast.error('Deskripsi wajib diisi')
    try {
      setProcessingPlan(true)
      const resp = await api.post('/treatment-plans', {
        patientId,
        doctorId: doctorId || undefined,
        description: createForm.description,
        items: createForm.items
      })
      toast.success('Rangkaian Perawatan berhasil dibuat!')
      setShowCreatePlan(false)
      setCreateForm({ description: '', items: [] })
      setDetailModalPlanId(resp.data.plan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat rangkaian perawatan')
    } finally {
      setProcessingPlan(false)
    }
  }

  const handleSaveWorkOrder = async () => {
    if (!selectedPlanId && !editWoId) return
    if (!woForm.labName || !woForm.jobType || !woForm.material || !woForm.stage) {
      return toast.error('Lengkapi form Lab, Jenis Pekerjaan, Material, dan Tahapan')
    }
    
    try {
      setProcessingWo(true)
      const formData = new FormData()
      if (selectedPlanId) formData.append('treatmentPlanId', selectedPlanId)
      if (doctorId) formData.append('doctorId', doctorId)
      formData.append('labName', woForm.labName)
      formData.append('labContact', woForm.labContact)
      formData.append('labAddress', woForm.labAddress)
      formData.append('itemDescription', woForm.itemDescription)
      formData.append('jobType', woForm.jobType)
      formData.append('material', woForm.material)
      formData.append('stage', woForm.stage)
      formData.append('shade', woForm.shade)
      formData.append('size', woForm.size)
      formData.append('toothNumber', woForm.toothNumber)
      if (woForm.estimatedDate) formData.append('estimatedDate', woForm.estimatedDate)
      formData.append('labFee', String(woForm.labFee))
      formData.append('notes', woForm.notes)
      
      woAttachments.forEach(file => formData.append('attachments', file))

      if (editWoId) {
        await api.put(`/dental-lab/work-orders/${editWoId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('SPK Lab Eksternal berhasil diupdate!')
      } else {
        await api.post('/dental-lab/work-orders', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('SPK Lab Eksternal berhasil dibuat!')
      }
      
      setShowWorkOrderModal(false)
      setEditWoId(null)
      setWoForm({
        labName: '', labContact: '', labAddress: '', itemDescription: '', jobType: '', material: '', stage: '',
        shade: '', size: '', toothNumber: '', estimatedDate: '', labFee: 0, notes: ''
      })
      setWoAttachments([])
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan SPK')
    } finally {
      setProcessingWo(false)
    }
  }

  const handleDeleteWorkOrder = async () => {
    if (!editWoId) return
    if (!window.confirm('Hapus SPK ini?')) return
    try {
      setProcessingWo(true)
      await api.delete(`/dental-lab/work-orders/${editWoId}`)
      toast.success('SPK berhasil dihapus')
      setShowWorkOrderModal(false)
      setEditWoId(null)
      setWoForm({
        labName: '', labContact: '', labAddress: '', itemDescription: '', jobType: '', material: '', stage: '',
        shade: '', size: '', toothNumber: '', estimatedDate: '', labFee: 0, notes: ''
      })
      setWoAttachments([])
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus SPK')
    } finally {
      setProcessingWo(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setWoAttachments(prev => [...prev, ...filesArray])
    }
  }

  const handleUpdateWOStatus = async (woId: string, status: string, e?: any) => {
    if (e) e.stopPropagation()
    try {
      await api.patch(`/dental-lab/work-orders/${woId}/status`, { status })
      toast.success('Status SPK berhasil diperbarui')
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status SPK')
    }
  }

  const handleUpdateVisitStatus = async (planId: string, visitId: string, status: string, e?: any) => {
    if (e) e.stopPropagation()
    try {
      await api.put(`/treatment-plans/${planId}/visits/${visitId}/status`, { status })
      toast.success('Status tahapan berhasil diperbarui')
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status tahapan')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-100">
        <FiRefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Memuat Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <FiCheckCircle className="text-emerald-500" />
            Rangkaian Perawatan Aktif
          </h2>
          <p className="text-xs font-bold tracking-widest text-slate-400 mt-1 uppercase">
            {plans.length > 0 ? `${plans.length} Rangkaian Ditemukan` : 'Belum ada rangkaian aktif'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuidebook(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            title="Buku Panduan SOP Klinik"
          >
            <FiBookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setShowCreatePlan(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <FiPlus className="w-4 h-4" />
              Buat Rangkaian Baru
            </button>
          )}
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <FiAlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-1">Tidak Ada Rangkaian</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Pasien ini belum memiliki rangkaian perawatan aktif. Silakan buat baru jika diperlukan perawatan berkelanjutan atau pembuatan alat Lab.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 min-w-0">
                  {/* #9: Inline edit for description */}
                  {editingPlanId === plan.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editPlanDesc}
                        onChange={e => setEditPlanDesc(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEditPlan(plan.id); if (e.key === 'Escape') setEditingPlanId(null) }}
                      />
                      <button onClick={() => handleSaveEditPlan(plan.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><FiCheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => setEditingPlanId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><FiX className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{plan.description}</h3>
                      <button
                        onClick={() => setDetailModalPlanId(plan.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <FiEye className="w-3 h-3" /> View Detail
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-200">
                      Aktif
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {new Date(plan.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {/* #6: Use the correct plan's doctor, not plans[0] */}
                    {plan.doctor && (
                      <span className="text-[10px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">
                        <FiUserCheck className="w-3 h-3" /> dr. {plan.doctor.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                      title="Edit Rangkaian"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                      title="Batalkan / Hapus Rangkaian"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); setShowWorkOrderModal(true); }}
                      className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-sm border border-blue-100"
                    >
                      <HiOutlineBeaker className="w-4 h-4" />
                      Buat SPK Lab
                    </button>
                  </div>
                )}
              </div>

              {/* #8: DP Status Indicator */}
              {(() => {
                const invoices = plan.invoices || []
                const hasDp = invoices.some((inv: any) => inv.status === 'partial' || inv.status === 'paid')
                if (!hasDp && invoices.length > 0) {
                  return (
                    <div className="mt-3 mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2 relative z-10">
                      <FiAlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-orange-700">Pasien Belum DP — SPK akan disimpan sebagai Draft</p>
                    </div>
                  )
                }
                if (hasDp) {
                  return (
                    <div className="mt-3 mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 relative z-10">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">DP Sudah Dibayar</p>
                    </div>
                  )
                }
                return null
              })()}

              {/* Visits / Tahapan List (Compact) */}
              {plan.visits && plan.visits.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4 relative z-10">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <FiActivity className="w-3 h-3" /> Tahapan & Kunjungan ({plan.visits.length})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {plan.visits.map((visit: any, index: number) => {
                      const isSelesai = visit.status === 'SELESAI'
                      const isBerjalan = visit.status === 'BERJALAN'

                      let badgeBg = 'bg-slate-100 text-slate-400'
                      let statusBadge = 'bg-slate-100 text-slate-500'
                      if (isSelesai) {
                        badgeBg = 'bg-emerald-100 text-emerald-600'
                        statusBadge = 'bg-emerald-100 text-emerald-600'
                      } else if (isBerjalan) {
                        badgeBg = 'bg-blue-100 text-blue-600'
                        statusBadge = 'bg-blue-100 text-blue-600'
                      }

                      return (
                        <div key={visit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${badgeBg}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-800 uppercase">Kunjungan Tahap ke-{visit.order}</div>
                              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${statusBadge}`}>
                                  {isSelesai ? 'Selesai' : isBerjalan ? 'Berjalan' : 'Belum'}
                                </span>
                                <span>•</span>
                                <span>{visit.services?.length || 0} Tindakan</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {!isSelesai && !isReadOnly && (
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              {!isBerjalan && (
                                <button
                                  onClick={(e) => handleUpdateVisitStatus(plan.id, visit.id, 'BERJALAN', e)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                  <FiPlay className="w-3 h-3" /> Mulai
                                </button>
                              )}
                              <button
                                onClick={(e) => handleUpdateVisitStatus(plan.id, visit.id, 'SELESAI', e)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                              >
                                <FiCheckCircle className="w-3 h-3" /> Selesai
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Work Orders List — #1: Use synced status config */}
              {plan.workOrders && plan.workOrders.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4 relative z-10">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <FiFileText className="w-3 h-3" /> Dokumen SPK Lab Eksternal ({plan.workOrders.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.workOrders.map((wo: any) => {
                      const cfg = WO_STATUS_CONFIG[wo.status as WorkOrderStatus] || WO_STATUS_CONFIG.DRAFT
                      const WOIcon = cfg.icon
                      return (
                        <div key={wo.id} className={`flex flex-col p-4 rounded-xl border ${cfg.border} ${cfg.bg} hover:bg-white transition-colors group/wo relative`}>
                          <div 
                            className="flex justify-between items-start mb-3 cursor-pointer"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setWoForm({
                                labName: wo.labName || '',
                                labContact: wo.labContact || '',
                                labAddress: wo.labAddress || '',
                                itemDescription: wo.itemDescription || '',
                                jobType: wo.jobType || '',
                                material: wo.material || '',
                                stage: wo.stage || '',
                                shade: wo.shade || '',
                                size: wo.size || '',
                                toothNumber: wo.toothNumber || '',
                                estimatedDate: wo.estimatedDate ? wo.estimatedDate.substring(0, 10) : '',
                                labFee: wo.labFee || 0,
                                notes: wo.notes || ''
                              });
                              setEditWoId(wo.id);
                              setShowWorkOrderModal(true);
                            }}
                          >
                            <div>
                              <span className="text-xs font-black text-slate-800 uppercase block">{wo.labName}</span>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{wo.itemDescription}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                              <WOIcon className="w-3.5 h-3.5" />{cfg.label}
                            </span>
                          </div>

                          {/* Mini Timeline */}
                          <div className="mb-4">
                            <div className="relative flex items-center justify-between mt-2">
                              <div className="absolute left-0 right-0 h-0.5 bg-slate-200/50 top-1/2 -translate-y-1/2 rounded-full" />
                              <div className="absolute left-0 h-0.5 bg-emerald-400 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500" 
                                style={{ width: wo.status === 'FITTED' ? '100%' : wo.status === 'RECEIVED' ? '66%' : wo.status === 'SENT_TO_LAB' ? '33%' : '0%' }}
                              />
                              
                              {[
                                { key: 'DRAFT', label: 'Dibuat', done: true },
                                { key: 'SENT_TO_LAB', label: 'Di Lab', done: ['SENT_TO_LAB', 'RECEIVED', 'FITTED'].includes(wo.status) },
                                { key: 'RECEIVED', label: 'Diterima', done: ['RECEIVED', 'FITTED'].includes(wo.status) },
                                { key: 'FITTED', label: 'Dipasang', done: wo.status === 'FITTED' },
                              ].map((step, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                                  <div className={`w-3 h-3 rounded-full border-2 ${step.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`} />
                                  <span className={`text-[8px] font-black uppercase tracking-widest ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-200/60 pt-3 gap-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{wo.jobType}</span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{new Date(wo.createdAt).toLocaleDateString('id-ID')}</span>
                            </div>
                            
                            {/* Update Status UI */}
                            {!isReadOnly && wo.status !== 'CANCELLED' && wo.status !== 'DRAFT' && wo.status !== 'PENDING_DP' && (
                              <div className="flex items-center gap-2">
                                {wo.status === 'RECEIVED' ? (
                                  <button
                                    onClick={(e) => handleUpdateWOStatus(wo.id, 'FITTED', e)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5"
                                  >
                                    <FiCheckCircle className="w-3.5 h-3.5" /> Tandai Dipasang
                                  </button>
                                ) : (
                                  <select 
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                                    value={wo.status}
                                    onChange={(e) => handleUpdateWOStatus(wo.id, e.target.value, e)}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="SENT_TO_LAB">Status: Di Lab</option>
                                    <option value="RECEIVED">Ubah -&gt; Diterima</option>
                                    {wo.status === 'FITTED' && <option value="FITTED">Status: Dipasang</option>}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* #19: Link to Lab Monitoring page */}
              <div className="mt-4 pt-3 border-t border-slate-100 relative z-10">
                <a
                  href="/doctor/lab-monitoring"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 py-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiArrowRight className="w-3.5 h-3.5" /> Monitoring Lab Eksternal
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE PLAN */}
      {mounted && createPortal(
        <AnimatePresence>
          {showCreatePlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !processingPlan && setShowCreatePlan(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <FiPlus className="text-blue-500" /> Rangkaian Baru
                  </h3>
                  <button onClick={() => !processingPlan && setShowCreatePlan(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <FiX />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Deskripsi Rangkaian *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Perawatan Karies Gigi 46 & 47"
                      value={createForm.description}
                      onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 mt-auto">
                  <button onClick={() => setShowCreatePlan(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                    Batal
                  </button>
                  <button 
                    onClick={handleCreatePlan} 
                    disabled={processingPlan}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                  >
                    {processingPlan ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                    Simpan & Lanjutkan
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* MODAL: CREATE WORK ORDER */}
          {showWorkOrderModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !processingWo && setShowWorkOrderModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                      <FiDroplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                        {editWoId ? 'EDIT SPK LAB EKSTERNAL' : 'BUAT SPK LAB EKSTERNAL'}
                      </h3>
                      <p className="text-xs font-medium text-slate-400">Surat Perintah Kerja ke Dental Lab</p>
                    </div>
                  </div>
                  <button onClick={() => !processingWo && setShowWorkOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <FiX />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  {/* Patient Info Box */}
                  {(() => {
                    const selectedPlan = plans.find(p => p.id === (selectedPlanId || plans.find(pl => pl.workOrders?.some((wo:any) => wo.id === editWoId))?.id));
                    const patientInfo = selectedPlan?.patient || (plans.length > 0 ? plans[0].patient : null);
                    if (!patientInfo) return null;
                    return (
                      <div className="mb-6 bg-[#f0f7ff] rounded-xl p-4 border border-[#e0f0ff]">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">PASIEN</h4>
                        <p className="text-sm font-bold text-slate-800 mb-1">{patientInfo.name}</p>
                        <p className="text-xs text-slate-500 mb-0.5 font-mono">RM-{patientInfo.medicalRecordNo} • {selectedPlan?.description || 'Rangkaian Perawatan'}</p>
                        <p className="text-xs text-slate-500 font-mono">Umur: {patientInfo.dateOfBirth ? Math.floor((new Date().getTime() - new Date(patientInfo.dateOfBirth).getTime()) / 31557600000) : '-'} tahun • {patientInfo.gender || 'UNKNOWN'}</p>
                      </div>
                    );
                  })()}

                  <div className="space-y-5">
                    {/* Lab Name */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiDroplet /> NAMA DENTAL LAB *</label>
                      <input type="text" placeholder="Misal: Dental Lab Sejahtera / UD. Karya Gigi" value={woForm.labName} onChange={e => setWoForm({...woForm, labName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kontak Lab */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiPhone /> KONTAK LAB</label>
                        <input type="text" placeholder="No. Telp / WhatsApp" value={woForm.labContact} onChange={e => setWoForm({...woForm, labContact: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                      </div>
                      {/* Biaya Lab */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiDollarSign /> BIAYA KE LAB (RP)</label>
                        <input type="number" placeholder="0" value={woForm.labFee || ''} onChange={e => setWoForm({...woForm, labFee: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* #2: Jenis Pekerjaan — synced with admin page */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">JENIS PEKERJAAN *</label>
                        <select value={woForm.jobType} onChange={e => setWoForm({...woForm, jobType: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-white">
                          <option value="">Pilih Pekerjaan</option>
                          <option value="Crown">Crown</option>
                          <option value="Bridge">Bridge</option>
                          <option value="Inlay">Inlay</option>
                          <option value="Onlay">Onlay</option>
                          <option value="Veneer">Veneer</option>
                          <option value="Gigi Tiruan Sebagian (GTSL)">Gigi Tiruan Sebagian (GTSL)</option>
                          <option value="Gigi Tiruan Lengkap (GTL)">Gigi Tiruan Lengkap (GTL)</option>
                          <option value="Orthodontic Appliance">Orthodontic Appliance</option>
                        </select>
                      </div>
                      {/* #2: Material — synced with admin page */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">MATERIAL *</label>
                        <select value={woForm.material} onChange={e => setWoForm({...woForm, material: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-white">
                          <option value="">Pilih Material</option>
                          <option value="Zirconia">Zirconia</option>
                          <option value="E-Max">E-Max</option>
                          <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                          <option value="Full Metal">Full Metal</option>
                          <option value="Akrilik">Akrilik</option>
                          <option value="Valplast">Valplast (Flexi)</option>
                          <option value="Composite">Composite</option>
                        </select>
                      </div>
                    </div>

                    {/* #20: Stage — synced with admin page */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">TAHAPAN PEKERJAAN (STAGE) *</label>
                      <select value={woForm.stage} onChange={e => setWoForm({...woForm, stage: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-white">
                        <option value="">Pilih Tahapan</option>
                        <option value="Bite Registration">Bite Registration (Gigitan)</option>
                        <option value="Try-in Coping">Try-in Coping / Rangka</option>
                        <option value="Try-in Gigi">Try-in Gigi (Penyusunan gigi)</option>
                        <option value="Finish / Pasang">Finish / Pasang</option>
                        <option value="Reparasi">Reparasi</option>
                      </select>
                    </div>

                    {/* #6: DPJP — use the correct plan's doctor, not plans[0] */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">DPJP / DOKTER *</label>
                      <div className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-slate-50 text-slate-500 cursor-not-allowed">
                        {(() => {
                          const targetPlan = plans.find(p => p.id === (selectedPlanId || plans.find(pl => pl.workOrders?.some((wo:any) => wo.id === editWoId))?.id))
                          return targetPlan?.doctor?.name || doctorId ? (targetPlan?.doctor?.name || 'Dokter') : 'Dokter (Saat Ini)'
                        })()}
                      </div>
                    </div>

                    {/* Deskripsi Tambahan */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">DESKRIPSI / INFORMASI TAMBAHAN (OPSIONAL)</label>
                      <input type="text" placeholder="Informasi tambahan jika perlu..." value={woForm.itemDescription} onChange={e => setWoForm({...woForm, itemDescription: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nomor Gigi */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">NOMOR GIGI</label>
                        <input type="text" placeholder="Misal: 36 / 11, 12" value={woForm.toothNumber} onChange={e => setWoForm({...woForm, toothNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                      </div>
                      {/* Shade / Warna Gigi */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">SHADE / WARNA GIGI</label>
                        <input type="text" placeholder="Misal: A1 / A2 / B2 / Natural" value={woForm.shade} onChange={e => setWoForm({...woForm, shade: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Ukuran */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">UKURAN / CETAKAN</label>
                        <input type="text" placeholder="Misal: L / XL / Cetakan Algina" value={woForm.size} onChange={e => setWoForm({...woForm, size: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
                      </div>
                      {/* Estimasi Selesai */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiCalendar /> ESTIMASI SELESAI LAB</label>
                        <input type="date" value={woForm.estimatedDate} onChange={e => setWoForm({...woForm, estimatedDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-white" />
                      </div>
                    </div>

                    {/* Catatan Dokter */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">CATATAN DOKTER KE LAB</label>
                      <textarea rows={3} placeholder="Instruksi khusus untuk lab, preferensi bahan, dll..." value={woForm.notes} onChange={e => setWoForm({...woForm, notes: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300 resize-none" />
                    </div>

                    {/* Lampiran */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FiUploadCloud /> LAMPIRAN FILE (FOTO 2D / 3D SCAN .STL / .OBJ)</label>
                      <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <input type="file" id="wo-files-new" multiple onChange={handleFileChange} className="hidden" />
                          <label htmlFor="wo-files-new" className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap">
                            Choose Files
                          </label>
                          <span className="text-xs text-slate-500 truncate flex-1">
                            {woAttachments.length > 0 ? `${woAttachments.length} file dipilih` : 'No file chosen'}
                          </span>
                        </div>
                      </div>
                      {woAttachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {woAttachments.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700">
                              <span className="truncate max-w-[150px]">{f.name}</span>
                              <button onClick={() => setWoAttachments(woAttachments.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><FiX /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-2 pb-6 flex flex-col gap-3">
                  {editWoId && (
                    <div className="flex justify-end">
                      <button 
                        onClick={handleDeleteWorkOrder} 
                        disabled={processingWo}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {processingWo ? 'Menghapus...' : 'Hapus SPK'}
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={handleSaveWorkOrder} 
                    disabled={processingWo}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingWo ? <FiRefreshCw className="animate-spin" /> : <FiDroplet />}
                    {editWoId ? 'UPDATE SURAT PERINTAH KERJA' : 'BUAT SURAT PERINTAH KERJA'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL: DETAIL RANGKAIAN (DARK) */}
      {detailModalPlanId && (
        <TreatmentSeriesDetailModal
          isOpen={!!detailModalPlanId}
          onClose={() => { setDetailModalPlanId(null); fetchPlans(); }}
          planId={detailModalPlanId}
          userRole="DOCTOR"
        />
      )}
      
      {/* Guidebook Modal */}
      <GuidebookModal 
        isOpen={showGuidebook} 
        onClose={() => setShowGuidebook(false)} 
      />

    </div>
  )
}
