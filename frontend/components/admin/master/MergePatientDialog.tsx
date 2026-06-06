import React, { useState, useEffect } from 'react'
import { FiGitMerge, FiAlertTriangle, FiCheckCircle, FiSearch, FiArrowRight, FiUser, FiFileText } from 'react-icons/fi'
import MasterModal from './MasterModal'
import api from '@/lib/api'

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  oldMedicalRecordNo?: string
  identityNumber?: string
  phone?: string
  address?: string
}

interface MergePatientDialogProps {
  isOpen: boolean
  onClose: () => void
  targetPatient: Patient | null // The patient to KEEP
  onSuccess: () => void
}

export default function MergePatientDialog({ isOpen, onClose, targetPatient, onSuccess }: MergePatientDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)
  
  const [sourcePatient, setSourcePatient] = useState<Patient | null>(null) // The patient to REMOVE/MERGE FROM
  
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  
  const [merging, setMerging] = useState(false)

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSearch('')
      setSearchResults([])
      setSourcePatient(null)
      setPreviewData(null)
      setPreviewError('')
    }
  }, [isOpen])

  // Search source patients (excluding target)
  useEffect(() => {
    const handleSearch = async () => {
      if (!search || search.length < 3) {
        setSearchResults([])
        return
      }
      
      setSearching(true)
      try {
        const res = await api.get('/master/patients', { params: { search, limit: 10, page: 1 } })
        const data = res.data.data || res.data
        // Filter out target patient and already merged ones
        const filtered = data.filter((p: Patient) => 
          p.id !== targetPatient?.id && 
          !p.name.includes('[MERGED]')
        )
        setSearchResults(filtered)
      } catch (error) {
        console.error('Failed to search patients', error)
      } finally {
        setSearching(false)
      }
    }

    const timeout = setTimeout(handleSearch, 500)
    return () => clearTimeout(timeout)
  }, [search, targetPatient?.id])

  const handleSelectSource = (patient: Patient) => {
    setSourcePatient(patient)
    setStep(2)
    fetchPreview(patient.id, targetPatient?.id as string)
  }

  const fetchPreview = async (sourceId: string, targetId: string) => {
    setStep(3)
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await api.get('/master/patients/merge-preview', {
        params: { sourceId, targetId }
      })
      setPreviewData(res.data)
    } catch (e: any) {
      setPreviewError(e.response?.data?.message || 'Gagal memuat preview data')
      setStep(2)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleMerge = async () => {
    if (!sourcePatient || !targetPatient) return
    
    // Additional confirmation
    if (!confirm(`TINDAKAN INI TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin menggabungkan SEMUA data dari "${sourcePatient.name}" ke "${targetPatient.name}"?`)) {
      return
    }

    setMerging(true)
    try {
      await api.post('/master/patients/merge', {
        sourceId: sourcePatient.id,
        targetId: targetPatient.id
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal menggabungkan pasien')
    } finally {
      setMerging(false)
    }
  }

  if (!isOpen || !targetPatient) return null

  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gabungkan Pasien Duplikat"
      subtitle="Pindahkan seluruh riwayat kunjungan, medis, dan transaksi dari pasien duplikat ke pasien utama."
      size="2xl"
    >
      <div className="py-2">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <span className="text-xs font-semibold text-slate-500">Pasien Utama</span>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-100'}`} />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <span className="text-xs font-semibold text-slate-500">Pilih Duplikat</span>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-100'}`} />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
            <span className="text-xs font-semibold text-slate-500">Konfirmasi</span>
          </div>
        </div>

        {/* STEP 1 & 2: Select Source */}
        {step < 3 && (
          <div className="space-y-6">
            {/* Target Display */}
            <div className="p-4 border-2 border-emerald-100 bg-emerald-50/30 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Pasien Utama (Dipertahankan)
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-900">{targetPatient.name}</h4>
                  <p className="text-sm font-medium text-emerald-600/80 font-mono mt-0.5">{targetPatient.medicalRecordNo}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 -my-4">
                <FiArrowRight className="w-4 h-4 transform rotate-90" />
              </div>
            </div>

            {/* Source Selection */}
            <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FiSearch className="w-5 h-5 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-700">Cari Pasien Duplikat (Source)</h4>
              </div>
              
              <input
                type="text"
                placeholder="Ketik nama atau No. RM pasien yang ingin digabungkan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />

              <div className="max-h-60 overflow-y-auto space-y-2">
                {searching && <p className="text-center text-xs text-slate-500 py-4 animate-pulse">Mencari pasien...</p>}
                {!searching && search.length > 0 && searchResults.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-4">Tidak ada pasien ditemukan (selain pasien utama)</p>
                )}
                {!searching && searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSource(p)}
                    className="w-full text-left p-3 border border-slate-100 hover:border-primary/30 hover:bg-primary/5 rounded-lg transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-slate-500">{p.medicalRecordNo}</span>
                        {p.phone && <span className="text-[10px] text-slate-400">{p.phone}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Pilih <FiArrowRight />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Confirm */}
        {step === 3 && sourcePatient && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Visual Merge Representation */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1 p-3 bg-rose-50 border border-rose-100 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl uppercase">Akan Dinonaktifkan</div>
                <p className="font-bold text-rose-900 text-sm truncate pr-20">{sourcePatient.name}</p>
                <p className="text-xs font-mono text-rose-600/80 mt-1">{sourcePatient.medicalRecordNo}</p>
              </div>
              
              <FiArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
              
              <div className="flex-1 p-3 bg-emerald-50 border border-emerald-100 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl uppercase">Dipertahankan</div>
                <p className="font-bold text-emerald-900 text-sm truncate pr-20">{targetPatient.name}</p>
                <p className="text-xs font-mono text-emerald-600/80 mt-1">{targetPatient.medicalRecordNo}</p>
              </div>
            </div>

            {/* Preview Loading/Error */}
            {previewLoading && (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Menghitung data yang akan dipindahkan...</p>
              </div>
            )}
            
            {previewError && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2">
                <FiAlertTriangle className="w-5 h-5 shrink-0" />
                <p>{previewError}</p>
              </div>
            )}

            {/* Preview Data */}
            {!previewLoading && !previewError && previewData && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  Data yang akan dipindahkan ke pasien utama:
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard label="Pendaftaran / Antrian" count={previewData.counts.registrations} />
                  <StatCard label="Rekam Medis" count={previewData.counts.medicalRecords} />
                  <StatCard label="Invoice Tagihan" count={previewData.counts.invoices} />
                  <StatCard label="Resep Obat" count={previewData.counts.prescriptions} />
                  <StatCard label="Order Laboratorium" count={previewData.counts.labOrders} />
                </div>

                {previewData.paidInvoices > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-sm text-amber-800">
                    <FiAlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-bold mb-1">Terdapat {previewData.paidInvoices} Invoice Lunas</p>
                      <p className="text-xs opacity-90 leading-relaxed">
                        Invoice yang sudah lunas akan tetap dipindahkan kepemilikannya ke pasien utama tanpa mengubah data jurnal/keuangan yang sudah tercatat.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-800">
                  <FiInfo className="w-5 h-5 shrink-0 text-blue-500" />
                  <p className="text-xs leading-relaxed">
                    Setelah proses selesai, profil <span className="font-bold">"{sourcePatient.name}"</span> akan dinonaktifkan (arsip) dan tidak bisa digunakan lagi untuk pendaftaran baru. Nomor RM lamanya akan disimpan.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          {step === 3 && (
            <button
              onClick={() => setStep(2)}
              disabled={merging}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mr-auto"
            >
              Kembali
            </button>
          )}
          
          <button
            onClick={onClose}
            disabled={merging}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Batal
          </button>
          
          {step === 3 && !previewLoading && !previewError && (
            <button
              onClick={handleMerge}
              disabled={merging}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {merging ? 'Menggabungkan...' : 'Ya, Gabungkan Data!'}
            </button>
          )}
        </div>
      </div>
    </MasterModal>
  )
}

function StatCard({ label, count }: { label: string, count: number }) {
  return (
    <div className={`p-3 rounded-lg border ${count > 0 ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'} flex flex-col`}>
      <span className="text-2xl font-black text-slate-700">{count}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 leading-tight">{label}</span>
    </div>
  )
}

function FiInfo(props: any) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}
