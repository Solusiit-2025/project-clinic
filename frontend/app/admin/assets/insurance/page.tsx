'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { 
  FiShield, FiPlus, FiSearch, FiFilter, FiCheckCircle, 
  FiAlertCircle, FiCalendar, FiPhone, FiUser, FiInfo, FiMoreVertical, FiTrash2, FiEdit2
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

type Insurance = {
  id?: string;
  assetId: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

type AssetWithInsurance = {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  status: string;
  clinic?: { name: string; code: string };
  insurance?: Insurance & { isPosted: boolean; postedAt: string; journalId?: string };
}

export default function AssetInsurancePage() {
  const [assets, setAssets] = useState<AssetWithInsurance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('')
  const [clinics, setClinics] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithInsurance | null>(null)
  const [formData, setFormData] = useState<Partial<Insurance>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [banks, setBanks] = useState<any[]>([])
  const [paymentData, setPaymentData] = useState({ paymentMethod: 'cash', bankId: '', notes: '' })
  const [isPostingGL, setIsPostingGL] = useState(false)


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterClinic) params.clinicId = filterClinic
      
      const { data } = await api.get('/master/assets', { 
        params: { ...params, _t: Date.now() } 
      })
      setAssets(data || [])
    } catch (e) {
      console.error('Failed to fetch assets', e)
      toast.error('Gagal mengambil data aset')
    } finally {
      setLoading(false)
    }
  }, [filterClinic])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await api.get('/master/clinics')
      setClinics(data)
    } catch (e) { console.error('Failed to fetch clinics', e) }
  }, [])

  const fetchBanks = useCallback(async () => {
    try {
      const { data } = await api.get('/master/banks')
      setBanks(data)
    } catch (e) { console.error('Failed to fetch banks', e) }
  }, [])

  useEffect(() => {
    fetchData()
    fetchClinics()
    fetchBanks()
  }, [fetchData, fetchClinics, fetchBanks])

  const handleOpenModal = (asset: AssetWithInsurance) => {
    setSelectedAsset(asset)
    if (asset.insurance) {
      setFormData({
        ...asset.insurance,
        startDate: asset.insurance.startDate.split('T')[0],
        endDate: asset.insurance.endDate.split('T')[0],
        renewalDate: asset.insurance.renewalDate?.split('T')[0]
      })
    } else {
      setFormData({
        assetId: asset.id,
        insuranceCompany: '',
        policyNumber: '',
        coverageAmount: 0,
        premium: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return
    
    setIsSubmitting(true)
    try {
      await api.post(`/master/assets/${selectedAsset.id}/insurance`, formData)
      toast.success('Informasi asuransi berhasil disimpan')
      setIsModalOpen(false)
      fetchData()
    } catch (e: any) {
      console.error('Failed to save insurance', e)
      toast.error(e.response?.data?.message || 'Gagal menyimpan data asuransi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenPayment = (asset: AssetWithInsurance) => {
    setSelectedAsset(asset)
    setPaymentData({ paymentMethod: 'cash', bankId: '', notes: '' })
    setIsPaymentModalOpen(true)
  }

  const handleDeleteInsurance = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data asuransi aset ini?')) return
    try {
      await api.delete(`/master/assets/${id}/insurance`)
      toast.success('Asuransi berhasil dihapus')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menghapus asuransi')
    }
  }

  const handlePostGL = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    setIsPostingGL(true)
    try {
      await api.post(`/master/assets/${selectedAsset.id}/insurance/post-gl`, paymentData)
      toast.success('Berhasil memposting ke Laporan Keuangan')
      setIsPaymentModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memposting ke keuangan')
    } finally {
      setIsPostingGL(false)
    }
  }

  const columns: Column<AssetWithInsurance>[] = [
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
          <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase leading-none">{r.clinic?.name || 'Pusat'}</p>
        </div>
      )
    },
    {
      key: 'insurance',
      label: 'STATUS ASURANSI',
      render: (r) => {
        if (!r.insurance) {
          return (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100/50 w-fit">
              <FiAlertCircle className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">Belum Diasuransikan</span>
            </div>
          )
        }

        const isExpired = new Date(r.insurance.endDate) < new Date()
        const isExpiringSoon = !isExpired && new Date(r.insurance.endDate) < new Date(new Date().setDate(new Date().getDate() + 30))

        return (
          <div className={`flex flex-col gap-1 p-3 rounded-2xl border ${
            isExpired ? 'bg-red-50 border-red-100' : 
            isExpiringSoon ? 'bg-orange-50 border-orange-100' : 
            'bg-emerald-50 border-emerald-100'
          }`}>
            <div className="flex items-center gap-2 mb-1">
               {isExpired ? <FiAlertCircle className="text-red-500" /> : <FiCheckCircle className="text-emerald-500" />}
               <span className={`text-xs font-black uppercase tracking-wider ${
                 isExpired ? 'text-red-700' : isExpiringSoon ? 'text-orange-700' : 'text-emerald-700'
               }`}>
                 {isExpired ? 'Kadaluarsa' : isExpiringSoon ? 'Akan Berakhir' : 'Terlindungi'}
               </span>
            </div>
            <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{r.insurance.insuranceCompany}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase">{r.insurance.policyNumber}</p>
              {r.insurance.isPosted && (
                <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">GL SYNC</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'coverage',
      label: 'PERTANGGUNGAN',
      render: (r) => r.insurance ? (
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900">Rp {r.insurance.coverageAmount.toLocaleString('id-ID')}</span>
          <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase leading-none">Premi: Rp {r.insurance.premium.toLocaleString('id-ID')}</span>
        </div>
      ) : <span className="text-gray-300">—</span>
    },
    {
       key: 'period',
       label: 'MASA BERLAKU',
       render: (r) => r.insurance ? (
         <div className="flex flex-col">
           <div className="flex items-center gap-1.5 mb-1.5">
              <FiCalendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-black text-gray-700">
                {new Date(r.insurance.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
           </div>
           <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
             {(() => {
               const start = new Date(r.insurance.startDate).getTime()
               const end = new Date(r.insurance.endDate).getTime()
               const now = new Date().getTime()
               const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100))
               return <div className={`h-full rounded-full ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
             })()}
           </div>
         </div>
       ) : <span className="text-gray-300">—</span>
    },
    {
      key: 'actions',
      label: 'OPSI',
      render: (r) => r.insurance && !r.insurance.isPosted ? (
        <button
          onClick={() => handleOpenPayment(r)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group"
        >
          <FiShield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Bayar & Post GL</span>
        </button>
      ) : r.insurance?.isPosted ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
          <FiCheckCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-wider">Terbayar</span>
        </div>
      ) : <span className="text-gray-200">—</span>
    }
  ]

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#fcfcfd]">
      <PageHeader
        title="Asuransi Aset"
        subtitle="Kelola jaminan keamanan dan masa berlaku asuransi untuk seluruh aset inventaris"
        icon={<FiShield className="w-6 h-6" />}
        breadcrumb={['Admin', 'Manajemen Aset', 'Asuransi Aset']}
      />

      <div className="mt-8 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          data={assets}
          columns={columns}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari aset atau kode aset..."
          onEdit={handleOpenModal}
          onDelete={(r) => r.insurance && handleDeleteInsurance(r.id)}
          extraFilters={
            <select 
              value={filterClinic} 
              onChange={(e) => setFilterClinic(e.target.value)}
              className="px-4 py-2.5 text-xs border border-gray-100 rounded-2xl focus:outline-none focus:border-primary bg-gray-50 font-black text-gray-600 shadow-sm transition-all"
            >
              <option value="">Seluruh Cabang</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          }
        />
      </div>

      <MasterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAsset?.insurance ? "Update Asuransi" : "Daftarkan Asuransi Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          {selectedAsset && (
            <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex items-start gap-4 mb-4">
               <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <FiShield className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedAsset.assetName}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{selectedAsset.assetCode}</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Perusahaan Asuransi</label>
              <input
                type="text"
                required
                value={formData.insuranceCompany || ''}
                onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                placeholder="Contoh: PT Asuransi Allianz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor Polis</label>
              <input
                type="text"
                required
                value={formData.policyNumber || ''}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                placeholder="POL-12345678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nilai Pertanggungan</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                <input
                  type="number"
                  required
                  value={formData.coverageAmount || 0}
                  onChange={(e) => setFormData({ ...formData, coverageAmount: Number(e.target.value) })}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Biaya Premi</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                <input
                  type="number"
                  required
                  value={formData.premium || 0}
                  onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Berakhir</label>
              <input
                type="date"
                required
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Informasi'}
            </button>
          </div>
        </form>
      </MasterModal>

      {/* MODAL PEMBAYARAN & POSTING GL */}
      <MasterModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Konfirmasi Pembayaran Premi"
      >
        <form onSubmit={handlePostGL} className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex items-start gap-4 mb-4">
             <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                <FiShield className="w-6 h-6" />
             </div>
             <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">PREMI ASURANSI</h4>
                <p className="text-xl font-black text-indigo-700 tracking-tighter">Rp {selectedAsset?.insurance?.premium.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-none">{selectedAsset?.insurance?.insuranceCompany} - {selectedAsset?.insurance?.policyNumber}</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, paymentMethod: 'cash' })}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${
                    paymentData.paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Tunai (KAS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, paymentMethod: 'transfer' })}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${
                    paymentData.paymentMethod === 'transfer' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Transfer BANK
                </button>
              </div>
            </div>

            {paymentData.paymentMethod === 'transfer' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Rekening Bank</label>
                <select
                  required
                  value={paymentData.bankId}
                  onChange={(e) => setPaymentData({ ...paymentData, bankId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                >
                  <option value="">— Pilih Bank —</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.accountName})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan Tambahan</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                placeholder="Misal: Bukti transfer terlampir di finance..."
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPostingGL}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
            >
              {isPostingGL ? 'Memuat...' : 'Konfirmasi & Post ke GL'}
            </button>
          </div>
        </form>
      </MasterModal>
    </div>
  )
}
