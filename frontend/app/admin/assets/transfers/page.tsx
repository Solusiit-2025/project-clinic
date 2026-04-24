'use client'

import { useState, useEffect } from 'react'
import { 
  FiArrowRight, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiFileText,
  FiPrinter,
  FiMoreVertical,
  FiMapPin,
  FiBox,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi'
import axios from 'axios'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import PageHeader from '@/components/admin/master/PageHeader'
import DataTable from '@/components/admin/master/DataTable'
import Modal from '@/components/admin/master/MasterModal'
import SearchableSelect from '@/components/admin/master/SearchableSelect'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

export default function AssetTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal states
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [processingLoading, setProcessingLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [transferData, setTransferData] = useState({
    toClinicId: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
    fetchAssets()
    fetchClinics()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(`${API}/assets/transfers/all`, { headers })
      setTransfers(res.data)
    } catch (e: any) {
      setError('Gagal memuat data transfer')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(`${API}/assets`, { headers })
      setAssets(res.data.filter((a: any) => a.status === 'active'))
    } catch (e) {}
  }

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(`${API}/clinics`, { headers })
      setClinics(res.data)
    } catch (e) {}
  }

  const handleRequestTransfer = async (e: any) => {
    e.preventDefault()
    if (!selectedAsset || !transferData.toClinicId) {
      setError('Pilih aset dan klinik tujuan')
      return
    }

    setRequestLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.post(`${API}/assets/${selectedAsset.id}/transfer`, transferData, { headers })
      setSuccess('Permintaan transfer berhasil dibuat')
      setRequestModalOpen(false)
      fetchData()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal membuat permintaan transfer')
    } finally {
      setRequestLoading(false)
    }
  }

  const handleApprove = async () => {
    setProcessingLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.put(`${API}/assets/transfer/${selectedTransfer.id}/approve`, {}, { headers })
      setSuccess('Transfer disetujui dan berhasil diposting ke GL')
      setApprovalModalOpen(false)
      fetchData()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal menyetujui transfer')
    } finally {
      setProcessingLoading(false)
    }
  }

  const handleReject = async (reason: string) => {
    setProcessingLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.put(`${API}/assets/transfer/${selectedTransfer.id}/reject`, { notes: reason }, { headers })
      setSuccess('Transfer berhasil ditolak')
      setRejectionModalOpen(false)
      fetchData()
    } catch (e: any) {
      setError('Gagal menolak transfer')
    } finally {
      setProcessingLoading(false)
    }
  }

  const handleSyncOpeningBalance = async () => {
    if (!confirm('Apakah Anda yakin ingin menyinkronkan saldo awal aset dengan General Ledger? Ini akan membuat jurnal penyesuaian jika ada selisih.')) return

    setSyncLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.post(`${API}/assets/sync-opening-balance`, { goLiveDate: new Date().toISOString().split('T')[0] }, { headers })
      setSuccess(res.data.message)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal sinkronisasi saldo awal')
    } finally {
      setSyncLoading(false)
    }
  }

  const columns = [
    {
      key: 'transferNo',
      label: 'NOMOR & TANGGAL',
      render: (r: any) => (
        <div className="py-2">
          <p className="text-xs font-black text-indigo-600 tracking-widest leading-none mb-1 uppercase">{r.transferNo}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
            {format(new Date(r.transferDate), 'dd MMM yyyy', { locale: idLocale })}
          </p>
        </div>
      )
    },
    {
      key: 'asset',
      label: 'ASET',
      render: (r: any) => (
        <div className="py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
            <FiBox className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{r.asset?.assetName}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{r.asset?.assetCode}</p>
          </div>
        </div>
      )
    },
    {
      key: 'movement',
      label: 'PERPINDAHAN CABANG',
      render: (r: any) => (
        <div className="py-2 flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">DARI</p>
            <p className="text-xs font-bold text-gray-900 uppercase">{r.fromClinic?.name}</p>
          </div>
          <FiArrowRight className="w-4 h-4 text-indigo-300" />
          <div className="text-left">
            <p className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">KE</p>
            <p className="text-xs font-bold text-gray-900 uppercase">{r.toClinic?.name}</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (r: any) => {
        const configs: any = {
          pending: { icon: <FiClock />, label: 'Menunggu', color: 'bg-amber-50 text-amber-600 border-amber-100' },
          approved: { icon: <FiCheckCircle />, label: 'Disetujui', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          rejected: { icon: <FiXCircle />, label: 'Ditolak', color: 'bg-rose-50 text-rose-600 border-rose-100' }
        }
        const config = configs[r.status] || configs.pending
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.color}`}>
            <span className="text-[10px]">{config.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'AKSI',
      render: (r: any) => (
        <div className="flex items-center gap-2">
          {r.status === 'pending' && (
            <>
              <button 
                onClick={() => {
                  setSelectedTransfer(r)
                  setApprovalModalOpen(true)
                }}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                title="Setujui & Post GL"
              >
                <FiCheckCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setSelectedTransfer(r)
                  setRejectionModalOpen(true)
                }}
                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                title="Tolak"
              >
                <FiXCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {r.status === 'approved' && (
            <button 
              onClick={() => window.open(`/admin/assets/transfers/print/${r.id}`, '_blank')}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 text-[10px] font-bold"
            >
              <FiPrinter className="w-3.5 h-3.5" />
              CETAK SURAT JALAN
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Asset Transfer Control"
        subtitle="Kelola perpindahan aset antar klinik dengan integrasi General Ledger otomatis."
        icon={<FiTruck className="w-6 h-6" />}
        breadcrumb={['Admin', 'Aset', 'Transfer']}
      >
        <button 
          onClick={handleSyncOpeningBalance}
          disabled={syncLoading}
          className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
          {syncLoading ? 'Sinkronisasi...' : 'Sync Saldo Awal'}
        </button>
        <button 
          onClick={() => setRequestModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Request Transfer
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Menunggu Approval</p>
            <p className="text-2xl font-black text-gray-900">{transfers.filter(t => t.status === 'pending').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disetujui Bulan Ini</p>
            <p className="text-2xl font-black text-gray-900">{transfers.filter(t => t.status === 'approved').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FiTruck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Perpindahan</p>
            <p className="text-2xl font-black text-gray-900">{transfers.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Riwayat Transfer Aset</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Cari aset..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={transfers}
          loading={loading}
        />
      </div>

      {/* Request Modal */}
      <Modal 
        isOpen={requestModalOpen} 
        onClose={() => setRequestModalOpen(false)}
        title="Buat Permintaan Transfer"
      >
        <form onSubmit={handleRequestTransfer} className="space-y-6 p-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Aset</label>
            <SearchableSelect
              options={assets.map((a: any) => ({ id: a.id, label: `${a.assetCode} - ${a.assetName}` }))}
              value={selectedAsset?.id || ''}
              onChange={(id: string) => setSelectedAsset(assets.find((a: any) => a.id === id))}
              placeholder="Cari aset yang akan ditransfer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Klinik Tujuan</label>
              <select 
                required
                value={transferData.toClinicId}
                onChange={(e) => setTransferData({ ...transferData, toClinicId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih Tujuan...</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Transfer</label>
              <input 
                type="date"
                required
                value={transferData.transferDate}
                onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alasan Transfer</label>
            <textarea 
              rows={2}
              required
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500"
              placeholder="Berikan alasan pemindahan aset..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={requestLoading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              {requestLoading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal 
        isOpen={approvalModalOpen} 
        onClose={() => setApprovalModalOpen(false)}
        title="Konfirmasi Persetujuan Transfer"
      >
        <div className="space-y-6 p-2">
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                <FiBox className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Aset Yang Dipindahkan</p>
                <p className="text-sm font-black text-indigo-900 uppercase">{selectedTransfer?.asset?.assetName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-100">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Rencana Perpindahan</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase">{selectedTransfer?.fromClinic?.name}</span>
                  <FiArrowRight className="w-3 h-3 text-indigo-300" />
                  <span className="text-xs font-black text-indigo-900 uppercase">{selectedTransfer?.toClinic?.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Nilai Buku (Post GL)</p>
                <p className="text-xs font-black text-indigo-900">
                  Rp {(selectedTransfer?.asset?.purchasePrice - selectedTransfer?.asset?.totalDepreciated || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start text-amber-800">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold leading-relaxed">
              Tindakan ini akan secara otomatis memindahkan kepemilikan aset di database dan membuat entri jurnal di General Ledger untuk kedua klinik.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setApprovalModalOpen(false)}
              className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleApprove}
              disabled={processingLoading}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {processingLoading ? 'Memproses...' : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  Setujui & Post GL
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal 
        isOpen={rejectionModalOpen} 
        onClose={() => setRejectionModalOpen(false)}
        title="Tolak Permintaan Transfer"
      >
        <div className="space-y-6 p-2">
          <p className="text-xs font-bold text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin menolak transfer untuk aset <span className="text-gray-900 font-black uppercase">{selectedTransfer?.asset?.assetName}</span>?
          </p>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alasan Penolakan</label>
            <textarea 
              id="rejectionReason"
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-rose-500"
              placeholder="Berikan alasan mengapa transfer ini ditolak..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setRejectionModalOpen(false)}
              className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                const reason = (document.getElementById('rejectionReason') as HTMLTextAreaElement)?.value
                if (!reason) return alert('Mohon isi alasan penolakan')
                handleReject(reason)
              }}
              disabled={processingLoading}
              className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100"
            >
              {processingLoading ? 'Memproses...' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success/Error Toasts */}
      {(success || error) && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex items-center gap-3 border ${
          success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {success ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
          <p className="text-xs font-black uppercase tracking-wider">{success || error}</p>
          <button onClick={() => { setSuccess(''); setError('') }} className="ml-4 opacity-50 hover:opacity-100">
            <FiXCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
