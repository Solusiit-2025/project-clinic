'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft, Plus, Search, MapPin, 
  CheckCircle, Truck, PackageCheck, AlertTriangle 
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
    <div className="p-6 w-full mx-auto min-h-screen">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-2xl">
                   <ArrowRightLeft className="w-8 h-8 text-blue-600" />
                </div>
                Transfer Barang Antar-Cabang
             </h1>
             <p className="text-gray-500 font-medium mt-1">Pantau pergerakan stok keluar dan masuk cabang.</p>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filterType === 'ALL' ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
             >
                SEMUA ARAH
             </button>
             <button 
                onClick={() => setFilterType('IN')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filterType === 'IN' ? 'bg-green-600 text-white shadow-xl shadow-green-200' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
             >
                MASUK (IN)
             </button>
             <button 
                onClick={() => setFilterType('OUT')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filterType === 'OUT' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
             >
                KELUAR (OUT)
             </button>
          </div>
       </div>

       <div className="bg-white border border-gray-100 shadow-2xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-gray-50/50">
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Referensi & Item</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rute Pengiriman</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kuantitas</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Tindakan</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {isLoading ? (
                      <tr><td colSpan={5} className="p-10 text-center font-bold text-gray-400">Memuat...</td></tr>
                   ) : transfers.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center font-bold text-gray-400">Tidak ada riwayat transfer.</td></tr>
                   ) : (
                      transfers.map((t) => {
                         const isDest = activeClinicId === t.destBranchId
                         const isSource = activeClinicId === t.sourceBranchId
                         
                         return (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                               <td className="px-6 py-5 border-l-4 border-transparent" style={{ borderLeftColor: isDest ? '#10b981' : '#3b82f6' }}>
                                  <p className="font-black text-gray-900">{t.transferNo}</p>
                                  <p className="text-xs font-bold text-gray-500 mt-1">{t.product?.productName}</p>
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.product?.productCode}</span>
                               </td>
                               <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${isSource ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {t.sourceBranch?.name}
                                     </span>
                                     <ArrowRightLeft className="w-3 h-3 text-gray-300" />
                                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${isDest ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {t.destBranch?.name}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-6 py-5">
                                  <span className="text-lg font-black text-gray-900">{t.quantity}</span>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unit</span>
                               </td>
                               <td className="px-6 py-5">
                                  <div className={`inline-flex px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                                     t.status === 'REQUESTED' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                     t.status === 'HQ_APPROVED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                     t.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                     'bg-green-50 text-green-600 border-green-100'
                                  }`}>
                                     {t.status.replace('_', ' ')}
                                  </div>
                               </td>
                               <td className="px-6 py-5 text-right space-x-2">
                                  {t.status === 'REQUESTED' && isSuperAdmin && (
                                     <button onClick={() => handleApproveHQ(t.id)} disabled={isProcessing === t.id} className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 disabled:opacity-50">
                                        Approve HQ
                                     </button>
                                  )}
                                  {t.status === 'HQ_APPROVED' && isSource && (
                                     <button onClick={() => handleShip(t.id)} disabled={isProcessing === t.id} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        Kirim (Ship)
                                     </button>
                                  )}
                                  {t.status === 'IN_TRANSIT' && isDest && (
                                     <button onClick={() => handleReceive(t.id)} disabled={isProcessing === t.id} className="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-700 disabled:opacity-50">
                                        Terima BarCode
                                     </button>
                                  )}
                               </td>
                            </tr>
                         )
                      })
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}
