'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiPlusCircle, FiArrowRight, FiCheckCircle, FiShield, FiUsers } from 'react-icons/fi'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function CTASection() {
  const { settings } = useSettingsStore()
  const hero = settings.hero

  return (
    <section className="section-padding bg-gradient-to-r from-primary via-secondary to-primary text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10"></div>

      <div className="container-custom text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-xs uppercase tracking-widest mb-6">
            <FiPlusCircle />
            Siap Melayani Anda
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-8 leading-tight tracking-tight">
            Konsultasikan Masalah <br className="hidden md:block" /> <span className="text-blue-100">Kesehatan Anda</span> Sekarang
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Jangan tunda kesehatan Anda. Dapatkan penanganan medis terbaik dari tim dokter spesialis kami dengan fasilitas yang modern dan nyaman.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <Link
            href={hero.primaryHref}
            className="px-10 py-5 bg-white text-primary rounded-2xl font-bold hover:bg-blue-50 transition-all duration-300 inline-flex items-center justify-center group shadow-2xl shadow-blue-900/20 text-lg"
          >
            {hero.primaryCta}
            <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href={hero.secondaryHref}
            className="px-10 py-5 border-2 border-white/30 text-white rounded-2xl font-bold hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center text-lg"
          >
            {hero.secondaryCta}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-sm font-medium border-t border-white/10 pt-12"
        >
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-green-300 w-5 h-5" />
            <span>Dokter Spesialis Terbaik</span>
          </div>
          <div className="flex items-center gap-3">
            <FiShield className="text-green-300 w-5 h-5" />
            <span>Klinik Terakreditasi Resmi</span>
          </div>
          <div className="flex items-center gap-3">
            <FiUsers className="text-green-300 w-5 h-5" />
            <span>50.000+ Pasien Puas</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
