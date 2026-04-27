'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft, Plus, Search, MapPin, 
  CheckCircle, Truck, PackageCheck, AlertTriangle,
  RefreshCw, MapIcon, ChevronRight, LocateFixed
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Transfer {
  id: string
  transferNo: string
  sourceBranchId: string
  destBranchId: string
  productId: string
  quantity: number
  status: string
  createdAt: string
  transferCost: number | null
  sourceBranch?: { name: string }
  destBranch?: { name: string }
  product?: { productName: string; productCode: string }
}

export default function TransferListPage() {
  const router = useRouter()
  const { activeClinicId, user } = useAuthStore()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL') // ALL, IN, OUT
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const fetchTransfers = async () => {
    try {
      if (!activeClinicId) return
      setIsLoading(true)
      const res = await api.get('/inventory/transfer', {
        params: { 
           branchId: activeClinicId, 
           type: filterType === 'ALL' ? undefined : filterType 
        }
      })
      setTransfers(res.data)
    } catch (error) {
      toast.error('Gagal mengambil data transfer')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [activeClinicId, filterType])

  const handleApproveHQ = async (id: string) => {
    try {
      setIsProcessing(id)
      await api.patch(`/inventory/transfer/${id}/approve`)
      toast.success('Persetujuan berhasil')
      fetchTransfers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyetujui')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleShip = async (id: string) => {
    const cost = prompt('Masukkan estimasi biaya pengiriman (Opsional):', '0')
    try {
      setIsProcessing(id)
      await api.post(`/inventory/transfer/${id}/ship`, { transferCost: Number(cost) || 0 })
      toast.success('Barang dalam pengiriman (Transit)')
      fetchTransfers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal melakukan pengiriman')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReceive = async (id: string) => {
    try {
      setIsProcessing(id)
      await api.post(`/inventory/transfer/${id}/receive`)
      toast.success('Barang diterima')
      fetchTransfers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menerima barang')
    } finally {
      setIsProcessing(null)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-40">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
             <div className="p-3.5 bg-blue-50 rounded-[2rem] shadow-sm">
                <ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
             </div>
             <div>
                <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight">Transfer Stok</h1>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Pergerakan Barang Antar Cabang</p>
             </div>
          </div>
          
          <div className="flex bg-gray-100/60 p-1.5 rounded-[2.5rem] w-full lg:w-fit overflow-x-auto no-scrollbar">
             {[
               { id: 'ALL', label: 'SEMUA ARAH', color: 'gray' },
               { id: 'IN', label: 'MASUK (IN)', color: 'green' },
               { id: 'OUT', label: 'KELUAR (OUT)', color: 'blue' }
             ].map((btn) => (
                <button 
                   key={btn.id} onClick={() => setFilterType(btn.id)}
                   className={`flex-1 lg:flex-none whitespace-nowrap px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === btn.id ? 'bg-white shadow-xl shadow-gray-200/50 text-gray-900 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                   {btn.label}
                </button>
             ))}
          </div>
       </div>

       {/* Transfer Content */}
       <div className="space-y-4">
          <AnimatePresence mode="popLayout">
             {isLoading ? (
                <div className="py-24 text-center">
                   <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4 opacity-30" />
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Checking Logistics...</p>
                </div>
             ) : transfers.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 border-2 border-dashed border-gray-100 text-center">
                   <LocateFixed className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                   <h3 className="text-gray-900 font-black text-lg uppercase">Kosong</h3>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 leading-none">Tidak ada log transfer untuk kriteria ini</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-5 lg:gap-4">
                   {transfers.map((t) => {
                      const isDest = activeClinicId === t.destBranchId
                      const isSource = activeClinicId === t.sourceBranchId
                      
                      return (
                         <motion.div 
                           key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                           className="bg-white border border-gray-50 rounded-[2.5rem] md:rounded-[3rem] p-6 lg:p-8 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group relative overflow-hidden"
                         >
                            {/* Visual Direction Indicator (Samping) */}
                            <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${isDest ? 'bg-green-500' : 'bg-blue-500'} opacity-20`} />
                            
                            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                               {/* 1. Referensi & Item */}
                               <div className="lg:col-span-4 w-full">
                                  <div className="flex items-center gap-4">
                                     <div className={`p-4 rounded-3xl ${isDest ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'} transition-all group-hover:scale-110`}>
                                        <Truck className="w-7 h-7" />
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-base font-black text-gray-900 uppercase leading-none truncate group-hover:text-blue-600 transition-colors">{t.transferNo}</p>
                                        <p className="text-[11px] font-bold text-gray-500 mt-2 line-clamp-1 italic uppercase tracking-tight">{t.product?.productName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t.product?.productCode}</span>
                                           <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                           <span className="text-[9px] font-black text-gray-900">{t.quantity} <span className="text-gray-300">Unit</span></span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               {/* 2. Rute Visual (Modern Route UI) */}
                               <div className="lg:col-span-4 w-full bg-gray-50/50 p-5 rounded-[2rem] border border-gray-50">
                                  <div className="flex items-center justify-between gap-4">
                                     <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Dari Cabang</p>
                                        <div className={`w-full py-2 px-3 rounded-xl border text-center transition-all ${isSource ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}>
                                           <p className="text-[10px] font-black uppercase truncate">{t.sourceBranch?.name}</p>
                                        </div>
                                     </div>
                                     <div className="flex flex-col items-center">
                                         <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm relative">
                                            <ArrowRightLeft className="w-3.5 h-3.5 group-hover:rotate-180 transition-all duration-700" />
                                         </div>
                                     </div>
                                     <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Ke Cabang</p>
                                        <div className={`w-full py-2 px-3 rounded-xl border text-center transition-all ${isDest ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}>
                                           <p className="text-[10px] font-black uppercase truncate">{t.destBranch?.name}</p>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               {/* 3. Status & Tindakan */}
                               <div className="lg:col-span-4 w-full flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4">
                                  <div className={`px-5 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                                     t.status === 'REQUESTED' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                     t.status === 'HQ_APPROVED' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                     t.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' :
                                     'bg-green-50 text-green-600 border-green-100'
                                  }`}>
                                     {t.status.replace('_', ' ')}
                                  </div>

                                  <div className="flex items-center gap-2">
                                     {t.status === 'REQUESTED' && isSuperAdmin && (
                                        <button onClick={() => handleApproveHQ(t.id)} className="px-5 py-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                           APPROVE HQ
                                        </button>
                                     )}
                                     {t.status === 'HQ_APPROVED' && isSource && (
                                        <button onClick={() => handleShip(t.id)} className="px-5 py-3 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                           KIRIM (SHIP)
                                        </button>
                                     )}
                                     {t.status === 'IN_TRANSIT' && isDest && (
                                        <button onClick={() => handleReceive(t.id)} className="px-5 py-3 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                           TERIMA BARCODE
                                        </button>
                                     )}
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                      )
                   })}
                </div>
             )}
          </AnimatePresence>
       </div>
    </div>
  )
}
