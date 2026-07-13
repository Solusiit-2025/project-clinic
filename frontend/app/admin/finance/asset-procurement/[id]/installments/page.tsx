'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'

export default function InstallmentsPage() {
  const router = useRouter()
  const params = useParams()
  const { activeClinicId } = useAuthStore()
  
  const [po, setPo] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [banks, setBanks] = useState<any[]>([])
  const [selectedBank, setSelectedBank] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [payingScheduleId, setPayingScheduleId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    fetchBanks()
  }, [activeClinicId, params.id])
  
  const fetchBanks = async () => {
    try {
      const res = await api.get('/master/banks')
      setBanks(res.data)
    } catch(e) {}
  }

  const fetchData = async () => {
    if (!activeClinicId || !params.id) return
    setIsLoading(true)
    try {
      const res = await api.get('/finance/asset-procurement', {
        params: { branchId: activeClinicId }
      })
      const currentPo = res.data.find((p: any) => p.id === params.id)
      if (currentPo) {
        setPo(currentPo)
        setSchedules(currentPo.schedules || [])
      }
    } catch (error) {
      toast.error('Gagal memuat jadwal cicilan')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayClick = (scheduleId: string) => {
    setPayingScheduleId(scheduleId)
    setIsModalOpen(true)
  }

  const confirmPay = async () => {
    if (!payingScheduleId || !selectedBank) {
      toast.error('Pilih kas/bank terlebih dahulu')
      return
    }
    
    try {
      await api.post(`/finance/asset-procurement/schedules/${payingScheduleId}/pay`, {
        clinicId: activeClinicId,
        bankId: selectedBank
      })
      toast.success('Pembayaran berhasil dicatat')
      setIsModalOpen(false)
      setPayingScheduleId(null)
      fetchData() // Refresh
    } catch (e) {
      toast.error('Gagal mencatat pembayaran')
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>
  if (!po) return <div className="p-8 text-center text-gray-500">Data PO tidak ditemukan</div>

  const totalPaid = schedules.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalUnpaid = schedules.filter(s => s.status === 'UNPAID').reduce((sum, s) => sum + s.totalAmount, 0)

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Jadwal Cicilan Aset</h1>
          <p className="text-gray-500 mt-1">Nomor PO: <span className="font-bold">{po.procurementNo}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Ringkasan Hutang</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Total Pembelian</span>
                <span className="font-bold">Rp {po.totalAmount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Uang Muka (DP)</span>
                <span className="font-bold text-emerald-600">Rp {po.downPayment.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Total Bunga</span>
                <span className="font-bold">Rp {po.totalInterest.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Sudah Dibayar</span>
                  <span className="font-bold text-emerald-600">Rp {totalPaid.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sisa Tagihan</span>
                  <span className="font-bold text-rose-600">Rp {totalUnpaid.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4">Bulan</th>
                  <th className="p-4">Jatuh Tempo</th>
                  <th className="p-4 text-right">Pokok + Bunga</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schedules.map((schedule, i) => (
                  <tr key={schedule.id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-sm font-medium">Cicilan ke-{i+1}</td>
                    <td className="p-4 text-sm">{new Date(schedule.dueDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })}</td>
                    <td className="p-4 text-sm font-bold text-right text-gray-800">
                      Rp {schedule.totalAmount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {schedule.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3.5 h-3.5" /> LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <Clock className="w-3.5 h-3.5" /> BELUM
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {schedule.status === 'UNPAID' && (
                        <button
                          onClick={() => handlePayClick(schedule.id)}
                          className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg transition-all"
                        >
                          Bayar Sekarang
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Konfirmasi Pembayaran</h3>
            <p className="text-sm text-gray-500">Pilih rekening Kas/Bank yang akan digunakan untuk membayar cicilan ini. Aksi ini akan mencatat jurnal secara otomatis.</p>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Kas / Bank</label>
              <select 
                value={selectedBank} 
                onChange={e => setSelectedBank(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm bg-gray-50"
              >
                <option value="">-- Pilih Kas / Bank --</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={confirmPay}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
