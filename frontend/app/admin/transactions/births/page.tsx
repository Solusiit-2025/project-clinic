'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { FiPlus, FiTrash2, FiX, FiSearch } from 'react-icons/fi'

export default function BirthsPage() {
  const [births, setBirths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search patient states
  const [patients, setPatients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    patientId: '',
    babyName: '',
    gender: 'L',
    birthDate: '',
    gestationalAge: '',
    weight: '',
    length: '',
    isNormalBirth: true,
    imd: false,
    notes: ''
  })

  const fetchBirths = async () => {
    try {
      const res = await api.get('/birth-death/births')
      setBirths(res.data)
    } catch (e: any) {
      toast.error('Gagal memuat data persalinan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBirths()
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
        setPatients(patientsArray.filter((p: any) => p.gender !== 'M')) // Only females/mothers
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !formData.birthDate) {
      return toast.error('Ibu pasien dan Tanggal Lahir wajib diisi!')
    }

    try {
      setSubmitting(true)
      await api.post('/birth-death/births', {
        ...formData,
        patientId: selectedPatient.id
      })
      toast.success('Data kelahiran berhasil disimpan!')
      setShowModal(false)
      fetchBirths()
      setFormData({
        patientId: '', babyName: '', gender: 'L', birthDate: '', 
        gestationalAge: '', weight: '', length: '', isNormalBirth: true, imd: false, notes: ''
      })
      setSelectedPatient(null)
      setSearchQuery('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data kelahiran ini?')) return
    try {
      await api.delete(`/birth-death/births/${id}`)
      toast.success('Berhasil dihapus')
      fetchBirths()
    } catch (e: any) {
      toast.error('Gagal menghapus')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Persalinan / Kelahiran</h1>
          <p className="text-sm text-gray-500">Catat dan kelola data kelahiran bayi di klinik</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90">
          <FiPlus /> Tambah Kelahiran
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nama Bayi</th>
              <th className="p-4 font-semibold text-gray-600">L/P</th>
              <th className="p-4 font-semibold text-gray-600">Ibu (Pasien)</th>
              <th className="p-4 font-semibold text-gray-600">Tanggal Lahir</th>
              <th className="p-4 font-semibold text-gray-600">BB/TB</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat...</td></tr>
            ) : births.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada data kelahiran.</td></tr>
            ) : (
              births.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{b.babyName || 'Belum Diberi Nama'}</td>
                  <td className="p-4">{b.gender}</td>
                  <td className="p-4">{b.patient?.name}</td>
                  <td className="p-4">{new Date(b.birthDate).toLocaleDateString('id-ID')}</td>
                  <td className="p-4">{b.weight}g / {b.length}cm</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal Tambah Kelahiran */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Data Kelahiran</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="birthForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ibu (Pasien) *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bayi</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.babyName} onChange={e => setFormData({...formData, babyName: e.target.value})} placeholder="Opsional jika belum ada nama" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Jam Lahir *</label>
                    <input type="datetime-local" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Umur Kehamilan (Minggu)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.gestationalAge} onChange={e => setFormData({...formData, gestationalAge: e.target.value})} placeholder="Contoh: 38" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Berat Badan (gram)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="Contoh: 3200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Panjang Badan (cm)</label>
                    <input type="number" step="0.1" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} placeholder="Contoh: 50.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Kelahiran</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg" value={formData.isNormalBirth ? 'true' : 'false'} onChange={e => setFormData({...formData, isNormalBirth: e.target.value === 'true'})}>
                      <option value="true">Normal</option>
                      <option value="false">Dirujuk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMD (Inisiasi Menyusu Dini)</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg" value={formData.imd ? 'true' : 'false'} onChange={e => setFormData({...formData, imd: e.target.value === 'true'})}>
                      <option value="true">Ya</option>
                      <option value="false">Tidak</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                Batal
              </button>
              <button type="submit" form="birthForm" disabled={submitting} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
