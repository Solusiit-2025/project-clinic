'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { 
  FiBox, FiTrendingDown, FiDollarSign, FiActivity, 
  FiCalendar, FiPieChart, FiBarChart2, FiArrowRight 
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

type AssetRegister = {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  totalDepreciated: number;
  bookValue: number;
  monthlyDepreciation: number;
  remainingMonths: number;
  depreciationPercent: number;
  status: string;
  condition: string;
  clinic?: { name: string; code: string };
  coaAsset?: { code: string; name: string };
  coaAccumDep?: { code: string; name: string };
}

type SummaryData = {
  count: number;
  grandTotalCost: number;
  grandTotalDepreciated: number;
  grandTotalBookValue: number;
}

export default function AssetRegisterPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<AssetRegister[]>([])
  const [totals, setTotals] = useState<SummaryData>({
    count: 0,
    grandTotalCost: 0,
    grandTotalDepreciated: 0,
    grandTotalBookValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [clinics, setClinics] = useState<any[]>([])
  const [filterClinic, setFilterClinic] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterType) params.assetType = filterType
      if (filterClinic) params.clinicId = filterClinic
      
      const { data: resData } = await axios.get(`${API}/assets/register`, { headers, params })
      setData(resData.assets || [])
      setTotals(resData.totals || { count: 0, grandTotalCost: 0, grandTotalDepreciated: 0, grandTotalBookValue: 0 })
    } catch (e) {
      console.error('Failed to fetch asset register', e)
    } finally {
      setLoading(false)
    }
  }, [token, filterType, filterClinic])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/clinics`, { headers })
      setClinics(data)
    } catch (e) { console.error('Failed to fetch clinics', e) }
  }, [token])

  useEffect(() => {
    fetchData()
    fetchClinics()
  }, [fetchData, fetchClinics])

  const columns: Column<AssetRegister>[] = [
    { 
      key: 'assetName', 
      label: 'ASET & KODE', 
      render: (r) => (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">
              {r.assetCode}
            </span>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider">
              {r.assetType.replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{r.assetName}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase italic">{r.category || 'Tanpa Lokasi'}</p>
        </div>
      )
    },
    {
      key: 'purchasePrice',
      label: 'NILAI PEROLEHAN',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900">
            Rp {r.purchasePrice.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
            {new Date(r.purchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      key: 'totalDepreciated',
      label: 'AKUM. PENYUSUTAN',
      render: (r) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
             <span className="text-sm font-black text-rose-600">
               (Rp {r.totalDepreciated.toLocaleString('id-ID')})
             </span>
             <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full">
               {r.depreciationPercent}%
             </span>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(r.depreciationPercent, 100)}%` }} 
            />
          </div>
        </div>
      )
    },
    {
      key: 'bookValue',
      label: 'NILAI BUKU',
      render: (r) => (
        <div className="flex flex-col bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Current Value</span>
          <span className="text-sm font-black text-emerald-900 tracking-tight">
            Rp {r.bookValue.toLocaleString('id-ID')}
          </span>
        </div>
      )
    },
    {
      key: 'monthlyDepreciation',
      label: 'PENYUSUTAN / BLN',
      mobileHide: true,
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-gray-700">
            Rp {r.monthlyDepreciation.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
            Sisa {r.remainingMonths} Bulan
          </span>
        </div>
      )
    },
    {
      key: 'clinic',
      label: 'UNIT / CABANG',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
            {r.clinic?.name || 'Pusat'}
          </span>
          <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
             Code: {r.clinic?.code || 'MAIN'}
          </span>
        </div>
      )
    }
  ]

  const SummaryCard = ({ title, value, icon, color, trend }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
             {trend}
           </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
          {typeof value === 'number' ? `Rp ${value.toLocaleString('id-ID')}` : value}
        </h3>
      </div>
    </motion.div>
  )

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#fcfcfd]">
      <PageHeader
        title="Register Aset"
        subtitle="Daftar inventaris lengkap dengan rincian nilai buku dan akumulasi penyusutan"
        icon={<FiBarChart2 className="w-6 h-6" />}
        breadcrumb={['Admin', 'Manajemen Aset', 'Register Aset']}
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
        <SummaryCard 
          title="Total Aset" 
          value={totals.count + " Unit"} 
          icon={<FiBox className="w-6 h-6 text-indigo-600" />} 
          color="bg-indigo-600"
          trend="Aktif"
        />
        <SummaryCard 
          title="Harga Perolehan" 
          value={totals.grandTotalCost} 
          icon={<FiDollarSign className="w-6 h-6 text-blue-600" />} 
          color="bg-blue-600"
        />
        <SummaryCard 
          title="Akum. Penyusutan" 
          value={totals.grandTotalDepreciated} 
          icon={<FiTrendingDown className="w-6 h-6 text-rose-600" />} 
          color="bg-rose-600"
        />
        <SummaryCard 
          title="Total Nilai Buku" 
          value={totals.grandTotalBookValue} 
          icon={<FiPieChart className="w-6 h-6 text-emerald-600" />} 
          color="bg-emerald-600"
          trend="Asset Value"
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
          searchPlaceholder="Cari kode aset atau nama barang..."
          groupBy={(r) => r.assetType.toUpperCase().replace('-', ' ')}
          extraFilters={
            <div className="flex gap-2">
              <select 
                value={filterClinic} 
                onChange={(e) => setFilterClinic(e.target.value)}
                className="px-4 py-2.5 text-xs border border-gray-100 rounded-2xl focus:outline-none focus:border-primary bg-gray-50 font-black text-gray-600 shadow-sm transition-all"
              >
                <option value="">Seluruh Cabang</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 text-xs border border-gray-100 rounded-2xl focus:outline-none focus:border-primary bg-gray-50 font-black text-gray-600 shadow-sm transition-all"
              >
                <option value="">Semua Tipe</option>
                {['equipment','furniture','vehicle','computer','clinical-device','other'].map(t => (
                  <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-8 bg-indigo-600 rounded-[3rem] text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <h4 className="text-xl font-black mb-2 tracking-tight">Butuh Update Penyusutan Berkala?</h4>
            <p className="text-indigo-100 text-sm font-medium opacity-80 max-w-xl leading-relaxed">
              Sistem menghitung penyusutan secara otomatis setiap bulan berdasarkan metode yang dipilih pada masing-masing master aset. Pastikan data perolehan awal sudah benar untuk akurasi laporan keuangan.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/admin/assets/depreciation'}
            className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            <span>Buka Modul Penyusutan</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
