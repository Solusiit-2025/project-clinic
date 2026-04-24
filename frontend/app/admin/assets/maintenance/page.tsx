'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { 
  FiSettings, FiPlus, FiTool, FiCalendar, FiDollarSign, 
  FiUser, FiAlertCircle, FiCheckCircle, FiClock, FiSearch,
  FiFileText, FiArrowRight
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
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<MaintenanceRecord[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

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
  }, [token])

  const fetchAssets = useCallback(async () => {
    try {
      const { data: res } = await axios.get(`${API}/assets`, { headers })
      setAssets(res)
    } catch (e) { console.error('Failed to fetch assets', e) }
  }, [token])

  useEffect(() => {
    fetchData()
    fetchAssets()
  }, [fetchData, fetchAssets])

  const assetOptions = useMemo(() => assets.map(a => ({
    id: a.id,
    label: a.assetName,
    code: a.assetCode,
    description: `${a.assetType.toUpperCase()} - ${a.clinic?.name || 'Central'}`
  })), [assets])

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

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus record maintenance ini?')) return
    try {
      await axios.delete(`${API}/assets/maintenance/${id}`, { headers })
      fetchData()
    } catch (e) { alert('Gagal menghapus') }
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
          <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase italic">{r.asset?.clinic?.name || 'Pusat'}</p>
        </div>
      )
    },
    {
      key: 'maintenanceDate',
      label: 'JADWAL & TIPE',
      render: (r) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {r.maintenanceType}
            </span>
          </div>
          <span className="text-xs font-black text-gray-800">
            {new Date(r.maintenanceDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {r.nextMaintenanceDate && (
             <span className="text-[9px] text-rose-500 font-bold mt-1 uppercase flex items-center gap-1">
               <FiClock className="w-2.5 h-2.5" /> Next: {new Date(r.nextMaintenanceDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
             </span>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'KETERANGAN / TINDAKAN',
      render: (r) => (
        <div className="max-w-[200px]">
          <p className="text-xs font-bold text-gray-700 line-clamp-2 leading-relaxed">{r.description}</p>
          {r.performedBy && (
             <p className="text-[9px] text-gray-400 font-black mt-1 uppercase flex items-center gap-1">
               <FiUser className="w-2.5 h-2.5" /> {r.performedBy}
             </p>
          )}
        </div>
      )
    },
    {
      key: 'cost',
      label: 'BIAYA (FINANCIAL)',
      render: (r) => (
        <div className="flex flex-col">
          <span className={`text-sm font-black ${r.cost > 0 ? 'text-rose-600' : 'text-gray-400 italic'}`}>
            {r.cost > 0 ? `Rp ${r.cost.toLocaleString('id-ID')}` : 'Gratis / Garansi'}
          </span>
          {r.cost > 0 && (
            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded mt-1 w-fit uppercase border border-emerald-100">
              Synced to GL
            </span>
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
            onClick={() => { setEditing(r); setForm({ ...r, maintenanceDate: r.maintenanceDate.substring(0,10), nextMaintenanceDate: r.nextMaintenanceDate?.substring(0,10) || '' }); setModalOpen(true); }}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
          >
            <FiSettings className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const SummaryCard = ({ title, value, subValue, icon, color }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all group overflow-hidden relative"
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 ${color} bg-opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
          {typeof value === 'number' && title.includes('Biaya') ? `Rp ${value.toLocaleString('id-ID')}` : value}
        </h3>
        {subValue && <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase italic">{subValue}</p>}
      </div>
    </motion.div>
  )

  const totals = useMemo(() => {
    const cost = data.reduce((sum, r) => sum + (r.cost || 0), 0)
    const upcoming = data.filter(r => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) > new Date()).length
    return { cost, count: data.length, upcoming }
  }, [data])

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#fcfcfd]">
      <PageHeader
        title="Maintenance & Perawatan"
        subtitle="Kelola riwayat pemeliharaan berkala dan perbaikan aset tetap klinik"
        icon={<FiTool className="w-6 h-6" />}
        breadcrumb={['Admin', 'Manajemen Aset', 'Maintenance']}
        onAdd={() => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); }}
        addLabel="Catat Maintenance"
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
        <SummaryCard 
          title="Total Perawatan" 
          value={totals.count} 
          subValue="Record Terdaftar"
          icon={<FiFileText className="w-6 h-6 text-indigo-600" />} 
          color="bg-indigo-600"
        />
        <SummaryCard 
          title="Total Biaya Pemeliharaan" 
          value={totals.cost} 
          subValue="Terjurnal ke Buku Besar"
          icon={<FiDollarSign className="w-6 h-6 text-rose-600" />} 
          color="bg-rose-600"
        />
        <SummaryCard 
          title="Jadwal Mendatang" 
          value={totals.upcoming} 
          subValue="Service Rutin Berikutnya"
          icon={<FiClock className="w-6 h-6 text-emerald-600" />} 
          color="bg-emerald-600"
        />
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari berdasarkan aset, deskripsi, atau teknisi..."
          groupBy={(r) => r.maintenanceType.toUpperCase()}
        />
      </div>

      {/* MODAL */}
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
               placeholder="Cari kode atau nama aset..."
               disabled={!!editing}
             />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-blue-600">Tanggal Maintenance</label>
            <input 
              type="date" value={form.maintenanceDate} 
              onChange={(e) => setForm(p => ({...p, maintenanceDate: e.target.value}))} 
              className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none font-bold text-sm text-gray-700" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-blue-600">Tipe Perawatan</label>
            <select 
              value={form.maintenanceType} 
              onChange={(e) => setForm(p => ({...p, maintenanceType: e.target.value}))} 
              className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none font-bold text-sm text-gray-700 appearance-none bg-white"
            >
              <option value="Routine">Routine Service</option>
              <option value="Repair">Repair / Perbaikan</option>
              <option value="Upgrade">Upgrade / Penggantian Part</option>
              <option value="Inspection">Inspection / Kalibrasi</option>
            </select>
          </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-blue-600">Tindakan / Deskripsi</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Apa saja yang dilakukan pada aset ini?"
                rows={5}
                className="w-full px-5 py-3.5 rounded-[2rem] border-2 border-blue-100 focus:border-primary outline-none font-bold text-sm text-gray-700 resize-none" 
              />
            </div>

          <div className="p-6 bg-rose-50/50 border-2 border-rose-100/50 rounded-[2.5rem]">
             <div className="flex items-center gap-3 mb-4">
               <FiDollarSign className="text-rose-600 w-5 h-5" />
               <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Biaya Maintenance</span>
             </div>
             <input 
              type="number" value={form.cost} 
              onChange={(e) => setForm(p => ({...p, cost: Number(e.target.value)}))} 
              className="w-full px-5 py-3.5 rounded-2xl border-2 border-rose-100 bg-white focus:border-rose-500 outline-none font-black text-lg text-rose-900 shadow-inner" 
            />
            <p className="text-[9px] text-rose-400 font-bold mt-2 italic">* Jika &gt; 0, sistem akan otomatis mencatat jurnal beban (Expense).</p>
          </div>

          <div className="p-6 bg-emerald-50/50 border-2 border-emerald-100/50 rounded-[2.5rem]">
             <div className="flex items-center gap-3 mb-4">
               <FiCalendar className="text-emerald-600 w-5 h-5" />
               <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Jadwal Berikutnya</span>
             </div>
             <input 
              type="date" value={form.nextMaintenanceDate} 
              onChange={(e) => setForm(p => ({...p, nextMaintenanceDate: e.target.value}))} 
              className="w-full px-5 py-3.5 rounded-2xl border-2 border-emerald-100 bg-white focus:border-emerald-500 outline-none font-bold text-sm text-emerald-900" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-blue-600">Teknisi / Pelaksana</label>
            <input 
              type="text" value={form.performedBy} 
              onChange={(e) => setForm(p => ({...p, performedBy: e.target.value}))} 
              placeholder="Nama Teknisi atau Vendor..."
              className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none font-bold text-sm text-gray-700" 
            />
          </div>

          <div>
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-blue-600">Catatan Tambahan</label>
             <input 
              type="text" value={form.notes} 
              onChange={(e) => setForm(p => ({...p, notes: e.target.value}))} 
              placeholder="Catatan tambahan (opsional)..."
              className="w-full px-5 py-3.5 rounded-3xl border-2 border-blue-100 focus:border-primary outline-none font-bold text-sm text-gray-700" 
            </div>
          </div>
          
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-4 border-2 border-gray-100 rounded-[2rem] text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 py-4 bg-primary text-white rounded-[2rem] text-[11px] font-black tracking-widest uppercase shadow-xl shadow-primary/20 disabled:opacity-60 transition-all active:scale-95"
            >
              {saving ? 'SEDANG MENYIMPAN...' : 'SIMPAN MAINTENANCE'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-100">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </MasterModal>

      {/* FOOTER INFO */}
      <div className="mt-8 p-8 bg-gradient-to-br from-gray-900 to-indigo-900 rounded-[3rem] text-white overflow-hidden relative group shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-120 transition-transform duration-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <FiActivity className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-black tracking-tight">Kesehatan Aset & Integritas Keuangan</h4>
            </div>
            <p className="text-indigo-100/60 text-sm font-medium max-w-2xl leading-relaxed">
              Modul maintenance ini terintegrasi langsung dengan sistem Akuntansi. Setiap biaya pemeliharaan yang Anda masukkan akan otomatis membuat jurnal pengeluaran kas dan beban pemeliharaan di Buku Besar. Pastikan mencatat setiap perawatan untuk menjaga nilai ekonomis aset Anda.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
             <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
               <FiCheckCircle className="text-emerald-400 w-5 h-5" />
               <span className="text-xs font-black uppercase tracking-widest">Auto Journaling</span>
             </div>
             <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
               <FiCheckCircle className="text-emerald-400 w-5 h-5" />
               <span className="text-xs font-black uppercase tracking-widest">Asset Lifecycle</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FiActivity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
