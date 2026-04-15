'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, Plus, Search, Filter, 
  FileText, CheckCircle, Clock, Truck, 
  Package, MoreVertical, RefreshCw, ChevronRight
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'

interface Procurement {
  id: string
  procurementNo: string
  type: 'MEDICINE' | 'ASSET' | 'GENERAL'
  status: string
  totalAmount: number
  createdAt: string
  vendor?: { name: string }
  _count: { items: number }
}

export default function ProcurementListPage() {
  const router = useRouter()
  const { activeClinicId } = useAuthStore()
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchProcurements = async () => {
    try {
      if (!activeClinicId) return
      setIsLoading(true)
      const res = await api.get('/inventory/procurement', {
        params: { branchId: activeClinicId, status: filterStatus === 'all' ? undefined : filterStatus }
      })
      setProcurements(res.data)
    } catch (error) {
      console.error(error)
      toast.error('Gagal mengambil data pengadaan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProcurements()
  }, [activeClinicId, filterStatus])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'APPROVED': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'RECEIVED': return 'bg-green-50 text-green-700 border-green-200'
      case 'COMPLETED': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            Daftar Pengadaan (PR/PO)
          </h1>
          <p className="text-gray-500 font-medium mt-1">Kelola permohonan pembelian dan penerimaan barang.</p>
        </div>
        
        <button 
          onClick={() => router.push('/admin/inventory/procurement/new')}
          className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          BUAT PR BARU
        </button>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
              <Clock className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Menunggu Approval</p>
              <p className="text-2xl font-black text-gray-900">{procurements.filter(p => p.status === 'PENDING_APPROVAL').length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <Truck className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sedang Diproses</p>
              <p className="text-2xl font-black text-gray-900">{procurements.filter(p => p.status === 'APPROVED').length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="p-4 bg-green-50 rounded-2xl text-green-600">
              <CheckCircle className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selesai Bulan Ini</p>
              <p className="text-2xl font-black text-gray-900">{procurements.filter(p => p.status === 'RECEIVED').length}</p>
           </div>
        </div>
      </div>

      {/* Filter Status */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 w-fit ring-1 ring-gray-50">
          {['all', 'PENDING_APPROVAL', 'APPROVED', 'RECEIVED'].map((s) => (
            <button 
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-[0.1em] uppercase transition-all ${filterStatus === s ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
      </div>

      {/* Procurement List */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden ring-1 ring-gray-100">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/50">
                     <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No. PR / Jenis</th>
                     <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vendor</th>
                     <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Item</th>
                     <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Pengajuan</th>
                     <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                     <th className="px-8 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Memuat data...</p>
                      </td>
                    </tr>
                  ) : procurements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Belum ada pengadaan.</p>
                        <button 
                          onClick={() => router.push('/admin/inventory/procurement/new')}
                          className="mt-4 text-primary font-black text-xs hover:underline uppercase tracking-widest"
                        >
                          Klik untuk membuat PR pertama
                        </button>
                      </td>
                    </tr>
                  ) : (
                    procurements.map((p, idx) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={p.id}
                        onClick={() => router.push(`/admin/inventory/procurement/${p.id}`)}
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="font-black text-gray-900 uppercase tracking-tight">{p.procurementNo}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.type}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-bold text-gray-700">{p.vendor?.name || '-'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-gray-900">{p._count.items}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase uppercase tracking-widest">Varian</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-gray-900">Rp {p.totalAmount.toLocaleString('id-ID')}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest inline-block ${getStatusStyle(p.status)}`}>
                              {p.status.replace('_', ' ')}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </td>
                      </motion.tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
