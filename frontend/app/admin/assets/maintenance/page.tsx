'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { 
  FiSettings, FiPlus, FiTool, FiCalendar, FiDollarSign, 
  FiUser, FiAlertCircle, FiCheckCircle, FiClock, FiSearch,
  FiFileText, FiArrowRight, FiSend, FiX, FiInfo
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

type Asset = {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  condition: string;
  clinic?: { name: string; code: string };
}

type MaintenanceRecord = {
  id: string;
  assetId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: string;
  notes?: string;
  isPosted: boolean;
  asset: Asset;
}

const EMPTY_FORM = {
  assetId: '',
  maintenanceDate: new Date().toISOString().substring(0, 10),
  maintenanceType: 'Routine',
  description: '',
  cost: 0,
  performedBy: '',
  nextMaintenanceDate: '',
  notes: ''
}

export default function MaintenancePage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<MaintenanceRecord[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [coas, setCoas] = useState<any[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Posting States
  const [postingModalOpen, setPostingModalOpen] = useState(false)
  const [postingRecord, setPostingRecord] = useState<MaintenanceRecord | null>(null)
  const [selectedCreditCoa, setSelectedCreditCoa] = useState('')
  const [postingLoading, setPostingLoading] = useState(false)

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await axios.get(`${API}/maintenance/all`, { headers })
      setData(res)
    } catch (e) {
      console.error('Failed to fetch maintenance', e)
    } finally {
      setLoading(false)
    }
  }, [headers])

  const fetchAssets = useCallback(async () => {
    try {
      const { data: res } = await axios.get(`${API}/assets`, { headers })
      setAssets(res)
    } catch (e) { console.error('Failed to fetch assets', e) }
  }, [headers])

  const fetchCoasAndBalances = useCallback(async () => {
    try {
      const [{ data: resCoa }, { data: resBal }] = await Promise.all([
        axios.get(`${API}/coa`, { headers }),
        axios.get(`${API}/coa/balances`, { headers })
      ])
      
      const balMap: Record<string, number> = {}
      resBal.forEach((b: any) => { balMap[b.id] = b.balance })
      setBalances(balMap)

      // Filter for Cash and Bank (Usually starts with 1-11)
      const filtered = resCoa.filter((c: any) => c.code.startsWith('1-11'))
      setCoas(filtered)
      if (filtered.length > 0) setSelectedCreditCoa(filtered[0].id)
    } catch (e) { console.error('Failed to fetch COAs/Balances', e) }
  }, [headers])

  useEffect(() => {
    if (token) {
      fetchData()
      fetchAssets()
      fetchCoasAndBalances()
    }
  }, [token, fetchData, fetchAssets, fetchCoasAndBalances])

  const assetOptions = useMemo(() => assets.map(a => ({
    id: a.id,
    label: a.assetName,
    code: a.assetCode,
    description: `${a.assetType.toUpperCase()} - ${a.clinic?.name || 'Central'}`
  })), [assets])

  const coaOptions = useMemo(() => coas.map(c => ({
    id: c.id,
    label: c.name,
    code: c.code,
    description: `Saldo: Rp ${(balances[c.id] || 0).toLocaleString('id-ID')}`
  })), [coas, balances])

  const handleSave = async () => {
    if (!form.assetId || !form.description || !form.maintenanceDate) {
      setError('Aset, tanggal, dan deskripsi wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await axios.put(`${API}/assets/maintenance/${editing.id}`, form, { headers })
      } else {
        await axios.post(`${API}/assets/${form.assetId}/maintenance`, form, { headers })
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handlePostToGL = async () => {
    if (!postingRecord || !selectedCreditCoa) return
    
    const balance = balances[selectedCreditCoa] || 0
    if (balance < postingRecord.cost) {
      alert(`Saldo tidak cukup! Saldo saat ini: Rp ${balance.toLocaleString('id-ID')}`)
      return
    }

    setPostingLoading(true)
    try {
      await axios.post(`${API}/assets/maintenance/${postingRecord.id}/post`, {
        creditCoaId: selectedCreditCoa
      }, { headers })
      setPostingModalOpen(false)
      fetchData()
      fetchCoasAndBalances() // Refresh balances
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal posting ke GL')
    } finally {
      setPostingLoading(false)
    }
  }

  const columns: Column<MaintenanceRecord>[] = [
    {
      key: 'asset',
      label: 'ASET & INFO',
      render: (r) => (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-blue-50 text-primary px-2 py-0.5 rounded uppercase border border-blue-100">
              {r.asset?.assetCode}
            </span>
            <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">
              {r.asset?.assetType.replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{r.asset?.assetName}</p>
        </div>
      )
    },
    {
      key: 'maintenanceDate',
      label: 'JADWAL',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-500 uppercase mb-1">{r.maintenanceType}</span>
          <span className="text-xs font-black text-gray-800">
            {new Date(r.maintenanceDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'TINDAKAN',
      render: (r) => <p className="text-xs font-bold text-gray-600 line-clamp-2 max-w-[200px]">{r.description}</p>
    },
    {
      key: 'cost',
      label: 'BIAYA',
      render: (r) => (
        <span className={`text-sm font-black ${r.cost > 0 ? 'text-rose-600' : 'text-gray-400 italic'}`}>
          {r.cost > 0 ? `Rp ${r.cost.toLocaleString('id-ID')}` : 'Gratis'}
        </span>
      )
    },
    {
      key: 'isPosted',
      label: 'STATUS GL',
      render: (r) => (
        <div className="flex items-center">
          {r.cost > 0 ? (
            r.isPosted ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border-2 border-emerald-100 shadow-sm shadow-emerald-100/50">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Terposting</span>
              </div>
            ) : (
              <button 
                onClick={() => { setPostingRecord(r); setPostingModalOpen(true); }}
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <FiSend className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Posting to GL</span>
                <FiArrowRight className="w-3 h-3 opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
            )
          ) : (
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">-</span>
          )}
        </div>
      )
    },
    {
      key: 'id',
      label: 'AKSI',
      render: (r) => (
        <div className="flex gap-2">
          <button 
            onClick={() => { 
              setEditing(r); 
              setForm({ 
                assetId: r.assetId,
                maintenanceDate: r.maintenanceDate.substring(0, 10),
                maintenanceType: r.maintenanceType,
                description: r.description,
                cost: r.cost,
                performedBy: r.performedBy || '',
                nextMaintenanceDate: r.nextMaintenanceDate?.substring(0, 10) || '',
                notes: r.notes || ''
              }); 
              setModalOpen(true); 
            }}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
          >
            <FiSettings className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const totals = useMemo(() => {
    const cost = data.reduce((sum, r) => sum + (r.cost || 0), 0)
    const upcoming = data.filter(r => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) > new Date()).length
    return { cost, count: data.length, upcoming }
  }, [data])

  const selectedBalance = selectedCreditCoa ? (balances[selectedCreditCoa] || 0) : 0
  const isInsufficient = postingRecord ? selectedBalance < postingRecord.cost : false

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#fcfcfd]">
      <PageHeader
        title="Maintenance & Perawatan"
        subtitle="Kelola riwayat pemeliharaan berkala dan perbaikan aset tetap"
        icon={<FiTool className="w-6 h-6" />}
        breadcrumb={['Admin', 'Manajemen Aset', 'Maintenance']}
        onAdd={() => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); }}
        addLabel="Catat Maintenance"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
        <SummaryCard title="Total Perawatan" value={totals.count} icon={<FiFileText className="w-6 h-6 text-indigo-600" />} color="bg-indigo-600" />
        <SummaryCard title="Total Biaya" value={totals.cost} icon={<FiDollarSign className="w-6 h-6 text-rose-600" />} color="bg-rose-600" />
        <SummaryCard title="Jadwal Mendatang" value={totals.upcoming} icon={<FiClock className="w-6 h-6 text-emerald-600" />} color="bg-emerald-600" />
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari..."
          groupBy={(r) => r.maintenanceType.toUpperCase()}
        />
      </div>

      {/* FORM MODAL */}
      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Update Maintenance" : "Catat Maintenance Baru"}
        size="lg"
      >
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="md:col-span-2">
               <SearchableSelect
                 label="Pilih Aset"
                 options={assetOptions}
                 value={form.assetId}
                 onChange={(id) => setForm(p => ({...p, assetId: id}))}
                 placeholder="Cari aset..."
                 disabled={!!editing}
               />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Tanggal Maintenance</label>
              <input type="date" value={form.maintenanceDate} onChange={(e) => setForm(p => ({...p, maintenanceDate: e.target.value}))} className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none text-sm font-bold" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Tipe Perawatan</label>
              <select value={form.maintenanceType} onChange={(e) => setForm(p => ({...p, maintenanceType: e.target.value}))} className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none text-sm font-bold appearance-none bg-white">
                <option value="Routine">Routine Service</option>
                <option value="Repair">Repair / Perbaikan</option>
                <option value="Upgrade">Upgrade / Part</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Tindakan / Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="..." rows={5} className="w-full px-5 py-3.5 rounded-[2rem] border-2 border-blue-100 focus:border-primary outline-none text-sm font-bold resize-none" />
            </div>

            <div className="p-6 bg-rose-50/50 border-2 border-rose-100/50 rounded-[2.5rem]">
               <div className="flex items-center gap-3 mb-4"><FiDollarSign className="text-rose-600" /> <span className="text-[10px] font-black text-rose-900 uppercase">Biaya</span></div>
               <input type="number" value={form.cost} onChange={(e) => setForm(p => ({...p, cost: Number(e.target.value)}))} className="w-full px-5 py-3.5 rounded-2xl border-2 border-rose-100 bg-white focus:border-rose-500 outline-none font-black text-lg text-rose-900 shadow-inner" />
               <p className="text-[9px] text-rose-400 font-bold mt-2 italic">* Data ini tidak langsung masuk ke laporan keuangan (Manual Posting)</p>
            </div>

            <div className="p-6 bg-emerald-50/50 border-2 border-emerald-100/50 rounded-[2.5rem]">
               <div className="flex items-center gap-3 mb-4"><FiCalendar className="text-emerald-600" /> <span className="text-[10px] font-black text-emerald-900 uppercase">Next Jadwal</span></div>
               <input type="date" value={form.nextMaintenanceDate} onChange={(e) => setForm(p => ({...p, nextMaintenanceDate: e.target.value}))} className="w-full px-5 py-3.5 rounded-2xl border-2 border-emerald-100 bg-white focus:border-emerald-500 outline-none text-sm font-bold" />
            </div>

            <input type="text" value={form.performedBy} onChange={(e) => setForm(p => ({...p, performedBy: e.target.value}))} placeholder="Teknisi..." className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none text-sm font-bold" />
            <input type="text" value={form.notes} onChange={(e) => setForm(p => ({...p, notes: e.target.value}))} placeholder="Catatan..." className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none text-sm font-bold" />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-[2rem] text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-primary text-white rounded-[2rem] text-[11px] font-black tracking-widest uppercase shadow-xl shadow-primary/20 transition-all">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>

          {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100">{error}</div>}
        </div>
      </MasterModal>

      {/* POSTING MODAL */}
      <AnimatePresence>
        {postingModalOpen && postingRecord && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPostingModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 pb-12 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
               <div className="absolute top-0 right-0 p-6">
                 <button onClick={() => setPostingModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100"><FiX /></button>
               </div>
               
               <div className="mb-8">
                 <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                   <FiSend className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Posting ke General Ledger</h3>
                 <p className="text-sm text-gray-500 font-bold mt-1">Konfirmasi pembayaran dan catat ke laporan keuangan</p>
               </div>

               <div className="space-y-6 mb-10">
                  <div className="p-6 bg-rose-50/50 rounded-[2rem] border-2 border-rose-100/50 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Total Biaya Pemeliharaan</p>
                    <p className="text-3xl font-black text-rose-600 tracking-tighter">Rp {postingRecord.cost.toLocaleString('id-ID')}</p>
                    <div className="mt-4 px-4 py-1.5 bg-white rounded-full border border-rose-100 flex items-center gap-2">
                       <span className="text-[10px] font-black text-rose-900 uppercase">{postingRecord.asset?.assetCode}</span>
                       <span className="w-1 h-1 bg-rose-200 rounded-full" />
                       <span className="text-[10px] font-bold text-rose-500 uppercase">{postingRecord.asset?.assetName}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <SearchableSelect
                      label="Pilih Sumber Dana (Akun Kas/Bank)"
                      options={coaOptions}
                      value={selectedCreditCoa}
                      onChange={(val) => setSelectedCreditCoa(val)}
                      placeholder="Cari akun kas atau bank..."
                    />
                    
                    {/* WARNING LABEL */}
                    {selectedCreditCoa && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 p-4 rounded-2xl border-2 flex items-start gap-3 ${isInsufficient ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        <div className="mt-0.5">{isInsufficient ? <FiAlertCircle className="w-4 h-4" /> : <FiCheckCircle className="w-4 h-4" />}</div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight">Informasi Saldo Kas</p>
                          <p className="text-sm font-black mt-0.5">Saldo Saat Ini: Rp {selectedBalance.toLocaleString('id-ID')}</p>
                          {isInsufficient && (
                            <p className="text-[10px] font-bold mt-1 uppercase text-rose-400 italic">Peringatan: Saldo tidak mencukupi untuk biaya ini!</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
               </div>

               <div className="flex gap-4">
                 <button onClick={() => setPostingModalOpen(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-[2rem] text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
                 <button 
                  onClick={handlePostToGL} 
                  disabled={postingLoading || !selectedCreditCoa || isInsufficient}
                  className={`flex-1 py-4 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${isInsufficient ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/40'}`}
                 >
                   {postingLoading ? 'SEDANG POSTING...' : isInsufficient ? 'SALDO KURANG' : 'KONFIRMASI POSTING'}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({ title, value, icon, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-32 h-32 ${color} bg-opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000`} />
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 w-fit mb-4`}>{icon}</div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
        {typeof value === 'number' && title.includes('Biaya') ? `Rp ${value.toLocaleString('id-ID')}` : value}
      </h3>
    </motion.div>
  )
}
