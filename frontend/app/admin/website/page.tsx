'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { FiSave, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiUpload, FiPlus, FiTrash2 } from 'react-icons/fi'
import api from '@/lib/api'

export default function WebsiteManagementPage() {
  const { settings, updateSetting, fetchSettings, isLoading } = useSettingsStore()
  const [activeTab, setActiveTab] = useState('hero')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  if (!formData) return <div className="p-8">Loading settings...</div>

  const handleSave = async (key: string) => {
    setSaveStatus('saving')
    try {
      await updateSetting(key, formData[key])
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string, isList: boolean = false, index: number = 0) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('settings/upload-image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = response.data.url;

      if (isList) {
        updateListField(section, index, field, imageUrl);
      } else {
        updateFormData(section, field, imageUrl);
      }
    } catch (error) {
      console.error('Failed to upload image', error);
      alert('Gagal mengunggah gambar. Pastikan format didukung dan ukuran tidak melebihi batas.');
    }
  }

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const updateListField = (section: string, index: number, field: string, value: any) => {
    const list = [...formData[section]]
    list[index] = { ...list[index], [field]: value }
    setFormData((prev: any) => ({
      ...prev,
      [section]: list
    }))
  }

  const addListItem = (section: string, defaultItem: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: [...(prev[section] || []), defaultItem]
    }))
  }

  const removeListItem = (section: string, index: number) => {
    const list = [...formData[section]]
    list.splice(index, 1)
    setFormData((prev: any) => ({
      ...prev,
      [section]: list
    }))
  }

  return (
    <div className="space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Website <span className="text-primary">Management</span></h1>
          <p className="text-gray-500 font-medium">Control your clinic's landing page content in real-time.</p>
        </div>
        <button 
          onClick={() => fetchSettings()}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
        {/* Sidebar Tabs */}
        <aside className="xl:col-span-1 bg-white p-4 rounded-3xl border border-gray-50 shadow-sm space-y-2">
            {[
              { id: 'hero', label: 'Hero Section' },
              { id: 'features', label: 'Fitur Unggulan' },
              { id: 'about', label: 'Tentang Kami' },
              { id: 'services', label: 'Layanan Medis' },
              { id: 'facilities', label: 'Fasilitas' },
              { id: 'faq', label: 'Tanya Jawab (FAQ)' },
              { id: 'contact', label: 'Kontak & Jam Buka' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Form Area */}
          <main className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Hero Content</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Title</label>
                      <input 
                        type="text" 
                        value={formData.hero.preTitle}
                        onChange={(e) => updateFormData('hero', 'preTitle', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
                      <input 
                        type="text" 
                        value={formData.hero.title}
                        onChange={(e) => updateFormData('hero', 'title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highlight (Warna)</label>
                      <input 
                        type="text" 
                        value={formData.hero.highlight}
                        onChange={(e) => updateFormData('hero', 'highlight', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                      <textarea 
                        rows={4}
                        value={formData.hero.description}
                        onChange={(e) => updateFormData('hero', 'description', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Hero</label>
                      <div className="flex items-center gap-4">
                        {formData.hero.image && (
                          <img src={formData.hero.image.startsWith('http') ? formData.hero.image : `http://localhost:3000${formData.hero.image}`} alt="Hero" className="h-20 w-32 object-cover rounded-lg border" onError={(e: any) => { e.target.src = formData.hero.image }} />
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg cursor-pointer transition-colors">
                          <FiUpload />
                          <span>Pilih Gambar</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'hero', 'image')}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSave('hero')}
                    disabled={saveStatus === 'saving'}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {saveStatus === 'saving' ? 'Menyimpan...' : (
                      <>
                        <FiSave /> Simpan Perubahan Hero
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Fitur Unggulan</h2>
                  {formData.features.map((feature: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ikon (heart, award, clock, etc)</label>
                          <input 
                            type="text" 
                            value={feature.icon}
                            onChange={(e) => updateListField('features', idx, 'icon', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                          <input 
                            type="text" 
                            value={feature.title}
                            onChange={(e) => updateListField('features', idx, 'title', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <input 
                          type="text" 
                          value={feature.description}
                          onChange={(e) => updateListField('features', idx, 'description', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleSave('features')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <FiSave /> Simpan Daftar Fitur
                  </button>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Tentang Kami</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                      <input 
                        type="text" 
                        value={formData.about?.title || ''}
                        onChange={(e) => updateFormData('about', 'title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Utama</label>
                      <textarea 
                        rows={4}
                        value={formData.about?.description || ''}
                        onChange={(e) => updateFormData('about', 'description', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Visi</label>
                        <textarea 
                          rows={3}
                          value={formData.about?.vision || ''}
                          onChange={(e) => updateFormData('about', 'vision', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Misi</label>
                        <textarea 
                          rows={3}
                          value={formData.about?.mission || ''}
                          onChange={(e) => updateFormData('about', 'mission', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Utama</label>
                      <div className="flex items-center gap-4">
                        {formData.about?.image && (
                          <img src={`http://localhost:3000${formData.about.image}`} alt="About" className="h-20 w-32 object-cover rounded-lg border" onError={(e: any) => { e.target.src = formData.about.image }} />
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg cursor-pointer transition-colors">
                          <FiUpload />
                          <span>Pilih Gambar</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'about', 'image')}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSave('about')}
                    disabled={saveStatus === 'saving'}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {saveStatus === 'saving' ? 'Menyimpan...' : (
                      <>
                        <FiSave /> Simpan Perubahan Tentang Kami
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Layanan Medis</h2>
                  {formData.services.map((service: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Layanan</label>
                          <input 
                            type="text" 
                            value={service.title}
                            onChange={(e) => updateListField('services', idx, 'title', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warna (Gradient)</label>
                          <input 
                            type="text" 
                            value={service.gradient}
                            onChange={(e) => updateListField('services', idx, 'gradient', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <textarea 
                          rows={2}
                          value={service.description}
                          onChange={(e) => updateListField('services', idx, 'description', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleSave('services')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <FiSave /> Simpan Daftar Layanan
                  </button>
                </div>
              )}

              {activeTab === 'facilities' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h2 className="text-xl font-bold">Daftar Fasilitas</h2>
                    <button 
                      onClick={() => addListItem('facilities', { title: 'Fasilitas Baru', description: 'Deskripsi...', image: '' })}
                      className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-lg flex items-center gap-1 hover:bg-green-100 transition-colors"
                    >
                      <FiPlus /> Tambah
                    </button>
                  </div>
                  {formData.facilities?.map((facility: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-4 relative group">
                      <button 
                        onClick={() => removeListItem('facilities', idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                        title="Hapus"
                      >
                        <FiTrash2 />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Fasilitas</label>
                            <input 
                              type="text" 
                              value={facility.title || ''}
                              onChange={(e) => updateListField('facilities', idx, 'title', e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                            <textarea 
                              rows={3}
                              value={facility.description || ''}
                              onChange={(e) => updateListField('facilities', idx, 'description', e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Fasilitas</label>
                          <div className="space-y-3">
                            {facility.image ? (
                              <img src={facility.image.startsWith('http') ? facility.image : `http://localhost:3000${facility.image}`} alt="Facility" className="w-full h-32 object-cover rounded-lg border bg-gray-200" />
                            ) : (
                              <div className="w-full h-32 border-2 border-dashed rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">Belum ada gambar</div>
                            )}
                            <label className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg cursor-pointer transition-colors shadow-sm">
                              <FiUpload className="text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Unggah Gambar</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'facilities', 'image', true, idx)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleSave('facilities')}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                  >
                    <FiSave /> Simpan Daftar Fasilitas
                  </button>
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h2 className="text-xl font-bold">Tanya Jawab (FAQ)</h2>
                    <button 
                      onClick={() => addListItem('faq', { question: 'Pertanyaan Baru?', answer: 'Jawaban...' })}
                      className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-lg flex items-center gap-1 hover:bg-green-100 transition-colors"
                    >
                      <FiPlus /> Tambah
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.faq?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg bg-white space-y-4 relative group">
                        <button 
                          onClick={() => removeListItem('faq', idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                          title="Hapus"
                        >
                          <FiTrash2 />
                        </button>
                        
                        <div className="pr-8">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                          <input 
                            type="text" 
                            value={item.question || ''}
                            onChange={(e) => updateListField('faq', idx, 'question', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban</label>
                          <textarea 
                            rows={3}
                            value={item.answer || ''}
                            onChange={(e) => updateListField('faq', idx, 'answer', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleSave('faq')}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                  >
                    <FiSave /> Simpan FAQ
                  </button>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Kontak & Informasi</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                      <input 
                        type="text" 
                        value={formData.contact.phone}
                        onChange={(e) => updateFormData('contact', 'phone', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={formData.contact.email}
                        onChange={(e) => updateFormData('contact', 'email', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                      <input 
                        type="text" 
                        value={formData.contact.address}
                        onChange={(e) => updateFormData('contact', 'address', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
                      <input 
                        type="text" 
                        value={formData.contact.hours}
                        onChange={(e) => updateFormData('contact', 'hours', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSave('contact')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <FiSave /> Simpan Informasi Kontak
                  </button>
                </div>
              )}
            </div>

            {/* Status Feedback */}
            {saveStatus !== 'idle' && (
              <div className={`p-4 text-center font-medium ${
                saveStatus === 'success' ? 'bg-green-100 text-green-700' : 
                saveStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {saveStatus === 'saving' && 'Sedang menyimpan perubahan...'}
                {saveStatus === 'success' && (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheckCircle /> Perubahan berhasil disimpan!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center justify-center gap-2">
                    <FiAlertCircle /> Terjadi kesalahan saat menyimpan.
                  </span>
                )}
              </div>
            )}
          </main>
        </div>
    </div>
  )
}
