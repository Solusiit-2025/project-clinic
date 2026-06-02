'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { FiPlus, FiRotateCcw, FiX, FiSearch } from 'react-icons/fi'

export default function DeathsPage() {
  const [deaths, setDeaths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search patient states
  const [patients, setPatients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [icd10s, setIcd10s] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    patientId: '',
    dateOfDeath: '',
    deathPlace: '',
    deathCause: '',
    deathIcd10Id: ''
  })

  const fetchDeaths = async () => {
    try {
      const res = await api.get('/birth-death/deaths')
      setDeaths(res.data)
    } catch (e: any) {
      toast.error('Gagal memuat data kematian')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeaths()
    fetchIcd10s()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setPatients([])
        return
      }

      setSearching(true)
      try {
        const { data } = await api.get('/master/patients', { 
          params: { 
            search: searchQuery,
            page: 1,
            limit: 20
          } 
        })
        const patientsArray = data.meta ? data.data : (Array.isArray(data) ? data : [])
        // Filter out those who are already deceased
        setPatients(patientsArray.filter((p: any) => !p.isDeceased))
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const fetchIcd10s = async () => {
    try {
      const res = await api.get('/master/icd10?limit=2000') // Simplification for demo
      setIcd10s(res.data.data || res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !formData.dateOfDeath) {
      return toast.error('Pasien dan Tanggal Wafat wajib diisi!')
    }

    try {
      setSubmitting(true)
      await api.post(`/birth-death/deaths/${selectedPatient.id}/mark`, formData)
      toast.success('Status kematian berhasil dicatat!')
      setShowModal(false)
      fetchDeaths()
      setFormData({
        patientId: '', dateOfDeath: '', deathPlace: '', deathCause: '', deathIcd10Id: ''
      })
      setSelectedPatient(null)
      setSearchQuery('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnmark = async (id: string) => {
    if (!confirm('Yakin ingin membatalkan status kematian pasien ini?')) return
    try {
      await api.post(`/birth-death/deaths/${id}/unmark`)
      toast.success('Status kematian dibatalkan')
      fetchDeaths()
    } catch (e: any) {
      toast.error('Gagal membatalkan')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pencatatan Kematian Pasien</h1>
          <p className="text-sm text-gray-500">Daftar pasien yang tercatat meninggal dunia di klinik</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-red-700">
          <FiPlus /> Lapor Kematian
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nama Pasien</th>
              <th className="p-4 font-semibold text-gray-600">No. RM</th>
              <th className="p-4 font-semibold text-gray-600">Tanggal Wafat</th>
              <th className="p-4 font-semibold text-gray-600">Sebab Dasar</th>
              <th className="p-4 font-semibold text-gray-600">ICD-10</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat...</td></tr>
            ) : deaths.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Tidak ada data kematian.</td></tr>
            ) : (
              deaths.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4">{d.medicalRecordNo}</td>
                  <td className="p-4">{d.dateOfDeath ? new Date(d.dateOfDeath).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="p-4">{d.deathCause || '-'}</td>
                  <td className="p-4">{d.deathIcd10?.code || '-'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleUnmark(d.id)} className="text-xs p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1 ml-auto">
                      <FiRotateCcw /> Batalkan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal Lapor Kematian */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
              <h2 className="text-xl font-bold text-red-900">Form Laporan Kematian Pasien</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="deathForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pasien *</label>
                  {!selectedPatient ? (
                    <div>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Ketik min. 3 huruf nama/RM..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowDropdown(true)
                          }}
                          onFocus={() => setShowDropdown(true)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                      </div>
                      
                      {showDropdown && patients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {patients.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                setSelectedPatient(p)
                                setShowDropdown(false)
                                setSearchQuery('')
                              }}
                              className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0"
                            >
                              <p className="font-bold text-sm text-gray-900">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 rounded-full">{p.medicalRecordNo}</span>
                                <span className="text-[10px] text-gray-500">{p.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border border-primary/20 bg-primary/5 rounded-lg">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{selectedPatient.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedPatient.medicalRecordNo}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs text-red-500 hover:underline">
                        Ganti Pasien
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Jam Wafat *</label>
                    <input type="datetime-local" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.dateOfDeath} onChange={e => setFormData({...formData, dateOfDeath: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Wafat</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.deathPlace} onChange={e => setFormData({...formData, deathPlace: e.target.value})} placeholder="Klinik, Rumah, RS Rujukan..." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penyebab Kematian (Deskriptif)</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded-lg" rows={3} value={formData.deathCause} onChange={e => setFormData({...formData, deathCause: e.target.value})} placeholder="Penjelasan penyebab kematian..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sebab Dasar Kematian (ICD-10)</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={formData.deathIcd10Id}
                    onChange={e => setFormData({...formData, deathIcd10Id: e.target.value})}
                  >
                    <option value="">-- Tidak Diisi --</option>
                    {icd10s.map(i => (
                      <option key={i.id} value={i.id}>{i.code} - {i.nameId || i.nameEn}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Digunakan untuk keperluan laporan Dinkes (LBK)</p>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                Batal
              </button>
              <button type="submit" form="deathForm" disabled={submitting} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Kematian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

