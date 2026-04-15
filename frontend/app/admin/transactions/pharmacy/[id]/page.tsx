'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ArrowLeft, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PharmacyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [prescription, setPrescription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [counselingGiven, setCounselingGiven] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPrescription()
  }, [])

  const fetchPrescription = async () => {
    try {
      const res = await api.get(`/pharmacy/prescriptions/${resolvedParams.id}`)
      setPrescription(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gagal memuat resep')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    setIsSubmitting(true)
    setError('')
    try {
      if (status === 'dispensed' && !counselingGiven) {
        throw new Error('Harap konfirmasi bahwa edukasi obat telah diberikan kepada pasien.')
      }
      
      const payload: any = { status }
      if (status === 'dispensed') {
         payload.counselingGiven = true
      }

      await api.patch(`/pharmacy/prescriptions/${resolvedParams.id}/status`, payload)
      await fetchPrescription() // Refresh data
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Gagal mengubah status')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat detail resep...</div>
  if (!prescription) return <div className="p-8 text-center text-red-500">{error}</div>

  const isCompleted = prescription.dispenseStatus === 'dispensed'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button 
        onClick={() => router.push('/admin/transactions/pharmacy')}
        className="flex items-center text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Antrian
      </button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            Penyelesaian Obat 
            <span className={`ml-4 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {prescription.dispenseStatus}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">No Resep: {prescription.prescriptionNo}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded-lg mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1 shadow-sm border-gray-100">
          <CardHeader className="bg-gray-50 py-4 border-b border-gray-100">
            <CardTitle className="text-sm text-gray-600">Info Pasien</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="font-bold text-lg text-gray-800">{prescription.patient.name}</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{prescription.patient.medicalRecordNo}</p>
            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <p><span className="font-semibold w-20 inline-block">Kelamin:</span> {prescription.patient.gender === 'M' ? 'Laki-laki' : prescription.patient.gender === 'F' ? 'Perempuan' : '-'}</p>
              <p><span className="font-semibold w-20 inline-block">Dokter:</span> {prescription.doctor.name}</p>
              <p><span className="font-semibold w-20 inline-block">Waktu:</span> {new Date(prescription.prescriptionDate).toLocaleTimeString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-gray-100">
          <CardHeader className="bg-blue-50 py-4 border-b border-blue-100">
            <CardTitle className="text-sm text-blue-800 font-bold">Rincian Obat (Resep)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Nama Obat</th>
                    <th className="px-4 py-3 text-center">Jumlah</th>
                    <th className="px-4 py-3">Aturan Pakai</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {item.isRacikan ? (
                          <>
                            <div className="flex items-center">
                              <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase mr-2 tracking-wider border border-purple-200">
                                Racikan
                              </span>
                              <span>{item.racikanName || 'Obat Racik'}</span>
                            </div>
                            {item.components && item.components.length > 0 && (
                              <div className="mt-2 pl-2 border-l-2 border-purple-200 space-y-1 bg-purple-50/30 p-1.5 rounded pr-2">
                                {item.components.map((comp: any) => (
                                  <div key={comp.id} className="text-xs text-gray-500 flex items-start">
                                    <div className="w-1 h-1 bg-purple-300 rounded-full mr-2 mt-1.5 shrink-0"></div>
                                    <span className="w-8 font-medium text-purple-600 shrink-0">{comp.quantity}x</span> 
                                    <span className="leading-tight">{comp.medicine?.medicineName}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {item.medicine?.medicineName || 'Unknown Medicine'}
                            <div className="text-xs text-gray-400 font-normal mt-0.5">{item.medicine?.dosageForm} {item.medicine?.strength}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary bg-blue-50/30">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="font-medium">{item.frequency} - {item.dosage}</div>
                        {item.instructions && <div className="text-xs italic mt-1 text-gray-500">"{item.instructions}"</div>}
                        <div className="text-xs text-gray-400 mt-0.5">Selama {item.duration}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Area */}
      <motion.div 
         initial={{ y: 20, opacity: 0 }} 
         animate={{ y: 0, opacity: 1 }}
         className="bg-white border rounded-2xl shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-6">Tindakan Farmasi</h3>
        
        {isCompleted ? (
          <div className="flex items-center justify-center p-8 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="font-bold text-green-800 text-lg">Resep Selesai</p>
              <p className="text-green-600 text-sm">Obat telah diserahkan dan stok inventori otomatis terpotong.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Steps Workflow */}
            <div className="flex items-center gap-4">
              {prescription.dispenseStatus === 'pending' && (
                <button 
                  disabled={isSubmitting}
                  onClick={() => updateStatus('preparing')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  Mulai Siapkan Obat
                </button>
              )}

              {prescription.dispenseStatus === 'preparing' && (
                <button 
                  disabled={isSubmitting}
                  onClick={() => updateStatus('ready')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  Tandai Obat Siap
                </button>
              )}

              {prescription.dispenseStatus === 'ready' && (
                <div className="w-full bg-orange-50 p-6 rounded-xl border border-orange-200 border-dashed">
                  <div className="flex items-start mb-6">
                     <input 
                       type="checkbox" 
                       id="counseling" 
                       className="w-5 h-5 text-orange-600 rounded border-gray-300 mt-0.5 cursor-pointer"
                       checked={counselingGiven}
                       onChange={(e) => setCounselingGiven(e.target.checked)}
                     />
                     <label htmlFor="counseling" className="ml-3 cursor-pointer">
                       <span className="block font-bold text-gray-800">Ceklis Edukasi & Penyerahan</span>
                       <span className="text-sm text-gray-600">Saya telah menyerahkan obat kepada pasien dan memberikan edukasi konseling apoteker terkait indikasi, cara pakai, dan efek samping obat.</span>
                     </label>
                  </div>
                  
                  <button 
                    disabled={isSubmitting || !counselingGiven}
                    onClick={() => updateStatus('dispensed')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PackageCheck className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Memproses Potong Stok...' : 'Serahkan Obat & Potong Stok Master'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
