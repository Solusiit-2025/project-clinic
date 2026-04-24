'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { 
  FiTrendingDown, FiPlay, FiCheckCircle, FiAlertCircle, 
  FiCalendar, FiInfo, FiActivity, FiArrowLeft
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

type AssetToDepreciate = {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  purchasePrice: number;
  totalDepreciated: number;
  bookValue: number;
  monthlyDepreciation: number;
  status: string;
  clinic?: { name: string; code: string };
}

export default function DepreciationPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<AssetToDepreciate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Reuse the register endpoint to get assets and their monthly depreciation
      const { data: resData } = await axios.get(`${API}/assets/register`, { 
        headers, 
        params: { status: 'active' } 
      })
      setData(resData.assets || [])
    } catch (e) {
      console.error('Failed to fetch assets for depreciation', e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDepreciateAll = async () => {
    if (!confirm(`Proses penyusutan untuk periode ${period}? Tindakan ini akan membuat jurnal akuntansi otomatis.`)) return
    
    setProcessing(true)
    setResult(null)
    try {
      const { data: res } = await axios.post(`${API}/assets/depreciate-all`, { 
        period,
        clinicId: activeClinicId
      }, { headers })
      setResult(res)
      fetchData()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal memproses penyusutan')
    } finally {
      setProcessing(false)
    }
  }

  const columns: Column<AssetToDepreciate>[] = [
    { 
      key: 'assetName', 
      label: 'ASET / KODE', 
      render: (r) => (
        <div className="py-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{r.assetCode}</p>
          <p className="text-sm font-black text-gray-900 leading-none uppercase">{r.assetName}</p>
        </div>
      )
    },
    {
      key: 'bookValue',
      label: 'NILAI BUKU SAAT INI',
      render: (r) => (
        <span className="text-sm font-bold text-gray-700">
          Rp {r.bookValue.toLocaleString('id-ID')}
        </span>
      )
    },
    {
      key: 'monthlyDepreciation',
      label: 'BEBAN PENYUSUTAN',
      render: (r) => (
        <div className="flex items-center gap-2">
          <FiTrendingDown className="text-rose-500 w-3 h-3" />
          <span className="text-sm font-black text-rose-600">
            Rp {r.monthlyDepreciation.toLocaleString('id-ID')}
          </span>
        </div>
      )
    },
    {
      key: 'clinic',
      label: 'CABANG',
      render: (r) => (
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
          {r.clinic?.name || 'Pusat'}
        </span>
      )
    }
  ]

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#f8f9fc]">
      <PageHeader
        title="Penyusutan Aset"
        subtitle="Proses pembebanan nilai aset tetap secara periodik (Bulanan)"
        icon={<FiTrendingDown className="w-6 h-6" />}
        breadcrumb={['Admin', 'Manajemen Aset', 'Penyusutan']}
        onAdd={handleDepreciateAll}
        addLabel={processing ? 'Memproses...' : 'Proses Penyusutan Massal'}
      />

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-4">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
           <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <FiCalendar className="w-8 h-8" />
           </div>
           <div className="flex-1">
              <h4 className="text-lg font-black text-gray-900 tracking-tight mb-1">Periode Penyusutan</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">Pilih bulan untuk mencatat beban penyusutan ke dalam jurnal akuntansi.</p>
           </div>
           <div className="w-full md:w-auto">
              <input 
                type="month" 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full md:w-48 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
              />
           </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <FiInfo className="w-5 h-5 text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Info Otomatisasi</span>
              </div>
              <p className="text-sm font-bold leading-relaxed text-indigo-50">
                Sistem akan melewatkan aset yang sudah mencapai nilai residu atau yang sudah disusutkan pada periode terpilih.
              </p>
           </div>
        </div>
      </div>

      {/* Result Alert */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className={`p-6 rounded-[2rem] border ${result.errorCount > 0 ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'} flex items-start gap-4 shadow-sm`}>
               {result.errorCount > 0 ? <FiAlertCircle className="w-6 h-6 mt-1" /> : <FiCheckCircle className="w-6 h-6 mt-1" />}
               <div>
                  <h5 className="font-black text-lg tracking-tight mb-1">
                    {result.errorCount > 0 ? 'Proses Selesai dengan Catatan' : 'Penyusutan Berhasil Diproses'}
                  </h5>
                  <p className="text-sm font-medium opacity-80">
                    Periode: <span className="font-black">{result.period}</span> • 
                    Berhasil: <span className="font-black">{result.synced}</span> • 
                    Dilewati: <span className="font-black">{result.skipped}</span>
                  </p>
                  {result.errors?.length > 0 && (
                    <div className="mt-4 p-4 bg-white/50 rounded-xl text-xs font-bold space-y-1">
                      {result.errors.map((err: string, i: number) => <p key={i} className="text-amber-700">• {err}</p>)}
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari aset..."
          groupBy={(r) => r.clinic?.name || 'Pusat'}
        />
      </div>

      <div className="mt-8 flex justify-center">
         <button 
          onClick={() => window.location.href = '/admin/assets/register'}
          className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all"
         >
           <FiArrowLeft className="w-4 h-4" />
           <span>Kembali ke Register Aset</span>
         </button>
      </div>
    </div>
  )
}
