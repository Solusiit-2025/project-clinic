'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { 
  FiTrendingUp, FiPlus, FiSearch, FiCalendar, FiFileText, 
  FiCheckCircle, FiClock, FiTrash2, FiEye, FiMoreVertical, 
  FiArrowRight, FiInfo, FiLayers, FiAlertCircle, FiX, FiRefreshCcw
} from 'react-icons/fi'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface OpeningBalanceItem {
  id: string
  coaId: string
  debit: number
  credit: number
  coa: { code: string; name: string }
}

interface OpeningBalance {
  id: string
  date: string
  description: string
  status: string
  totalAmount: number
  createdAt: string
  items: OpeningBalanceItem[]
}

interface COA {
  id: string
  code: string
  name: string
  category: string
}

export default function OpeningBalancePage() {
  const { activeClinicId } = useAuthStore()
  const [history, setHistory] = useState<OpeningBalance[]>([])
  const [coaList, setCoaList] = useState<COA[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    items: [{ coaId: '', debit: 0, credit: 0 }]
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resHistory, resCOA] = await Promise.all([
        api.get('/finance/opening-balance', { params: { clinicId: activeClinicId } }),
        api.get('/master/coa')
      ])
      setHistory(resHistory.data)
      setCoaList(resCOA.data.filter((i: any) => i.accountType === 'DETAIL'))
    } catch (e) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [activeClinicId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { coaId: '', debit: 0, credit: 0 }]
    }))
  }

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm(prev => ({ ...prev, items: newItems }))
  }

  const totals = form.items.reduce((acc, item) => ({
    debit: acc.debit + (Number(item.debit) || 0),
    credit: acc.credit + (Number(item.credit) || 0)
  }), { debit: 0, credit: 0 })

  const handleSave = async (status: 'DRAFT' | 'POSTED' = 'DRAFT') => {
    if (totals.debit !== totals.credit) {
      toast.error('Total Debit dan Kredit harus seimbang!')
      return
    }
    if (form.items.some(i => !i.coaId)) {
      toast.error('Semua baris harus memilih akun (COA)')
      return
    }

    setSaving(true)
    try {
      const { data: newEntry } = await api.post('/finance/opening-balance', {
        ...form,
        clinicId: activeClinicId
      })
      
      if (status === 'POSTED') {
        await api.post(`/finance/opening-balance/${newEntry.id}/post`)
        toast.success('Saldo awal berhasil diposting!')
      } else {
        toast.success('Draft saldo berhasil disimpan')
      }
      
      setModalOpen(false)
      fetchData()
      setForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        items: [{ coaId: '', debit: 0, credit: 0 }]
      })
    } catch (e) {
      toast.error('Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handlePostEntry = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin memposting saldo awal ini? Tindakan ini akan memperbarui saldo Chart of Accounts.')) return
    try {
      await api.post(`/finance/opening-balance/${id}/post`)
      toast.success('Berhasil diposting!')
      fetchData()
    } catch (e) {
      toast.error('Gagal memposting data')
    }
  }

  const handleUnpostEntry = async (id: string) => {
    if (!confirm('Batalkan postingan ini? Saldo COA akan dikembalikan dan jurnal di Buku Besar akan dihapus.')) return
    try {
      await api.post(`/finance/opening-balance/${id}/unpost`)
      toast.success('Postingan berhasil dibatalkan!')
      fetchData()
    } catch (e) {
      toast.error('Gagal membatalkan postingan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus draft saldo awal ini?')) return
    try {
      await api.delete(`/finance/opening-balance/${id}`)
      toast.success('Berhasil dihapus')
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus data')
    }
  }

  const filteredHistory = history.filter(h => {
    const matchesSearch = h.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || h.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#F8FAFC]">
      <PageHeader
        title="Opening Balance"
        subtitle="Kelola saldo awal akun (Go-Live) untuk pembukuan digital Anda."
        icon={<FiTrendingUp className="w-6 h-6" />}
        breadcrumb={['Dashboard', 'Accounting', 'Opening Balance']}
      />

      {/* Hero / Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
           <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <FiLayers className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Opening Balances</p>
              <p className="text-2xl font-black text-slate-800">{history.length}</p>
           </div>
           <FiFileText className="ml-auto w-8 h-8 text-slate-50" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <FiCheckCircle className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posted</p>
              <p className="text-2xl font-black text-slate-800">{history.filter(h => h.status === 'POSTED').length}</p>
           </div>
           <FiCheckCircle className="ml-auto w-8 h-8 text-slate-50" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
           <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <FiClock className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Draft</p>
              <p className="text-2xl font-black text-slate-800">{history.filter(h => h.status === 'DRAFT').length}</p>
           </div>
           <FiClock className="ml-auto w-8 h-8 text-slate-50" />
        </motion.div>
      </div>

      {/* Riwayat Section */}
      <div className="mt-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className="text-xl font-black text-slate-800">Riwayat Saldo Awal</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar semua saldo awal yang telah diinput.</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="relative group">
                 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <input 
                    type="text" placeholder="Cari keterangan..." 
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all w-[300px] shadow-sm"
                 />
              </div>
              <button 
                 onClick={() => setModalOpen(true)}
                 className="flex items-center gap-2.5 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
              >
                 <FiPlus className="w-4 h-4" /> Tambah Saldo Go-Live
              </button>
           </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
           {['ALL', 'DRAFT', 'POSTED'].map(s => (
              <button
                 key={s} onClick={() => setFilterStatus(s)}
                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 {s}
              </button>
           ))}
        </div>

        {/* History Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Date & Info</th>
                    <th className="px-8 py-5">Description</th>
                    <th className="px-8 py-5 text-center">Accounts</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-center">Created</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr><td colSpan={7} className="px-8 py-20 text-center"><FiRefreshCcw className="animate-spin w-10 h-10 text-slate-200 mx-auto" /></td></tr>
                 ) : filteredHistory.length === 0 ? (
                    <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada riwayat saldo awal</td></tr>
                 ) : filteredHistory.map(h => (
                    <tr key={h.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <FiCalendar className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-800">{new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">As of Date</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <FiFileText className="text-slate-300 w-4 h-4" />
                             <div>
                                <p className="text-sm font-bold text-slate-700">{h.description}</p>
                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">Opening balance for accounting period</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black border border-slate-200">
                             #{h.items.length} Accounts
                          </span>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <p className="text-sm font-black text-slate-900">Rp {h.totalAmount.toLocaleString('id-ID')}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Total Amount</p>
                       </td>
                       <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${h.status === 'POSTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'POSTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                             {h.status}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center">
                             <p className="text-[11px] font-bold text-slate-500">{new Date(h.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                             <p className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {h.status === 'POSTED' ? (
                                <button onClick={() => handleUnpostEntry(h.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Batalkan Posting (Unpost)">
                                   <FiRefreshCcw className="w-5 h-5" />
                                </button>
                             ) : (
                                <>
                                  <button onClick={() => handlePostEntry(h.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Posting ke COA"><FiCheckCircle className="w-5 h-5" /></button>
                                  <button onClick={() => handleDelete(h.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Hapus"><FiTrash2 className="w-5 h-5" /></button>
                                </>
                             )}
                             <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all" title="Lihat Detail"><FiEye className="w-5 h-5" /></button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Create Modal */}
      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Saldo Awal Baru"
        size="7xl"
      >
        <div className="space-y-8 p-2">
          {/* Form Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal (As Of)</label>
                <div className="relative group">
                   <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <input 
                      type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Memo</label>
                <div className="relative group">
                   <FiFileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <input 
                      type="text" placeholder="Contoh: Saldo Awal Go-Live Januari 2024"
                      value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                   />
                </div>
             </div>
          </div>

          {/* Rincian Table */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                   <FiLayers className="text-primary w-5 h-5" />
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rincian Saldo Akun</h4>
                </div>
                <button 
                   onClick={handleAddItem}
                   className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                   <FiPlus className="w-3.5 h-3.5" /> Tambah Baris
                </button>
             </div>

             <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="px-6 py-4 w-[40%]">Nama Akun (COA)</th>
                         <th className="px-6 py-4 text-right">Debit</th>
                         <th className="px-6 py-4 text-right">Kredit</th>
                         <th className="px-6 py-4 text-center w-16">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {form.items.map((item, idx) => (
                         <tr key={idx} className="group">
                            <td className="px-4 py-3">
                               <select 
                                  value={item.coaId} onChange={(e) => handleItemChange(idx, 'coaId', e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:border-primary transition-all"
                               >
                                  <option value="">Pilih Akun...</option>
                                  {coaList.map(coa => (
                                     <option key={coa.id} value={coa.id}>{coa.code} - {coa.name}</option>
                                  ))}
                               </select>
                            </td>
                            <td className="px-4 py-3">
                               <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">Rp</span>
                                  <input 
                                     type="number" value={item.debit} onChange={(e) => handleItemChange(idx, 'debit', e.target.value)}
                                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs text-slate-800 text-right focus:outline-none focus:border-emerald-500 transition-all"
                                  />
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">Rp</span>
                                  <input 
                                     type="number" value={item.credit} onChange={(e) => handleItemChange(idx, 'credit', e.target.value)}
                                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs text-slate-800 text-right focus:outline-none focus:border-rose-500 transition-all"
                                  />
                               </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                               {form.items.length > 1 && (
                                  <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                   <tfoot>
                      <tr className="bg-slate-900 text-white">
                         <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Total Saldo</td>
                         <td className="px-8 py-5 text-right font-black text-emerald-400">Rp {totals.debit.toLocaleString('id-ID')}</td>
                         <td className="px-8 py-5 text-right font-black text-rose-400">Rp {totals.credit.toLocaleString('id-ID')}</td>
                         <td className="px-8 py-5"></td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>

          {/* Balance Checker */}
          <AnimatePresence>
             {totals.debit !== totals.credit && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-600 overflow-hidden">
                   <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                   <div>
                      <p className="text-sm font-black uppercase tracking-tight leading-none">Journal Unbalanced!</p>
                      <p className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-widest">Total Debit dan Kredit tidak sama. Selisih: Rp {Math.abs(totals.debit - totals.credit).toLocaleString('id-ID')}</p>
                   </div>
                   <button 
                      onClick={() => {
                        // Easy balance logic: add diff to current line
                        const diff = totals.debit - totals.credit
                        if (diff > 0) {
                           // Need more credit
                           handleItemChange(form.items.length-1, 'credit', Number(form.items[form.items.length-1].credit) + diff)
                        } else {
                           // Need more debit
                           handleItemChange(form.items.length-1, 'debit', Number(form.items[form.items.length-1].debit) + Math.abs(diff))
                        }
                      }}
                      className="ml-auto px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                   >
                      Auto Balance
                   </button>
                </motion.div>
             )}
          </AnimatePresence>

          <div className="flex gap-4 pt-4">
             <button onClick={() => setModalOpen(false)} className="flex-1 py-5 border border-slate-100 rounded-[1.5rem] text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase hover:bg-slate-50 transition-all">Batal</button>
             <button onClick={() => handleSave('DRAFT')} disabled={saving} className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black tracking-[0.2em] uppercase shadow-xl transition-all disabled:opacity-50">Simpan Draft Saldo</button>
             <button onClick={() => handleSave('POSTED')} disabled={saving} className="flex-[1.5] py-5 bg-primary text-white rounded-[1.5rem] text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-primary/20 transition-all disabled:opacity-50">Simpan & Posting Sekarang</button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
