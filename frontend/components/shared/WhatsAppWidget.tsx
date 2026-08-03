'use client'

import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function WhatsAppWidget() {
  const { settings } = useSettingsStore()
  const waNumber = settings?.contact?.whatsapp || '6289629353621'
  const whatsappUrl = `https://wa.me/${waNumber}?text=Halo%20Klinik%20Yasfina,%20saya%20ingin%20bertanya%20mengenai%20layanan%20kesehatan%20/%20pendaftaran%20pasien.`

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all border border-emerald-400/30 group"
      title="Konsultasi WhatsApp Klinik Yasfina"
    >
      <div className="relative">
        <FaWhatsapp className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200"></span>
        </span>
      </div>
      <div className="hidden sm:flex flex-col text-left leading-tight">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Konsultasi WA</span>
        <span className="text-xs font-black">Chat Admin</span>
      </div>
    </motion.a>
  )
}
