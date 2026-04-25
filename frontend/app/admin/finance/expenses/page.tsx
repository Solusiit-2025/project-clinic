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
    <div className="w-full px-6 py-8 space-y-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 text-left">Pengeluaran Operasional</h1>
          <p className="text-sm font-bold text-slate-400 text-left tracking-wide">Kelola Biaya, Gaji, dan Pengeluaran Klinik Lainnya</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all flex items-center gap-3 active:scale-95"
        >
          <FiPlus className="w-5 h-5" /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* STATS SECTION (Simple Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <FiDollarSign className="w-7 h-7" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Item Bulan Ini</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalItems} Transaksi</h3>
          </div>
        </div>
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center gap-6 text-white">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <FiCheckCircle className="w-7 h-7" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Status Pembukuan</p>
            <h3 className="text-2xl font-black tracking-tightest italic">Real-Time Sync</h3>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <section className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 flex-1 w-full">
          <FiSearch className="text-slate-400 w-5 h-5" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari deskripsi pengeluaran..."
            className="bg-transparent border-none focus:outline-none text-sm font-black text-slate-700 w-full py-3"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none outline-none appearance-none cursor-pointer"
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
        </div>
      </section>

      {/* DATA TABLE */}
      <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase">
              <th className="px-10 py-8 text-[10px] font-black text-slate-400 tracking-widest">Tgl / Ref</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 tracking-widest text-left">Kategori</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 tracking-widest">Deskripsi</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 tracking-widest text-right">Jumlah</th>
              <th className="px-8 py-8 text-[10px] font-black text-slate-400 tracking-widest text-center">Metode</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-400 tracking-widest text-center">Status</th>
              <th className="px-6 py-8 text-[10px] font-black text-slate-400 tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length > 0 ? expenses.map((exp) => (
              <tr key={exp.id} className="group hover:bg-slate-50 transition-colors duration-300">
                <td className="px-10 py-6">
                  <p className="text-xs font-black text-slate-800">{new Date(exp.expenseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[9px] font-black text-slate-300 mt-1 uppercase tracking-widest group-hover:text-indigo-500">{exp.expenseNo}</p>
                </td>
                <td className="px-8 py-6 text-left">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {exp.category?.categoryName || 'General'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-slate-700 tracking-tight">{exp.description || '-'}</p>
                  {exp.notes && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{exp.notes}</p>}
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-base font-black text-rose-600 tracking-tight">{formatCurrency(exp.amount)}</p>
                </td>
                <td className="px-8 py-6 text-center">
                  {exp.paymentMethod === 'cash' ? (
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tunai</span>
                  ) : (
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Transfer</span>
                  )}
                </td>
                <td className="px-10 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex border border-emerald-100">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Posted</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <button
                    onClick={() => handleDelete(exp.id, exp.expenseNo)}
                    disabled={deletingId === exp.id}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                    title="Hapus pengeluaran"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-10 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <FiFileText className="w-16 h-16" />
                    <p className="font-black text-slate-400 uppercase tracking-widest">Belum ada catatan pengeluaran</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
            >Prev</button>
            <button
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
            >Next</button>
          </div>
        </div>
      </section>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <form onSubmit={handleSubmit} className="p-12 space-y-8 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Catat Biaya</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <FiX className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                      <input
                        type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                        value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                      <input
                        type="number" placeholder="0" className="w-full px-5 py-4 bg-slate-100 border border-slate-100 rounded-2xl font-black text-lg text-rose-600 outline-none border-dashed"
                        value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Biaya</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
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

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Peruntukan</label>
                    <input
                      type="text" placeholder="Contoh: Bayar Listrik Bulan April"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                      value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['cash', 'bank_transfer'].map(m => (
                        <button
                          key={m} type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: m })}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.paymentMethod === m ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                          {m === 'cash' ? 'Tunai (Kas)' : 'Bank / Transfer'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Pilih Rekening Bank</label>
                      <select
                        className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-sm text-indigo-700 outline-none"
                        value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                      >
                        <option value="">-- Pilih Bank --</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Optional)</label>
                    <textarea
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm text-slate-700 outline-none resize-none"
                      rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  {/* Upload Bukti / Kwitansi */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Upload Bukti / Kwitansi (Opsional)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                      {attachmentPreview ? (
                        <img src={attachmentPreview} alt="preview" className="h-full w-full object-contain rounded-2xl p-1" />
                      ) : attachmentFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <FiFileText className="w-7 h-7 text-indigo-500" />
                          <p className="text-xs font-bold text-indigo-600">{attachmentFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <FiImage className="w-6 h-6" />
                          <p className="text-[10px] font-bold">Foto kwitansi / PDF — maks 10MB</p>
                        </div>
                      )}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAttachmentChange} />
                    </label>
                    {attachmentFile && (
                      <button type="button" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null) }}
                        className="text-[10px] text-red-400 hover:text-red-600 font-bold flex items-center gap-1 ml-1">
                        <FiX className="w-3 h-3" /> Hapus file
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-slate-900 animate-pulse-slow'}`}
                >
                  {isSubmitting ? (
                    <>
                      <FiActivity className="w-5 h-5 animate-spin" /> Sedang Menyimpan...
                    </>
                  ) : (
                    <>
                      Konfirmasi & Sync Ledger <FiArrowRight className="w-5 h-5" />
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
