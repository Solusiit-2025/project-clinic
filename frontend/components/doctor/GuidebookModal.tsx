'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { FiX, FiBookOpen, FiFileText, FiInfo, FiActivity, FiTruck, FiCheckCircle } from 'react-icons/fi'

interface GuidebookModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GuidebookModal({ isOpen, onClose }: GuidebookModalProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen) return null

  return (
    <>
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              {/* Overlay Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              />
              
              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col border border-slate-100"
              >
                {/* Header dengan Gradien Elegan */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500 px-8 py-10 shrink-0">
                  {/* Decorative blur elements */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-3xl rounded-full pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/20 blur-3xl rounded-full pointer-events-none" />
                  
                  <button onClick={onClose} className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors z-10">
                    <FiX className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                      <FiBookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Buku Panduan Klinik</h2>
                      <p className="text-blue-100 font-medium mt-1">Standar Operasional (SOP) Sistem Rangkaian & SPK</p>
                    </div>
                  </div>
                </div>

                {/* Konten Scrollable */}
                <div className="p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
                  
                  {/* Seksi 1: SPK Lab Eksternal */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                      <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
                        <FiFileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Ketentuan Surat Perintah Kerja (SPK)</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="mt-1"><FiInfo className="w-4 h-4 text-blue-500" /></div>
                        <div>
                          <strong className="text-slate-800 text-sm block mb-1">Lebih dari 1 SPK untuk 1 Pasien</strong>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Secara sistem, 1 pasien atau 1 Rangkaian Perawatan dapat memiliki banyak SPK. Hal ini lazim jika pasien melakukan pemesanan berbeda lab, atau pemesanan bertahap (misal: Coping lalu Build-up), atau untuk gigi dengan instruksi yang berbeda jauh.
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1"><FiInfo className="w-4 h-4 text-orange-500" /></div>
                        <div>
                          <strong className="text-slate-800 text-sm block mb-1">Status DRAFT & Wajib DP</strong>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            SPK yang baru dibuat akan berstatus <strong>DRAFT</strong>. SPK ini hanya akan aktif dan diproses jika pasien sudah membayar DP. Sistem tidak mengizinkan pembaruan status sebelum DP dilunaskan ke kasir.
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1"><FiInfo className="w-4 h-4 text-emerald-500" /></div>
                        <div>
                          <strong className="text-slate-800 text-sm block mb-1">Alur Perubahan Status (Workflow)</strong>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Dokter dan staf dapat mengubah status SPK melalui pintasan *dropdown* atau halaman Monitoring:
                            <br/><span className="inline-block mt-2 font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Draft → Menunggu DP → Di Lab → Diterima → Dipasang</span>
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Seksi 2: Tahapan Kunjungan */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <FiActivity className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Ketentuan Tahapan Perawatan (Visit)</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="mt-1"><FiCheckCircle className="w-4 h-4 text-emerald-500" /></div>
                        <div>
                          <strong className="text-slate-800 text-sm block mb-1">Tombol Aksi "Mulai" dan "Selesai"</strong>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Tombol pintar di halaman utama disediakan agar dokter tidak perlu membuka "View Detail" hanya untuk merubah status kunjungan. Selalu tekan "Selesai" setelah pasien turun dari kursi agar kasir mengetahui tindakan hari ini telah beres.
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1"><FiTruck className="w-4 h-4 text-blue-500" /></div>
                        <div>
                          <strong className="text-slate-800 text-sm block mb-1">Integrasi SPK ke Rangkaian</strong>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Seluruh biaya SPK yang di-input (misal: Biaya Lab External) disarankan dimasukkan sebagai tindakan juga di dalam "Kunjungan" agar total estimasi tagihan sesuai dan terekap sempurna di faktur (Invoice) pasien.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Seksi Info */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Buku Panduan ini akan terus diperbarui secara berkala menyesuaikan pembaruan fitur (Update) sistem klinik. Baca dengan seksama sebelum melakukan tindakan medis atau administrasi di sistem.
                    </p>
                  </div>
                  
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
