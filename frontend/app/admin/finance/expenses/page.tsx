'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiDollarSign, FiSearch, FiFilter,
  FiClock, FiCheckCircle, FiMoreVertical,
  FiCalendar, FiPlus, FiX, FiActivity, FiTag, FiFileText, FiCreditCard, FiTrash2, FiImage,
  FiArrowRight
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'

interface ExpenseCategory {
  id: string
  categoryName: string
  coaId?: string
  coa?: {
    code: string
    name: string
  }
}

interface Expense {
  id: string
  expenseNo: string
  expenseDate: string
  amount: number
  description: string
  paymentMethod: string
  status: string
  category: ExpenseCategory
  notes?: string
}

interface Bank {
  id: string
  bankName: string
  accountNumber: string
}

export default function ExpensesPage() {
  const { activeClinicId } = useAuthStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    bankId: '',
    notes: ''
  })
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)


  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    try {
      setLoading(true)

      const [expRes, catRes, bankRes] = await Promise.all([
        api.get('/finance/expenses', {
          params: {
            search: search || undefined,
            categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
            page: page,
            limit: 10
          }
        }),
        api.get('/master/expense-categories'),
        api.get('/master/banks')
      ])

      setExpenses(expRes.data?.data || [])
      setTotalPages(expRes.data?.meta?.totalPages || 1)
      setTotalItems(expRes.data?.meta?.total || 0)
      setCategories(catRes.data || [])
      setBanks(bankRes.data || [])
    } catch (error) {
      console.error('Fetch Expenses Error:', error)
      toast.error('Gagal mengambil data pengeluaran')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId || !formData.amount || !formData.expenseDate) {
      toast.error('Mohon lengkapi data wajib')
      return
    }

    try {
      setIsSubmitting(true)

      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (attachmentFile) fd.append('attachment', attachmentFile)

      await api.post('/finance/expenses', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Pengeluaran berhasil dicatat dan masuk ke Buku Besar')
      setShowAddModal(false)
      setFormData({
        expenseDate: new Date().toISOString().split('T')[0],
        categoryId: '', amount: '', paymentMethod: 'cash',
        description: '', bankId: '', notes: ''
      })
      setAttachmentFile(null)
      setAttachmentPreview(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengeluaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, expenseNo: string) => {
    if (!confirm(`Hapus pengeluaran ${expenseNo}? Jurnal GL terkait juga akan dihapus.`)) return
    try {
      setDeletingId(id)
      await api.delete(`/finance/expenses/${id}`)
      toast.success('Pengeluaran berhasil dihapus')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachmentFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setAttachmentPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setAttachmentPreview(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 md:py-8 space-y-4 sm:space-y-6 md:space-y-10">
      {/* RESPONSIVE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 px-1 sm:px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-600 rounded-lg sm:rounded-xl text-white shadow-md sm:shadow-lg shadow-indigo-200">
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Pengeluaran Operasional</h1>
              <p className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wide mt-0.5">Kelola Biaya, Gaji, dan Pengeluaran Klinik</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-2 sm:mt-0 bg-indigo-600 text-white flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg sm:shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 touch-button"
        >
          <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" /> 
          <span className="hidden sm:inline">Catat Pengeluaran</span>
          <span className="sm:hidden">Catat</span>
        </button>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-3 sm:p-4 md:p-8 rounded-lg sm:rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-rose-50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-rose-600 flex-shrink-0">
            <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div className="text-left">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Total Item</p>
            <h3 className="text-base sm:text-lg md:text-2xl font-black text-slate-900 tracking-tight">{totalItems}</h3>
          </div>
        </div>
        <div className="bg-indigo-600 p-3 sm:p-4 md:p-8 rounded-lg sm:rounded-2xl md:rounded-[2.5rem] shadow-lg sm:shadow-xl md:shadow-2xl shadow-indigo-100 flex items-center gap-2 sm:gap-4 md:gap-6 text-white col-span-1 sm:col-span-2 md:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
            <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div className="text-left">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">Status</p>
            <h3 className="text-base sm:text-lg md:text-2xl font-black tracking-tighter italic">Real-Time Sync</h3>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <section className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-sm mx-1 sm:mx-2">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 sm:ml-3">Cari Pengeluaran</label>
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Deskripsi pengeluaran..."
                className="w-full pl-8 sm:pl-10 pr-4 sm:pr-6 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 sm:ml-3">Kategori</label>
            <select
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs border border-slate-100 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 bg-slate-50 font-black text-slate-700 transition-all"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* DATA TABLE - Desktop */}
      <section className="hidden md:block bg-white rounded-2xl md:rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase">
              <th className="px-6 md:px-10 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest">Tgl / Ref</th>
              <th className="px-4 md:px-8 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest text-left">Kategori</th>
              <th className="px-4 md:px-8 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest">Deskripsi</th>
              <th className="px-4 md:px-8 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest text-right">Jumlah</th>
              <th className="px-4 md:px-8 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest text-center">Metode</th>
              <th className="px-4 md:px-8 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest text-center">Status</th>
              <th className="px-4 md:px-6 py-4 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length > 0 ? expenses.map((exp) => (
              <tr key={exp.id} className="group hover:bg-slate-50 transition-colors duration-300">
                <td className="px-6 md:px-10 py-4 md:py-6">
                  <p className="text-xs md:text-xs font-black text-slate-800">{new Date(exp.expenseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-300 mt-1 uppercase tracking-widest group-hover:text-indigo-500">{exp.expenseNo}</p>
                </td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-left">
                  <span className="px-3 md:px-4 py-1 md:py-1.5 bg-slate-100 text-slate-600 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {exp.category?.categoryName || 'General'}
                  </span>
                </td>
                <td className="px-4 md:px-8 py-4 md:py-6">
                  <p className="text-xs md:text-sm font-black text-slate-700 tracking-tight">{exp.description || '-'}</p>
                  {exp.notes && <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1 uppercase">{exp.notes}</p>}
                </td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                  <p className="text-sm md:text-base font-black text-rose-600 tracking-tight">{formatCurrency(exp.amount)}</p>
                </td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                  {exp.paymentMethod === 'cash' ? (
                    <span className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tunai</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest">Transfer</span>
                  )}
                </td>
                <td className="px-4 md:px-10 py-4 md:py-6 text-center">
                  <div className="flex items-center justify-center gap-1 md:gap-2 text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full inline-flex border border-emerald-100">
                    <FiCheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Posted</span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                  <button
                    onClick={() => handleDelete(exp.id, exp.expenseNo)}
                    disabled={deletingId === exp.id}
                    className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all disabled:opacity-30"
                    title="Hapus pengeluaran"
                  >
                    <FiTrash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 md:px-10 py-12 md:py-24 text-center">
                  <div className="flex flex-col items-center gap-3 md:gap-4 opacity-20">
                    <FiFileText className="w-12 h-12 md:w-16 md:h-16" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs md:text-sm">Belum ada catatan pengeluaran</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-3 sm:p-4 md:p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-slate-100">
          <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 md:px-6 py-2 md:py-2 bg-white border border-slate-200 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
            >Prev</button>
            <button
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 md:px-6 py-2 md:py-2 bg-white border border-slate-200 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
            >Next</button>
          </div>
        </div>
      </section>

      {/* DATA TABLE - Mobile Card View */}
      <section className="md:hidden space-y-2 sm:space-y-3">
        {expenses.length > 0 ? expenses.map((exp) => (
          <div key={exp.id} className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm space-y-2 sm:space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-black text-slate-800">{new Date(exp.expenseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-300 mt-0.5 uppercase tracking-widest">{exp.expenseNo}</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-slate-200 flex-shrink-0">
                {exp.category?.categoryName || 'General'}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <p className="text-xs sm:text-sm font-black text-slate-700 tracking-tight">{exp.description || '-'}</p>
                {exp.notes && <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-0.5 uppercase">{exp.notes}</p>}
              </div>
              
              <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {exp.paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <FiCheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">Posted</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base font-black text-rose-600 tracking-tight">{formatCurrency(exp.amount)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 sm:pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDelete(exp.id, exp.expenseNo)}
                disabled={deletingId === exp.id}
                className="flex-1 p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all disabled:opacity-30 text-[9px] sm:text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1"
              >
                <FiTrash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Hapus
              </button>
            </div>
          </div>
        )) : (
          <div className="py-12 sm:py-16 flex flex-col items-center gap-3 sm:gap-4 opacity-20">
            <FiFileText className="w-12 h-12 sm:w-14 sm:h-14" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs sm:text-sm">Belum ada catatan pengeluaran</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {expenses.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-50/50 flex items-center justify-between gap-2 border border-slate-200 rounded-lg sm:rounded-xl">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">Hal {page}/{totalPages}</p>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
              >Prev</button>
              <button
                disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
              >Next</button>
            </div>
          </div>
        )}
      </section>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-xl sm:rounded-2xl md:rounded-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-12 space-y-4 sm:space-y-6 md:space-y-8 text-left">
                <div className="flex justify-between items-center mb-2 sm:mb-4">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Catat Biaya</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2 text-left">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                      <input
                        type="date" className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                        value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-left">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                      <input
                        type="number" placeholder="0" className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-slate-100 border border-slate-100 rounded-lg sm:rounded-2xl font-black text-base sm:text-lg text-rose-600 outline-none border-dashed"
                        value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-left">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Biaya</label>
                    <select
                      className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                      value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName} {c.coa ? `[${c.coa.code}]` : '(Belum Mapping COA)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-left">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Peruntukan</label>
                    <input
                      type="text" placeholder="Contoh: Bayar Listrik Bulan April"
                      className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                      value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-left">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {['cash', 'bank_transfer'].map(m => (
                        <button
                          key={m} type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: m })}
                          className={`py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${formData.paymentMethod === m ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                          {m === 'cash' ? 'Tunai (Kas)' : 'Bank / Transfer'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="space-y-1 sm:space-y-2 text-left">
                      <label className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Pilih Rekening Bank</label>
                      <select
                        className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm text-indigo-700 outline-none"
                        value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                      >
                        <option value="">-- Pilih Bank --</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1 sm:space-y-2 text-left">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Optional)</label>
                    <textarea
                      className="w-full px-3 sm:px-5 py-2 sm:py-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl font-medium text-xs sm:text-sm text-slate-700 outline-none resize-none"
                      rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  {/* Upload Bukti / Kwitansi */}
                  <div className="space-y-1 sm:space-y-2 text-left">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Upload Bukti / Kwitansi (Opsional)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-20 sm:h-24 border-2 border-dashed border-slate-200 rounded-lg sm:rounded-2xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                      {attachmentPreview ? (
                        <img src={attachmentPreview} alt="preview" className="h-full w-full object-contain rounded-lg sm:rounded-2xl p-1" />
                      ) : attachmentFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <FiFileText className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-500" />
                          <p className="text-[8px] sm:text-xs font-bold text-indigo-600">{attachmentFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <FiImage className="w-5 h-5 sm:w-6 sm:h-6" />
                          <p className="text-[9px] sm:text-[10px] font-bold">Foto kwitansi / PDF — maks 10MB</p>
                        </div>
                      )}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAttachmentChange} />
                    </label>
                    {attachmentFile && (
                      <button type="button" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null) }}
                        className="text-[9px] sm:text-[10px] text-red-400 hover:text-red-600 font-bold flex items-center gap-1 ml-1">
                        <FiX className="w-3 h-3" /> Hapus file
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className={`w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] shadow-lg sm:shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3 ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-slate-900 animate-pulse-slow'}`}
                >
                  {isSubmitting ? (
                    <>
                      <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> <span className="hidden sm:inline">Sedang Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      Konfirmasi & Sync Ledger <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
