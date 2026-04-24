'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiCpu, FiAlertCircle, FiCheckCircle, FiLink, FiSave, FiSettings, FiBriefcase } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import PageHeader from '@/components/admin/master/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004'
const API_SYSTEM = API_BASE + '/api/master/system-accounts'
const API_COA = API_BASE + '/api/master/coa'

const SYSTEM_KEYS = [
  { key: 'ACCOUNTS_RECEIVABLE', name: 'Piutang Usaha (AR)', desc: 'Hak tagih invoice penjualan kepada pelanggan.', category: 'ASSET' },
  { key: 'SALES_REVENUE', name: 'Pendapatan Penjualan Obat', desc: 'Akun pendapatan saat invoice obat diterbitkan.', category: 'REVENUE' },
  { key: 'SERVICE_REVENUE', name: 'Pendapatan Jasa Medis', desc: 'Akun pendapatan untuk konsultasi dan tindakan dokter.', category: 'REVENUE' },
  { key: 'SALES_DISCOUNT', name: 'Potongan Penjualan', desc: 'Akun penampung diskon yang diberikan ke pasien.', category: 'REVENUE' },
  { key: 'CASH_ACCOUNT', name: 'Kas Utama / Teller', desc: 'Akun kas default untuk penerimaan tunai.', category: 'ASSET' },
  { key: 'BANK_ACCOUNT', name: 'Bank (Transfer/EDC)', desc: 'Akun bank untuk penerimaan non tunai.', category: 'ASSET' },
  { key: 'PETTY_CASH', name: 'Kas Kecil (Petty Cash)', desc: 'Kas kecil untuk pengeluaran operasional minor.', category: 'ASSET' },
  { key: 'INVENTORY_ACCOUNT', name: 'Persediaan Obat & BHP', desc: 'Nilai stok barang / obat di neraca.', category: 'ASSET' },
  { key: 'TAX_PAYABLE', name: 'Hutang Pajak (PPN)', desc: 'PPN Keluaran dari invoice penjualan.', category: 'LIABILITY' },
  { key: 'ACCOUNTS_PAYABLE', name: 'Hutang Usaha (Supplier)', desc: 'Kewajiban pembayaran atas pembelian barang.', category: 'LIABILITY' },
  { key: 'COGS', name: 'Harga Pokok Penjualan (HPP)', desc: 'Beban pokok atas obat yang terjual/diserahkan.', category: 'EXPENSE' },
  { key: 'PURCHASE_DISCOUNT', name: 'Potongan Pembelian', desc: 'Diskon yang didapat dari supplier.', category: 'REVENUE' },
  { key: 'EXPENSE_SALARY', name: 'Beban Gaji Karyawan', desc: 'Beban gaji, bonus, dan tunjangan staf.', category: 'EXPENSE' },
  { key: 'EXPENSE_UTILITY', name: 'Beban Listrik/Air/Internet', desc: 'Beban biaya rutin utilitas bulanan.', category: 'EXPENSE' },
  { key: 'MAINTENANCE_EXPENSE', name: 'Beban Maintenance Alat', desc: 'Akun beban untuk pemeliharaan dan perbaikan aset/alat medis.', category: 'EXPENSE' },
  { key: 'RETAINED_EARNINGS', name: 'Laba Ditahan', desc: 'Akumulasi laba bersih tahun-tahun sebelumnya.', category: 'EQUITY' },
]

