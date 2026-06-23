'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCheckCircle, FiRefreshCw, FiSearch, FiPlus, FiTrash2, FiActivity, FiChevronDown } from 'react-icons/fi'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'

interface TreatmentStepModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  planId: string
  visitData?: any // if editing existing visit
  userRole: string
  nextOrder?: number
}

export default function TreatmentStepModal({ isOpen, onClose, onSuccess, planId, visitData, userRole, nextOrder }: TreatmentStepModalProps) {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<any[]>([]) // master data
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // form state
  const [visitDate, setVisitDate] = useState('')
  const [selectedServices, setSelectedServices] = useState<{serviceId: string, name: string, price: number, quantity: number}[]>([])
  
  useEffect(() => {
    if (isOpen) {
      fetchMasterServices()
      if (visitData) {
        setVisitDate(visitData.visitDate ? new Date(visitData.visitDate).toISOString().slice(0,10) : '')
        if (visitData.services) {
          setSelectedServices(visitData.services.map((s: any) => ({
            serviceId: s.serviceId,
            name: s.service?.serviceName || 'Tindakan',
            price: s.price,
            quantity: s.quantity
          })))
        }
      } else {
        setVisitDate('')
        setSelectedServices([])
      }
    }
  }, [isOpen, visitData])

  const fetchMasterServices = async () => {
    try {
      const res = await api.get('/master/services')
      setServices(res.data.data || res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddService = (svc: any) => {
    if (selectedServices.find(s => s.serviceId === svc.id)) return toast.error('Tindakan sudah dipilih')
    setSelectedServices([...selectedServices, { serviceId: svc.id, name: svc.serviceName, price: svc.price, quantity: 1 }])
  }

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId))
  }

  const handleSubmit = async () => {
    if (selectedServices.length === 0) return toast.error('Pilih minimal satu tindakan')
    
    try {
      setLoading(true)
      if (visitData) {
        // Edit mode - depending on role we call different endpoints
        if (userRole === 'DOCTOR') {
           await api.put(`/treatment-plans/${planId}/visits/${visitData.id}/services`, {
             services: selectedServices
           })
           // Doctor is now allowed to edit schedule
           await api.put(`/treatment-plans/${planId}/visits/${visitData.id}/schedule`, {
             visitDate: visitDate || null
           })
        }
        toast.success('Tahap berhasil diperbarui')
      } else {
        // Create mode
        await api.post(`/treatment-plans/${planId}/visits`, {
          visitDate: visitDate || null,
          services: selectedServices
        })
        toast.success('Tahap baru berhasil ditambahkan')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan tahap')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const filteredServices = services.filter(s => s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const totalCost = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && onClose()} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 md:p-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><FiActivity className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{visitData ? 'Edit Tahap' : 'Tambah Tahap Baru'}</h3>
            </div>
            <button onClick={() => !loading && onClose()} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50"><FiX className="w-5 h-5" /></button>
          </div>

          {/* Tahap Order Info */}
          <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <h4 className="text-blue-900 font-bold text-sm">Tahap / Kunjungan</h4>
              <p className="text-blue-600/70 text-xs mt-0.5">Semua tindakan di bawah akan masuk ke tahap ini</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl font-black text-blue-600 border border-blue-100">
              {visitData ? visitData.order : (nextOrder || '-')}
            </div>
          </div>

          {/* Date Picker (Admin / Receptionist mainly, but allow doctor to set initial date if needed) */}
          <div className="mb-5">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Jadwal Kunjungan (Opsional)</label>
             <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50" />
          </div>

          {/* Service Selector */}
          <div className="mb-5 relative">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cari Tindakan / Layanan *</label>
             <div className="relative">
               <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery} 
                 onChange={e => {
                   setSearchQuery(e.target.value)
                   setIsDropdownOpen(true)
                 }} 
                 onFocus={() => setIsDropdownOpen(true)}
                 placeholder="Ketik nama tindakan..." 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-all" 
               />
               <button 
                 type="button"
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className="absolute right-4 top-3.5 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200"
               >
                 <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
               </button>
             </div>
             
             {isDropdownOpen && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                 <div className="absolute z-20 mt-2 w-full border border-gray-100 bg-white rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                   {filteredServices.length === 0 ? (
                     <div className="p-3 text-xs text-gray-500 text-center">Tindakan tidak ditemukan</div>
                   ) : (
                     filteredServices.map(svc => (
                       <div key={svc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 relative z-20">
                         <div>
                           <p className="text-xs font-bold text-gray-800">{svc.serviceName}</p>
                           <p className="text-[10px] text-gray-500">Rp {svc.price.toLocaleString('id-ID')}</p>
                         </div>
                         <button 
                           onClick={() => { 
                             handleAddService(svc); 
                             setIsDropdownOpen(false); 
                             setSearchQuery(''); 
                           }} 
                           className="text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100"
                         >
                           <FiPlus />
                         </button>
                       </div>
                     ))
                   )}
                 </div>
               </>
             )}
          </div>

          {/* Selected Services */}
          <div>
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tindakan Terpilih</label>
             {selectedServices.length === 0 ? (
               <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">Belum ada tindakan dipilih</div>
             ) : (
               <div className="space-y-2">
                 {selectedServices.map(svc => (
                   <div key={svc.serviceId} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{svc.name}</p>
                        <p className="text-[10px] text-gray-500">Rp {svc.price.toLocaleString('id-ID')} x {svc.quantity}</p>
                      </div>
                      <button onClick={() => handleRemoveService(svc.serviceId)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                   </div>
                 ))}
               </div>
             )}
             <div className="mt-4 flex justify-between items-center p-4 bg-blue-50 rounded-xl text-blue-900">
               <span className="text-xs font-black uppercase tracking-widest">Total Harga</span>
               <span className="text-lg font-black">Rp {totalCost.toLocaleString('id-ID')}</span>
             </div>
          </div>

        </div>
        <div className="p-6 md:p-8 pt-0 mt-auto flex justify-end gap-3 border-t border-gray-100 pt-6">
           <button onClick={() => onClose()} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Batal</button>
           <button onClick={handleSubmit} disabled={loading || selectedServices.length === 0} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50">
             {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
             Simpan Tahap
           </button>
        </div>
      </motion.div>
    </div>
  )
}
