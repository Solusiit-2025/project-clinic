'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiDatabase, FiDownload, FiUpload, FiHardDrive, 
  FiAlertTriangle, FiCheckCircle, FiClock, FiFileText,
  FiInfo, FiChevronRight, FiSettings, FiShield, FiCpu, FiActivity
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast, { Toaster } from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('database')
  const [backups, setBackups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const res = await api.get('/api/backup/list')
      setBackups(res.data)
    } catch (error) {
      console.error('Failed to fetch backups', error)
    }
  }

  const handleDownloadBackup = async () => {
    setIsLoading(true)
    const toastId = toast.loading('Memproses backup database...')
    try {
      const response = await api.get('/api/backup/download', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const fileName = `backup-${new Date().toISOString().split('T')[0]}.sql`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Backup berhasil diunduh', { id: toastId })
      fetchBackups()
    } catch (error) {
      toast.error('Gagal membuat backup', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.sql')) {
        setSelectedFile(file)
        setShowRestoreConfirm(true)
      } else {
        toast.error('Hanya file .sql yang diizinkan')
      }
    }
  }

  const handleRestore = async () => {
    if (!selectedFile) return
    
    setIsRestoring(true)
    setShowRestoreConfirm(false)
    const toastId = toast.loading('Sedang merestore database... Jangan tutup halaman ini.')
    
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      await api.post('/api/backup/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('Database berhasil direstore!', { id: toastId, duration: 5000 })
      setSelectedFile(null)
    } catch (error) {
      toast.error('Gagal merestore database. Pastikan format file benar.', { id: toastId })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" />
      
      {/* Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FiSettings className="w-8 h-8 text-primary" />
              </div>
              System <span className="text-primary">Settings</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Konfigurasi sistem, backup data, dan manajemen infrastruktur.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <span className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400">Environment:</span>
            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Production Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <aside className="xl:col-span-3 space-y-2">
            {[
              { id: 'database', label: 'Database & Backup', icon: FiDatabase },
              { id: 'security', label: 'Security & Access', icon: FiShield },
              { id: 'system', label: 'System Info', icon: FiCpu },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-transparent shadow-sm'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}

            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-primary rounded-3xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Status Sistem</p>
                <h3 className="text-lg font-bold mb-3">Semua Sistem Normal</h3>
                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                   Terakhir Sinkron: Just now
                </div>
              </div>
              <FiActivity className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </aside>

          {/* Content Area */}
          <main className="xl:col-span-9 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'database' && (
                <motion.div
                  key="database"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Backup Action Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                          <FiDownload className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Backup Database</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                          Ekspor salinan lengkap basis data saat ini ke dalam format .sql untuk pengarsipan.
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadBackup}
                        disabled={isLoading}
                        className="mt-8 group relative overflow-hidden px-8 py-4 bg-gray-900 text-white rounded-2xl font-black transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          {isLoading ? 'Memproses...' : (
                            <>
                              Unduh Backup Sekarang <FiDownload />
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>

                    {/* Restore Action Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                          <FiUpload className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Restore Database</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                          Pulihkan data dari file .sql. <span className="text-red-500 font-bold underline">Peringatan:</span> Tindakan ini akan menimpa data saat ini.
                        </p>
                      </div>
                      <label className="mt-8 cursor-pointer group relative overflow-hidden px-8 py-4 bg-white text-red-600 border-2 border-red-100 rounded-2xl font-black transition-all hover:bg-red-50 hover:border-red-200 active:scale-95 flex items-center justify-center gap-3">
                        <input type="file" className="hidden" accept=".sql" onChange={handleFileChange} disabled={isRestoring} />
                        {isRestoring ? 'Sedang Memulihkan...' : (
                          <>
                            Unggah & Pulihkan <FiUpload />
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* History Section */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Riwayat Backup</h3>
                        <p className="text-sm font-medium text-gray-400">Daftar file backup yang tersimpan di server.</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                        <FiClock /> {backups.length} Files Tersimpan
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">File Name</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Size</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date Created</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {backups.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium">
                                Belum ada riwayat backup yang tersedia.
                              </td>
                            </tr>
                          ) : backups.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <FiFileText className="w-5 h-5" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">{item.filename}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{formatSize(item.size)}</span>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-xs font-medium text-gray-400 italic">
                                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                                  <FiCheckCircle className="w-3 h-3" /> Ready
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center"
                >
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <FiShield className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Security Policies</h2>
                  <p className="max-w-md mx-auto text-gray-500 font-medium leading-relaxed mb-8">
                    Halaman ini dikhususkan untuk konfigurasi keamanan tingkat lanjut dan kontrol akses API.
                  </p>
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-gray-400 italic border border-gray-100">
                    <FiInfo className="w-4 h-4 text-primary" /> Segera Hadir di Versi Berikutnya
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                      <FiCpu className="text-primary" /> Server Architecture
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { label: 'OS Version', value: 'Ubuntu 22.04 LTS', sub: 'Linux Kernel 5.15' },
                        { label: 'Runtime', value: 'Node.js v20.10.x', sub: 'Express v4.18' },
                        { label: 'Database', value: 'PostgreSQL 17.4', sub: 'Managed via Prisma ORM' },
                      ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                          <p className="text-lg font-black text-gray-900">{stat.value}</p>
                          <p className="text-xs font-bold text-gray-400 mt-1">{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex-shrink-0 flex items-center justify-center">
                             <FiHardDrive className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="font-black text-gray-900">Disk Usage</p>
                             <div className="w-48 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-primary w-1/4 rounded-full" />
                             </div>
                             <p className="text-xs font-bold text-gray-400 mt-2">24.5 GB of 100 GB used</p>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex-shrink-0 flex items-center justify-center">
                             <FiActivity className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="font-black text-gray-900">Health Check</p>
                             <div className="flex items-center gap-2 mt-2">
                                <span className="text-green-500 font-black text-sm uppercase tracking-widest">Stable</span>
                                <div className="flex gap-0.5">
                                   {[1,2,3,4,5].map(j => <div key={j} className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${j*0.2}s` }} />)}
                                </div>
                             </div>
                             <p className="text-xs font-bold text-gray-400 mt-1">Uptime: 14 days, 6 hours</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {showRestoreConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !isRestoring && setShowRestoreConfirm(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <FiAlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Peringatan Kritis!</h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-6">
                  Anda akan merestore database menggunakan file <span className="font-black text-gray-900">"{selectedFile?.name}"</span>. 
                  Semua data saat ini di server akan <span className="text-red-600 font-black underline">dihapus seluruhnya</span> dan diganti dengan isi file tersebut.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => !isRestoring && setShowRestoreConfirm(false)}
                    disabled={isRestoring}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Ya, Restore Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