export default function SystemAccountsPage() {
  const { token } = useAuthStore()
  const [mappings, setMappings] = useState<any[]>([])
  const [coaList, setCoaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sysRes, coaRes] = await Promise.all([
        axios.get(API_SYSTEM, { headers }),
        axios.get(API_COA, { headers })
      ])
      setMappings(sysRes.data)
      // Only DETAIL accounts are usable for transactions
      setCoaList(coaRes.data.filter((a: any) => a.accountType === 'DETAIL'))
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError('Gagal mengambil data dari server.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdate = async (key: string, coaId: string, name: string) => {
    if (!coaId) return
    
    setSavingKey(key)
    setError('')
    setSuccess('')
    
    try {
      await axios.post(API_SYSTEM, { key, coaId, name }, { headers })
      setSuccess(`Berhasil memperbarui pemetaan untuk ${key}`)
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui pemetaan.')
    } finally {
      setSavingKey(null)
    }
  }

  const getMappedCoaId = (key: string) => {
    // Priority: 1. Mapping for this clinic, 2. Global mapping (clinicId null)
    const matches = mappings.filter(m => m.key === key)
    if (matches.length === 0) return ''
    
    const branchSpecific = matches.find(m => m.clinicId !== null)
    return branchSpecific ? branchSpecific.coaId : matches[0].coaId
  }

  return (
    <div className="p-6">
      <PageHeader
        title="System Account Mapping"
        subtitle="Hubungkan peran sistem ke Chart of Accounts untuk otomatisasi jurnal keuangan."
        icon={<FiCpu className="w-6 h-6" />}
        breadcrumb={['Admin', 'Data Master', 'System Accounts']}
      >
        <button 
          onClick={async () => {
            if (confirm('Sinkronisasi kunci akun sistem default?')) {
              try {
                await axios.post(`${API_SYSTEM}/seed`, {}, { headers })
                fetchData()
                setSuccess('Kunci akun sistem berhasil disinkronkan.')
              } catch (e) {
                setError('Gagal sinkronisasi akun sistem.')
              }
            }
          }}
          className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all border-2 border-indigo-100 flex items-center gap-2"
        >
          <FiSettings className="w-4 h-4" />
          Inisialisasi Akun
        </button>
      </PageHeader>

      <div className="max-w-5xl space-y-6">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
            <FiAlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold">
            <FiCheckCircle className="w-5 h-5" />
            {success}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {SYSTEM_KEYS.map((sys, idx) => {
            const currentCoaId = getMappedCoaId(sys.key)
            const isSaving = savingKey === sys.key

            return (
              <motion.div 
                key={sys.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Info Section */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FiSettings className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{sys.name}</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-widest">{sys.key}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">{sys.desc}</p>
                    <div className="pt-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                            sys.category === 'ASSET' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            sys.category === 'REVENUE' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                            Role: {sys.category}
                        </span>
                    </div>
                  </div>

                  {/* Mapping Section */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative min-w-[300px]">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiLink className="w-4 h-4" />
                      </div>
                      <select
                        value={currentCoaId}
                        onChange={(e) => handleUpdate(sys.key, e.target.value, sys.name)}
                        disabled={loading || isSaving}
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all disabled:opacity-50"
                      >
                        <option value="">-- Pilih Akun COA --</option>
                        {coaList.filter(c => c.category === sys.category).map(coa => (
                          <option key={coa.id} value={coa.id}>{coa.code} - {coa.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <FiSettings className="w-3 h-3 animate-spin-slow" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center p-4">
                        {currentCoaId ? (
                            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                <FiCheckCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sirkulasi Aktif</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                                <FiAlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Belum Terhubung</span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="p-8 bg-indigo-900 rounded-[3rem] text-white overflow-hidden relative shadow-2xl shadow-indigo-500/20">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                    <FiBriefcase className="w-8 h-8 text-indigo-200" />
                </div>
                <div>
                    <h4 className="text-xl font-black tracking-tight mb-2">Pentingnya Pemetaan Akun</h4>
                    <p className="text-sm text-indigo-100 font-medium leading-relaxed max-w-2xl">
                        Tanpa pemetaan ini, sistem tidak akan tahu ke mana harus mencatat debit dan kredit saat operasional berlangsung. 
                        Pastikan setiap peran sistem di atas terhubung ke Akun Detail (bukan Header) yang sesuai di COA Anda.
                    </p>
                </div>
            </div>
            {/* Background Decorations */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -left-20 -top-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  )
}
