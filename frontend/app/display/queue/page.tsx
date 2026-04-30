'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiVolume2, 
  FiUser, FiInfo, FiMonitor, FiPlayCircle, FiPackage,
  FiPlay, FiPause, FiSettings
} from 'react-icons/fi'
import { announceQueue } from '@/lib/utils/speech'
import { useThemeStore } from '@/lib/store/useThemeStore'
import ThemeToggle from '@/components/shared/ThemeToggle'

// Helper to get the actual Root URL for files (e.g., http://localhost:5000)
const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  const baseURL = api.defaults.baseURL || ''
  return baseURL.replace(/\/api\/?$/, '')
}

interface Queue {
  id: string
  queueNo: string
  status: 'waiting' | 'called' | 'triage' | 'ready' | 'ongoing' | 'completed' | 'no-show'
  patient: { name: string; gender: string }
  doctor: { name: string } | null
  department: { name: string } | null
  hasMedicalRecord: boolean
  callCounter?: number
}

interface DisplayVideo {
  id: string
  url: string
  name: string
}

function DisplayQueueContent() {
  const searchParams = useSearchParams()
  const [localClinicId, setLocalClinicId] = useState<string | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [clinicName, setClinicName] = useState<string>('')
  const [clinicAddress, setClinicAddress] = useState<string>('')
  const [videos, setVideos] = useState<DisplayVideo[]>([])
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0)
  const [time, setTime] = useState(new Date())
  const [isMounted, setIsMounted] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)
  const [showCallingOverlay, setShowCallingOverlay] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [configVolume, setConfigVolume] = useState(50)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [activeCallingPatient, setActiveCallingPatient] = useState<Queue | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [filterDoctorId, setFilterDoctorId] = useState<string | null>(null)
  const [filterDeptId, setFilterDeptId] = useState<string | null>(null)
  const [filterLabel, setFilterLabel] = useState<string>('')
  const { theme } = useThemeStore()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCallCounters = useRef<Record<string, number>>({})
  const isFirstLoad = useRef(true)

  // Update Clock
  useEffect(() => {
    setIsMounted(true)
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchData = useCallback(async () => {
    let clinicId = localClinicId
    
    // 1. Resolve clinic from URL param -> localStorage cache -> first active clinic
    if (!clinicId) {
      try {
        const publicApi = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004'}/api/public`
        const { data: clinics } = await axios.get(`${publicApi}/clinics`)
        if (!clinics?.length) { setIsSyncing(false); return }

        // Priority 1: URL query param ?clinic=KLN-001 (most explicit, per-branch URL)
        const urlClinicCode = searchParams.get('clinic')
        if (urlClinicCode) {
          const matched = clinics.find((c: any) => c.code === urlClinicCode)
          if (matched) {
            clinicId = matched.id
            setClinicName(matched.name)
            setClinicAddress(matched.address || '')
            if (clinicId) {
              setLocalClinicId(clinicId)
              localStorage.setItem('monitor_standalone_clinic_id', clinicId)
            }
            localStorage.setItem('monitor_clinic_name', matched.name)
            localStorage.setItem('monitor_clinic_address', matched.address || '')
          }
        }

        // Read doctor and department filter from URL
        const urlDoctorId = searchParams.get('doctor')
        const urlDeptId = searchParams.get('department')
        if (urlDoctorId) setFilterDoctorId(urlDoctorId)
        if (urlDeptId) setFilterDeptId(urlDeptId)

        // Priority 2: Standalone monitor cache (prevents dashboard interference)
        if (!clinicId) {
          const cached = localStorage.getItem('monitor_standalone_clinic_id')
          const cachedName = localStorage.getItem('monitor_clinic_name')
          const cachedAddress = localStorage.getItem('monitor_clinic_address')
          // Verify the cached clinic still exists in the DB
          if (cached && clinics.find((c: any) => c.id === cached)) {
            clinicId = cached
            setClinicName(cachedName || '')
            setClinicAddress(cachedAddress || '')
            setLocalClinicId(clinicId)
          }
        }

        // Priority 3: Auto-select single active clinic (safe for single-tenant)
        if (!clinicId) {
          const active = clinics.filter((c: any) => c.isActive !== false)
          if (active.length === 1) {
            clinicId = active[0].id
            setClinicName(active[0].name)
            setClinicAddress(active[0].address || '')
            if (clinicId) {
              setLocalClinicId(clinicId)
              localStorage.setItem('monitor_standalone_clinic_id', clinicId)
            }
            localStorage.setItem('monitor_clinic_name', active[0].name)
            localStorage.setItem('monitor_clinic_address', active[0].address || '')
          } else {
            console.warn('[Monitor] Multiple clinics found. Add ?clinic=KODE to the URL.')
            // Use oldest/first (code sorted) as final fallback
            clinicId = clinics[0].id
            setClinicName(clinics[0].name)
            setClinicAddress(clinics[0].address || '')
            if (clinicId) { setLocalClinicId(clinicId); }
          }
        }
      } catch (e: any) {
        console.error('Core Connectivity Error:', e.response?.data || e.message)
      }
    }

    if (!clinicId) {
      setIsSyncing(false)
      return
    }

    try {
      // 2. Fetch Queues from Public Gateway - Use raw axios to avoid global interceptor 403/401
      const publicApi = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004'}/api/public`
      const { data: queueData } = await axios.get(`${publicApi}/queues`, { 
        params: { 
          clinicId,
          ...(filterDoctorId ? { doctorId: filterDoctorId } : {}),
          ...(filterDeptId ? { departmentId: filterDeptId } : {})
        } 
      })
      setQueues(queueData)

      // Build filter label from first queue's doctor/department for header display
      if ((filterDoctorId || filterDeptId) && queueData.length > 0) {
        const parts: string[] = []
        if (filterDoctorId && queueData[0]?.doctor?.name) {
          parts.push(queueData[0].doctor.name)
        }
        if (filterDeptId && queueData[0]?.department?.name) {
          parts.push(queueData[0].department.name)
        }
        setFilterLabel(parts.join(' — '))
      } else if (filterDoctorId || filterDeptId) {
        // No queues yet but filter is active, try to keep existing label
        setFilterLabel(prev => prev || 'Filter Aktif')
      }

      // 3. Fetch Settings from Public Gateway
      const { data: settingsData } = await axios.get(`${publicApi}/settings`)
      
      const videoSetting = settingsData.find((s: any) => s.key === 'display_videos')
      if (videoSetting && Array.isArray(videoSetting.value)) {
        setVideos(prev => JSON.stringify(prev) !== JSON.stringify(videoSetting.value) ? videoSetting.value : prev)
      }

      const volumeSetting = settingsData.find((s: any) => s.key === 'monitor_video_volume')
      if (volumeSetting) {
        const newVol = Number(volumeSetting.value)
        setConfigVolume(prev => prev !== newVol ? newVol : prev)
      }
    } catch (e: any) {
      console.error('Data Sync Error:', e.response?.data || e.message)
    } finally {
      setIsSyncing(false)
    }
  }, [localClinicId, filterDoctorId, filterDeptId, searchParams]) // Isolated dependencies

  // Real-time polling (5s)
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])


  // Video Sequential Logic
  const handleVideoEnd = () => {
    if (videos.length === 0) return
    setCurrentVideoIdx((prev) => (prev + 1) % videos.length)
  }

  // 🎬 CORE VIDEO PLAYER - Only handles Source Switching (the "heavy" part)
  useEffect(() => {
    if (!isStarted || !videoRef.current || videos.length === 0) return
    const video = videoRef.current
    const targetUrl = `${getBaseUrl()}${videos[currentVideoIdx]?.url}`
    
    // IMPORTANT: Only update src and load if fundamentally different (prevents polling interference)
    if (video.src !== targetUrl) {
      console.log(`[Monitor] Loading next video: ${targetUrl}`)
      video.pause()
      video.src = targetUrl
      video.load() // .load() is heavy, only call when source changes
      
      if (!isPaused && !showCallingOverlay) {
        video.play().catch(e => console.log('Video play failed:', e))
      }
    }
  }, [currentVideoIdx, isStarted, videos])

  // 🔊 PROPERTY SYNC - Handles volume, mute, play/pause (the "light" part)
  useEffect(() => {
    if (!videoRef.current || !isStarted) return
    const video = videoRef.current

    // Sync non-destructive properties
    video.volume = configVolume / 100
    video.muted = isVideoMuted

    // Play/Pause Control (without reloading)
    if (isPaused || showCallingOverlay) {
        if (!video.paused) video.pause()
    } else {
        if (video.paused && video.src) {
           video.play().catch(e => {
             console.log('[Monitor] Autoplay play() failed:', e)
           })
        }
    }
  }, [configVolume, isVideoMuted, isPaused, showCallingOverlay, isStarted])

  // 🔄 MUTE CONTROL - Automatically toggle mute when calling patient
  useEffect(() => {
    if (isStarted) {
      setIsVideoMuted(showCallingOverlay)
    }
  }, [showCallingOverlay, isStarted])

  // Automated Vocal Announcement & Overlay Control (Manual Signal Detection)
  useEffect(() => {
    if (!isStarted || queues.length === 0) return

    let newestCall: any = null
    let hasNewSignal = false

    queues.forEach((q: any) => {
      const prevCount = lastCallCounters.current[q.id] ?? null
      const currentCount = q.callCounter ?? 0

      // Initial state recording (silent)
      if (prevCount === null) {
        lastCallCounters.current[q.id] = currentCount
        return
      }

      // Detect fresh signal from Admin
      if (currentCount > prevCount && q.status === 'called') {
        newestCall = q
        hasNewSignal = true
        lastCallCounters.current[q.id] = currentCount
      }
    });

    if (hasNewSignal && newestCall) {
      // 1. Voice Announcement with Synchronized Overlay
      const room = newestCall.hasMedicalRecord ? 'RUANG PEMERIKSAAN DOKTER' : 'RUANG PRA-PEMERIKSAAN'
      
      announceQueue(
        newestCall.queueNo, 
        newestCall.patient.name, 
        room,
        () => {
          // On Start: Show Overlay
          setActiveCallingPatient(newestCall)
          setShowCallingOverlay(true)
          
          // Auto-dismiss overlay after 15 seconds if voice is very long or something hangs
          if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current)
          overlayTimeoutRef.current = setTimeout(() => {
            setShowCallingOverlay(false)
          }, 15000)
        },
        () => {
          // On End: Hide Overlay
          setShowCallingOverlay(false)
          if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current)
        }
      )
    }
  }, [queues, isStarted])

  // Data Filtering for 3 Zones (Refined based on user feedback)
  const ongoingPasien = queues.filter(q => q.status === 'ongoing').slice(0, 5)
  const triagePasien = queues.filter(q => 
    q.status === 'triage' || 
    q.status === 'ready' || 
    (q.status === 'called' && q.hasMedicalRecord)
  ).slice(0, 5)
  const nextPasien = queues.filter(q => 
    q.status === 'waiting' || 
    q.status === 'no-show' ||
    (q.status === 'called' && !q.hasMedicalRecord)
  ).slice(0, 25)

  // Carousel Pagination Logic
  const startIdx = carouselIndex * 5
  const currentNextBatch = nextPasien.slice(startIdx, startIdx + 5)
  
  // Carousel Rotation Timer (8s)
  useEffect(() => {
    if (nextPasien.length <= 5) {
      setCarouselIndex(0)
      return
    }
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const totalPages = Math.ceil(nextPasien.length / 5)
        return (prev + 1) % totalPages
      })
    }, 8000)
    return () => clearInterval(timer)
  }, [nextPasien.length])

  if (!localClinicId && !isSyncing) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
       <div className="w-24 h-24 bg-red-100 rounded-[2.5rem] flex items-center justify-center border border-red-200 shadow-inner">
          <FiInfo className="w-12 h-12 text-red-500" />
       </div>
       <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">MASALAH KONEKSI</h2>
          <p className="text-slate-500 max-w-sm">Jalur data publik tidak terdeteksi. Silakan periksa koneksi server atau hubungi administrator sistem.</p>
       </div>
       <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest">SEGARKAN HALAMAN</button>
    </div>
  )

  return (
    <div className={`h-screen font-sans overflow-hidden flex flex-col relative public-display transition-colors duration-700 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* START OVERLAY (Audio/Video Activation) */}
      <AnimatePresence>
        {!isStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md space-y-8 bg-white p-12 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
               <div className="w-28 h-28 bg-primary/5 rounded-[3rem] flex items-center justify-center mx-auto border border-primary/10">
                  <FiMonitor className="w-14 h-14 text-primary animate-pulse" />
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">AKTIFKAN MONITOR</h2>
                  <p className="text-slate-500 font-medium">Klik tombol di bawah untuk menyinkronkan video promosi dan suara panggilan otomatis.</p>
               </div>
               <button 
                onClick={() => {
                  setIsStarted(true)
                  setIsVideoMuted(false)
                  announceQueue('', 'Monitor Ruang Tunggu Aktif', '')
                }}
                className="group relative px-12 py-6 bg-primary text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center gap-4 mx-auto"
               >
                 <FiPlayCircle className="w-8 h-8" /> MULAI MONITOR
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col h-full p-6 space-y-6">
        
        {/* HEADER BAR */}
        <div className={`flex items-center justify-between backdrop-blur-md border rounded-full px-12 py-5 shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-8">
             <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <FiPackage className="w-7 h-7 text-white" />
             </div>
             <div>
                <h1 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  YASFINA <span className="text-primary italic">CLINIC</span>
                </h1>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-[0.5em] uppercase mt-1">Smarter Healthcare Solution</p>
             </div>
             {/* Branch Info */}
             {clinicName && (
               <>
                 <div className="w-px h-10 bg-white/10 hidden md:block" />
                 <div className="hidden lg:block">
                   <p className={`text-[13px] font-black uppercase tracking-tight leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{clinicName}</p>
                   {clinicAddress && (
                     <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 max-w-[180px] truncate">{clinicAddress}</p>
                   )}
                 </div>
                 {/* Doctor/Department Filter Indicator */}
                 {filterLabel && (
                   <>
                     <div className="w-px h-10 bg-white/10" />
                     <div className="bg-primary/20 border border-primary/30 px-4 py-2 rounded-2xl max-w-[250px]">
                       <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">Monitor Ruangan</p>
                       <p className={`text-[12px] font-black uppercase tracking-tight leading-tight truncate transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{filterLabel}</p>
                     </div>
                   </>
                 )}
              </>
             )}
          </div>

          <div className="flex items-center gap-10">
             <div className="text-right">
                <div className={`text-5xl font-black tabular-nums tracking-tighter flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                   {isMounted ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                   <span className="text-2xl opacity-30 animate-pulse text-primary">:</span>
                   <span className="text-3xl opacity-60 font-medium">{isMounted ? time.toLocaleTimeString('id-ID', { second: '2-digit' }) : '--'}</span>
                </div>
             </div>
             <ThemeToggle className="scale-125 border-none bg-transparent hover:bg-primary/10" />
             <div className="text-right hidden sm:block">
                <div className="flex items-center gap-3 text-emerald-400 font-black text-[12px] uppercase tracking-[0.3em] bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                   <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                   LIVE
                </div>
             </div>
          </div>
        </div>

        {/* MONITOR WORKFLOW (3 ZONES) */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
           
           {/* SIDEBAR: DOCTOR & NURSE & NEXT */}
           <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
              
              {/* Z1: DOCTOR ROOM - Compact (max 1 patient) */}
              <div className={`border rounded-[2rem] p-5 flex flex-col overflow-hidden shadow-2xl border-l-[10px] border-l-primary transition-all ${theme === 'dark' ? 'bg-[#0b1120] border-white/5' : 'bg-white border-slate-200'}`}>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-2">
                    <FiActivity className="w-3 h-3" /> RUANG PERIKSA DOKTER
                 </h3>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {ongoingPasien.map((q) => (
                        <motion.div 
                          key={q.id}
                          layout
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                        >
                           <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="text-3xl font-black text-primary tabular-nums min-w-[70px] drop-shadow-md flex-shrink-0">{q.queueNo}</div>
                              <div className="w-px h-8 bg-white/10 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                 <p className={`text-[15px] font-black uppercase tracking-tight leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{q.patient.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{q.doctor?.name || 'Dokter Jaga'}</p>
                              </div>
                           </div>
                           <div className={`px-4 py-1.5 text-[10px] font-black rounded-lg border ml-2 flex-shrink-0 ${
                             q.status === "called" ? "bg-blue-500 text-white border-blue-400 animate-pulse shadow-lg shadow-blue-500/20" : 
                             q.status === "ready" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : 
                             "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"}`}
                           >
                             {q.status === "called" ? "DIPANGGIL" : q.status === "ready" ? "SIAP PERIKSA" : "DIPERIKSA"}
                           </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {ongoingPasien.length === 0 && (
                      <div className={`flex items-center justify-center py-6 rounded-2xl border border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                         <FiUser className={`w-8 h-8 mr-2 ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`} />
                         <p className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Ruang Kosong</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Z2: NURSE STATION (VITAL SIGN) - Expanded & Compact rows */}
              <div className={`flex-1 border rounded-[2rem] p-5 flex flex-col overflow-hidden shadow-2xl border-l-[10px] border-l-emerald-500 transition-all ${theme === 'dark' ? 'bg-[#0b1120] border-white/5' : 'bg-white border-slate-200'}`}>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-4 flex items-center gap-2">
                    <FiActivity className="w-3 h-3" /> PEMERIKSAAN VITAL SIGN
                 </h3>
                 <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {triagePasien.map((q) => (
                        <motion.div 
                          key={q.id}
                          layout
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className={`flex items-center justify-between px-5 py-3 rounded-2xl border ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}
                        >
                           <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="text-2xl font-black text-emerald-400 tabular-nums w-16 flex-shrink-0">{q.queueNo}</div>
                              <div className="w-px h-6 bg-emerald-500/20 flex-shrink-0" />
                              <p className={`text-[14px] font-black uppercase truncate tracking-tight flex-1 min-w-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{q.patient.name}</p>
                           </div>
                           <div className={`px-4 py-1.5 text-[9px] font-black rounded-lg border ml-2 flex-shrink-0 ${
                             q.status === "called" ? "bg-blue-500 text-white border-blue-400 animate-pulse shadow-lg shadow-blue-500/20" : 
                             q.status === "ready" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : 
                             theme === 'dark' ? "bg-white/5 text-white/40 border-white/10" : "bg-slate-100 text-slate-400 border-slate-200"
                           }`}>
                             {q.status === "called" ? "DIPANGGIL" : q.status === "ready" ? "SIAP PERIKSA" : "TRIAGE"}
                           </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {triagePasien.length === 0 && (
                      <div className={`flex-1 flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed my-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                         <FiUsers className={`w-16 h-16 mb-4 ${theme === 'dark' ? 'text-white/10' : 'text-slate-200'}`} />
                         <p className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Nurse Siaga</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Z3: QUEUE LIST CAROUSEL */}
              <div className={`h-[28%] border rounded-[2.5rem] p-5 md:p-6 flex flex-col shadow-2xl overflow-hidden relative transition-all ${theme === 'dark' ? 'bg-[#0b1120] border-white/5' : 'bg-white border-slate-200'}`}>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>ANTREAN BERIKUTNYA</h3>
                    {nextPasien.length > 5 && (
                      <div className="flex gap-1.5">
                        {Array.from({ length: Math.ceil(nextPasien.length / 5) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === carouselIndex ? 'w-8 bg-primary' : theme === 'dark' ? 'w-2 bg-white/10' : 'w-2 bg-slate-200'}`} 
                          />
                        ))}
                      </div>
                    )}
                 </div>

                 <div className="flex-1 relative">
                     <AnimatePresence mode="wait">
                        <motion.div 
                          key={carouselIndex}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 }
                          }}
                          className="h-full"
                        >
                           <div className="grid grid-cols-5 gap-3 h-full">
                              {currentNextBatch.map((q) => (
                                 <motion.div 
                                   key={q.id} 
                                   variants={{
                                     initial: { x: 50, opacity: 0 },
                                     animate: { 
                                       x: 0, 
                                       opacity: 1,
                                       transition: { type: "spring", stiffness: 100, damping: 15 }
                                     },
                                     exit: { x: -50, opacity: 0 }
                                   }}
                                   className={`h-full border rounded-2xl flex flex-col items-center justify-center py-4 px-2 shadow-xl group transition-all ${
                                     q.status === "called" 
                                       ? "bg-blue-500 border-blue-400 ring-4 ring-blue-500/20" 
                                       : q.status === "no-show" 
                                         ? "bg-rose-500/10 border-rose-500/20" 
                                         : theme === 'dark' ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-slate-50 border-slate-100 hover:border-slate-300"
                                   }`}
                                 >
                                    <div className={`text-[2.4vh] font-black leading-none drop-shadow-lg ${
                                      q.status === "called" ? "text-white" : 
                                      q.status === "no-show" ? "text-rose-500 opacity-60" : 
                                      theme === 'dark' ? "text-white" : "text-slate-800"
                                    }`}>{q.queueNo}</div>
                                    
                                    {/* Status Indicator */}
                                    {q.status === "called" && (
                                      <div className="mt-2 flex flex-col items-center">
                                         <div className="text-[0.8vh] font-black bg-white text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">DIPANGGIL</div>
                                      </div>
                                    )}
                                    {q.status === "no-show" && (
                                      <div className="mt-2 flex flex-col items-center opacity-60">
                                         <div className="text-[0.8vh] font-black bg-slate-700 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">TERLEWATI</div>
                                      </div>
                                    )}
                                 </motion.div>
                              ))}
                              {currentNextBatch.length === 0 && (
                                <div className="col-span-12 text-center text-[12px] font-black text-white/20 py-8 uppercase tracking-[0.5em] bg-white/5 rounded-2xl border border-dashed border-white/10">Antrean Habis</div>
                              )}
                           </div>
                        </motion.div>
                     </AnimatePresence>
                  </div>
              </div>

           </div>

           {/* HERO: VIDEO & ANNOUNCEMENT */}
           <div className="col-span-12 lg:col-span-8 flex flex-col">
              <div className="flex-1 bg-black border border-white/5 rounded-[3.5rem] relative overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.5)]">
                 
                                   {/* PROMOTIONAL VIDEO PLAYER */}
                  <div className={`absolute inset-0 z-10 transition-opacity duration-700 ${showCallingOverlay ? "opacity-0" : "opacity-100"}`}>
                     {videos.length > 0 ? (
                        <div className="w-full h-full relative">
                           <video 
                              ref={videoRef}
                              onEnded={handleVideoEnd}
                              onError={() => handleVideoEnd()}
                              className="w-full h-full object-cover brightness-[1.15] contrast-[1.1]"
                              muted={isVideoMuted}
                              playsInline
                              poster="/monitor-poster.png"
                           />
                           <div className="absolute bottom-16 left-16 flex items-center gap-6 bg-white/10 backdrop-blur-3xl px-8 py-5 rounded-[2.5rem] border border-white/20 shadow-2xl">
                              
                              {/* PLAY/PAUSE TOGGLE */}
                              <button 
                                onClick={() => {
                                  setIsPaused(!isPaused)
                                  if (videoRef.current) {
                                    if (!isPaused) videoRef.current.pause()
                                    else videoRef.current.play().catch(e => console.log('Play error:', e))
                                  }
                                }}
                                className="w-14 h-14 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all border border-white/30 group/btn"
                              >
                                {isPaused ? (
                                  <FiPlay className="w-6 h-6 text-white group-hover/btn:scale-110 transition-transform" />
                                ) : (
                                  <FiPause className="w-6 h-6 text-white group-hover/btn:scale-110 transition-transform" />
                                )}
                              </button>

                              <div className="w-px h-10 bg-white/20" />

                              <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-none mb-1">PROGRAM TV</p>
                                  <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md">Konten Edukasi Yasfina</p>
                                </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center space-y-12 opacity-30">
                           <FiMonitor className="w-56 h-56 text-slate-200" />
                           <div className="text-center">
                              <p className="text-5xl font-black uppercase tracking-[0.7em] text-slate-900">YASFINA CLINIC</p>
                              <p className="text-lg font-black uppercase tracking-widest text-primary mt-6 tracking-[0.3em]">Healthcare Beyond Excellence</p>
                           </div>
                        </div>
                     )}
                  </div>

                  <AnimatePresence mode="wait">
                     {showCallingOverlay && activeCallingPatient && (
                       <motion.div 
                         key="calling"
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 1.05 }}
                         className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white gap-y-4"
                       >
                          <motion.div 
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="inline-flex items-center gap-5 px-10 md:px-16 py-4 bg-primary text-white rounded-full text-base md:text-lg font-black uppercase tracking-[0.5em] md:tracking-[0.7em] mb-2 shadow-[0_30px_70px_rgba(79,70,229,0.35)] flex-shrink-0"
                          >
                             <FiVolume2 className="w-6 h-6 md:w-8 md:h-8" /> SEDANG DIPANGGIL
                          </motion.div>
                          
                          <div className="text-[12vh] md:text-[18vh] font-black leading-[1] tracking-tighter text-slate-900 mb-0 drop-shadow-[0_10px_30px_rgba(0,0,0,0.05)] break-all max-w-full px-6">
                             {activeCallingPatient.queueNo}
                          </div>
                          
                          <h2 className="text-[5vh] md:text-[7vh] font-black uppercase tracking-tighter text-primary mb-2 underline decoration-slate-100 decoration-8 underline-offset-[10px] truncate max-w-full px-12 leading-tight">
                             {activeCallingPatient.patient.name}
                          </h2>
                          
                          <div className="flex flex-col items-center gap-2 flex-shrink-0">
                             <span className="text-slate-300 uppercase tracking-[0.4em] text-[10px] font-black">MENUJU:</span>
                             <span className="px-8 md:px-12 py-3 md:py-5 bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 uppercase text-slate-900 shadow-sm text-[2.5vh] md:text-[3.5vh] font-black tracking-tight">
                               {activeCallingPatient.hasMedicalRecord ? "RUANG PEMERIKSAAN DOKTER" : "RUANG PRA-PEMERIKSAAN"}
                             </span>
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
              </div>
           </div>

        </div>

         {/* FOOTER STRIP */}
        <div className={`flex items-center justify-between px-12 font-bold uppercase transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
           <div className="flex items-center gap-6 text-[12px] tracking-[0.4em]">
              <FiInfo className="w-6 h-6 text-primary" />
              Saling Menjaga Kenyamanan • Kesehatan Anda Prioritas Kami
           </div>
           
           <div className={`flex items-center gap-10 text-[12px] tracking-[0.5em] transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Powered By <span className={`transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SolusiIT-2025</span>
              <div className="flex gap-2">
                 {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/20' : 'bg-slate-300'}`} />)}
              </div>
           </div>
        </div>

      </div>

    </div>
  )
}

export default function DisplayQueue() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Menyiapkan Layar Antrian...</p>
      </div>
    }>
      <DisplayQueueContent />
    </Suspense>
  )
}
