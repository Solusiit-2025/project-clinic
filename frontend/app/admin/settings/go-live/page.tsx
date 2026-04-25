'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiShield, FiTrash2, FiDatabase, FiSettings } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

export default function GoLiveSetupPage() {
  const { user, activeClinicId } = useAuthStore()
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetType, setResetType] = useState<'CLINIC' | 'ALL'>('CLINIC')

  const REQUIRED_TEXT = 'GOLIVE-CONFIRM-RESET'

  const handleReset = async () => {
    if (confirmationText !== REQUIRED_TEXT) {
      toast.error('Teks konfirmasi tidak sesuai!')
      return
    }

    if (!confirm('PERINGATAN: Tindakan ini tidak dapat dibatalkan. Seluruh data transaksi akan terhapus selamanya. Apakah Anda benar-benar yakin?')) {
      return
    }

    setIsDeleting(true)
    try {
      const { data } = await api.post('/system/reset-transactions', {
        confirmationText,
        clinicId: resetType === 'CLINIC' ? activeClinicId : null
      })
      toast.success(data.message)
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan reset system')
    } finally {
      setIsDeleting(false)
    }
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <FiShield className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Akses Dibatasi</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">Halaman ini hanya dapat diakses oleh Super Admin untuk tujuan inisialisasi system.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
          <FiTrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Go-Live Setup Tools</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Sistem Pembersihan Data Transaksi Sebelum Peluncuran Resmi</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Warning Box */}
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex items-start gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-500 flex-shrink-0">
                <FiAlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight leading-none">Peringatan Kritis!</h3>
                <p className="text-rose-700/70 text-sm leading-relaxed font-medium">
                  Fitur ini dirancang khusus untuk membersihkan data percobaan (dummy) hasil testing sebelum klinik resmi dibuka untuk publik. 
                  Semua transaksi keuangan, rekam medis, dan pendaftaran akan <strong>DIHAPUS SELAMANYA</strong>.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/50 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Data yang Dihapus:</p>
                    <ul className="text-[11px] font-bold text-rose-800 list-disc list-inside">
                      <li>Semua Invoice & Jurnal</li>
                      <li>Semua Antrean & Registrasi</li>
                      <li>Semua Rekam Medis & Resep</li>
                      <li>Semua Stok & Riwayat Mutasi</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Data yang Aman:</p>
                    <ul className="text-[11px] font-bold text-emerald-800 list-disc list-inside">
                      <li>Master Obat & Produk</li>
                      <li>Master Dokter & User</li>
                      <li>Master Cabang & Poli</li>
                      <li>Struktur Chart of Account</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Selection */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block">Pilih Lingkup Reset:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setResetType('CLINIC')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${resetType === 'CLINIC' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center">
                       <FiDatabase className={`w-5 h-5 ${resetType === 'CLINIC' ? 'text-indigo-600' : 'text-slate-400'}`} />
                       {resetType === 'CLINIC' && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />}
                    </div>
                    <div className="font-black text-slate-900 text-sm uppercase">Klinik Saat Ini</div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Hanya data transaksi di cabang ini yang akan dihapus.</p>
                  </button>
                  <button 
                    onClick={() => setResetType('ALL')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${resetType === 'ALL' ? 'border-rose-600 bg-rose-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center">
                       <FiSettings className={`w-5 h-5 ${resetType === 'ALL' ? 'text-rose-600' : 'text-slate-400'}`} />
                       {resetType === 'ALL' && <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />}
                    </div>
                    <div className="font-black text-slate-900 text-sm uppercase">Seluruh Cabang</div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">Hapus semua transaksi di seluruh database (Enterprise). Gunakan dengan sangat hati-hati!</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block">Konfirmasi Keamanan:</label>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-normal">Ketik kalimat <span className="text-rose-600 font-black">GOLIVE-CONFIRM-RESET</span> di bawah untuk melanjutkan:</p>
                <input 
                  type="text"
                  placeholder="Ketik di sini..."
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-rose-600 placeholder:text-slate-300"
                />
              </div>

              <button 
                disabled={confirmationText !== REQUIRED_TEXT || isDeleting}
                onClick={handleReset}
                className="w-full py-5 bg-rose-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MENGHAPUS DATA...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-5 h-5" /> EKSEKUSI RESET GO-LIVE
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 shadow-inner">
              <FiCheckCircle className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">SYSTEM BERHASIL DIRESET!</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">Seluruh data transaksi telah dibersihkan. Database Anda sekarang dalam keadaan bersih dan siap untuk operasional resmi.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/admin'}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Kembali ke Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Info */}
      <div className="text-center pt-10">
        <div className="inline-flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <FiShield className="w-3 h-3" /> SECURITY ENFORCED BY SUPER ADMIN ROLE
        </div>
      </div>
    </div>
  )
}
