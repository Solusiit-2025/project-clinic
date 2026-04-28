'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiShield, FiCheck, FiX, FiRefreshCcw } from 'react-icons/fi'
import api from '@/lib/api'
import { extractUniqueModules, ALL_MENU_GROUPS } from '@/lib/menuConfig'

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DOCTOR',
  'RECEPTIONIST',
  'FARMASI',
  'ACCOUNTING',
  'LOGISTIC',
  'STAFF'
]

// Fetch descriptive name for module from Sidebar mapping
const getModuleName = (moduleId: string) => {
  for (const section of ALL_MENU_GROUPS) {
    for (const group of section.groups) {
      if (group.moduleId === moduleId) return group.label
    }
  }
  return moduleId
}

export default function RolePermissionsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<any[]>([])
  const [modules, setModules] = useState<string[]>([])

  useEffect(() => {
    // Dynamically get available modules from menuConfig
    const uniqueModules = extractUniqueModules()
    setModules(uniqueModules)
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/system/roles/permissions')
      setPermissions(res.data || [])
    } catch (error) {
      console.error('Failed to fetch permissions', error)
      alert('Gagal memuat konfigurasi hak akses.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (role: string, module: string) => {
    if (role === 'SUPER_ADMIN') return // Cannot toggle SUPER_ADMIN

    setPermissions(prev => {
      const existingIndex = prev.findIndex(p => p.role === role && p.module === module)
      if (existingIndex >= 0) {
        const next = [...prev]
        next[existingIndex].canAccess = !next[existingIndex].canAccess
        return next
      } else {
        return [...prev, { role, module, canAccess: true }]
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // Clean up before sending, ensure we have everything
      const payload = []
      for (const role of ROLES) {
        for (const module of modules) {
          const p = permissions.find(p => p.role === role && p.module === module)
          payload.push({
            role,
            module,
            canAccess: role === 'SUPER_ADMIN' ? true : (p ? p.canAccess : false)
          })
        }
      }

      await api.post('/system/roles/permissions', { permissions: payload })
      alert('Konfigurasi hak akses berhasil disimpan. Pengguna mungkin perlu relogin untuk melihat perubahan.')
    } catch (error) {
      console.error(error)
      alert('Gagal menyimpan konfigurasi.')
    } finally {
      setSaving(false)
    }
  }

  const hasAccess = (role: string, module: string) => {
    if (role === 'SUPER_ADMIN') return true
    const p = permissions.find(p => p.role === role && p.module === module)
    return p ? p.canAccess : false
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hak Akses Modul
          </h1>
          <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
            Atur modul mana yang dapat diakses oleh setiap role. (Super Admin selalu memiliki akses penuh).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPermissions}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border hover:bg-gray-50 transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <FiRefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-r bg-gray-50 font-black text-[11px] uppercase tracking-wider sticky left-0 z-10" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>
                  Modul / Menu
                </th>
                {ROLES.map(role => (
                  <th key={role} className="p-4 border-b bg-gray-50 text-center font-black text-[11px] uppercase tracking-wider min-w-[120px]" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-center gap-1.5">
                      {role === 'SUPER_ADMIN' && <FiShield className="w-3.5 h-3.5 text-primary" />}
                      {role.replace('_', ' ')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.length === 0 && (
                <tr>
                  <td colSpan={ROLES.length + 1} className="p-8 text-center text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                    Tidak ada modul terdeteksi
                  </td>
                </tr>
              )}
              {modules.map((module, idx) => (
                <motion.tr
                  key={module}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 border-b border-r font-bold text-sm bg-white sticky left-0 z-10" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col">
                      <span>{getModuleName(module)}</span>
                      <span className="text-[10px] font-mono text-gray-400 mt-0.5">{module}</span>
                    </div>
                  </td>
                  {ROLES.map(role => {
                    const isSuperAdmin = role === 'SUPER_ADMIN'
                    const access = hasAccess(role, module)

                    return (
                      <td key={`${module}-${role}`} className="p-4 border-b text-center" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => handleToggle(role, module)}
                          disabled={isSuperAdmin}
                          className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all ${
                            isSuperAdmin 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : access 
                                ? 'bg-primary text-white shadow-sm shadow-primary/30' 
                                : 'bg-gray-100 text-transparent hover:bg-gray-200'
                          }`}
                        >
                          {access ? <FiCheck className="w-4 h-4" /> : <FiX className="w-3 h-3 text-gray-300" />}
                        </button>
                      </td>
                    )
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
