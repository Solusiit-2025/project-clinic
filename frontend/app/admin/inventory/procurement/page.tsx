'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, Plus, FileText, CheckCircle, 
  Clock, Truck, Package, RefreshCw, ChevronRight,
  TrendingUp, ArrowRight, Layers, Edit, Trash2
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
  items?: { product: { productName: string } }[]
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Yakin ingin menghapus pengadaan ini?')) return
    try {
      await api.delete(`/inventory/procurement/${id}`)
      toast.success('Pengadaan berhasil dihapus')
      fetchProcurements()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Gagal menghapus pengadaan')
    }
  }

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    router.push(`/admin/inventory/procurement/${id}/edit`)
  }

  useEffect(() => {
    fetchProcurements()
  }, [activeClinicId, filterStatus])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'APPROVED': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'PARTIAL_RECEIVED': return 'bg-red-50 text-red-700 border-red-100'
      case 'RECEIVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'COMPLETED': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  return (
    <div className="p-4 md:p-8 w-full min-h-screen pb-40">
      {/* Dynamic Header - More Compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Procurement System</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Pengadaan Obat dan Alkes</h1>
        </div>
        
        <button 
          onClick={() => router.push('/admin/inventory/procurement/new')}
          className="px-6 py-3.5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          BUAT PO BARU
        </button>
      </div>

      {/* New Stats Grid - 3 Columns on Mobile without horizontal scroll */}
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        {[
          { label: 'WAITING', val: procurements.filter(p => p.status === 'PENDING_APPROVAL').length, color: 'amber' },
          { label: 'TRANSIT', val: procurements.filter(p => p.status === 'APPROVED').length, color: 'blue' },
          { label: 'DONE', val: procurements.filter(p => p.status === 'RECEIVED').length, color: 'emerald' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-3.5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all">
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-primary">{s.label}</p>
             <p className={`text-xl font-black text-gray-900 leading-none mb-1`}>{s.val}</p>
             <div className={`w-1 h-1 rounded-full bg-${s.color}-500/40`} />
          </div>
        ))}
      </div>

      {/* Filter Tabs - Pill Style (Smaller) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-8">
        {['all', 'PENDING_APPROVAL', 'APPROVED', 'RECEIVED'].map((s) => (
          <button 
            key={s} onClick={() => setFilterStatus(s)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[9px] font-black tracking-widest uppercase transition-all border ${filterStatus === s ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            {s === 'all' ? 'SEMUA' : s.replace('PENDING_', '').replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4 opacity-20" />
            </div>
          ) : procurements.length === 0 ? (
            <div className="bg-gray-50/50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-white">
               <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kosong</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {procurements.map((p, idx) => (
                <motion.div 
                   key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                   onClick={() => router.push(`/admin/inventory/procurement/${p.id}`)}
                   className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.99] overflow-hidden"
                >
                   {/* Mobile View */}
                   <div className="md:hidden">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <FileText className="w-3.5 h-3.5 text-primary" />
                             <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter truncate max-w-[140px]">{p.procurementNo}</p>
                         </div>
                         <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(p.status)}`}>
                            {p.status.split('_')[0].replace('PENDING', 'WAIT')}
                         </div>
                      </div>
                      
                      <div className="p-5 flex flex-col gap-5">
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Supplier</p>
                               <p className="text-xs font-bold text-gray-800 truncate uppercase">{p.vendor?.name || 'BELUM DITUNJUK'}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Varian</p>
                               <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg uppercase">{p._count.items} SKU</span>
                            </div>
                         </div>
                          
                         {p.items && p.items.length > 0 && (
                             <p className="text-[10px] italic text-gray-500 mt-2 break-words whitespace-normal leading-relaxed">
                                {p.items.map((i: any) => i.product?.productName).filter(Boolean).join(', ')}
                             </p>
                          )}

                         <div className="flex items-end justify-between">
                            <div>
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimasi Total</p>
                               <p className="text-xl font-black text-indigo-600 tracking-tight">Rp {p.totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               {p.status === 'PENDING_APPROVAL' && (
                                 <div className="flex gap-1.5 mr-1">
                                   <button onClick={(e) => handleEdit(e, p.id)} className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-colors">
                                     <Edit className="w-3.5 h-3.5" />
                                   </button>
                                   <button onClick={(e) => handleDelete(e, p.id)} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               )}
                               <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Desktop Layout */}
                   <div className="hidden md:grid grid-cols-12 gap-4 items-center px-10 py-7">
                      <div className="col-span-3 flex items-center gap-5">
                         <div className="w-12 h-12 bg-gray-50 group-hover:bg-primary/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                            <FileText className="w-5 h-5" />
                         </div>
                         <div className="min-w-0">
                             <p className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-primary transition-colors truncate">{p.procurementNo}</p>
                             <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{p.type}</span>
                          </div>
                      </div>
                      <div className="col-span-2">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Supplier</p>
                         <p className="text-xs font-black text-gray-700 uppercase truncate" title={p.vendor?.name || 'N/A'}>{p.vendor?.name || 'N/A'}</p>
                      </div>
                      <div className="col-span-3 min-w-0 pr-4">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Item Pesanan</p>
                         {p.items && p.items.length > 0 ? (
                            <p className="text-[11px] italic text-gray-500 break-words whitespace-normal leading-relaxed" title={p.items.map((i: any) => i.product?.productName).filter(Boolean).join(', ')}>
                               {p.items.map((i: any) => i.product?.productName).filter(Boolean).join(', ')}
                            </p>
                         ) : (
                            <p className="text-[11px] italic text-gray-300">-</p>
                         )}
                      </div>
                      <div className="col-span-1 text-center">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SKU</p>
                         <p className="text-lg font-black text-gray-900">{p._count.items}</p>
                      </div>
                      <div className="col-span-2 text-right">
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Total PR Value</p>
                         <p className="text-lg font-black text-indigo-600">Rp {p.totalAmount.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="col-span-1 flex flex-col items-end justify-center gap-2">
                         <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm text-center break-words whitespace-normal leading-tight ${getStatusStyle(p.status)}`}>
                            {p.status.replace('_', ' ')}
                         </div>
                         {p.status === 'PENDING_APPROVAL' && (
                           <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                             <button onClick={(e) => handleEdit(e, p.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                               <Edit className="w-4 h-4" />
                             </button>
                             <button onClick={(e) => handleDelete(e, p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
