'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiArrowRight, FiPlay, FiCheckCircle, FiScissors } from 'react-icons/fi'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function HeroSection() {
  const { settings } = useSettingsStore()
  const hero = settings.hero

  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-secondary/10 to-transparent rounded-full blur-3xl -z-10"></div>

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6 border border-primary/20"
            >
              <FiPlay className="w-3 h-3" />
              {hero.preTitle}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.15] mb-8 text-gray-900 dark:text-white tracking-tight"
            >
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Layanan Medis</span>
              </span> Modern & <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Rumah Sunat</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl"
            >
              Klinik Yasfina hadir dengan dua keunggulan utama: Layanan Pengobatan Umum & Poli Gigi profesional, serta Pusat Khitan Modern dengan metode tercanggih untuk kesehatan keluarga Anda.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-5"
            >
              <Link
                href="#circumcision"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transform hover:-translate-y-1 transition-all text-lg border border-amber-400/50"
              >
                <FiScissors className="w-5 h-5" />
                Rumah Sunat
              </Link>
              <Link
                href={hero.primaryHref}
                className="btn-primary px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-1 transition-all text-lg"
              >
                {hero.primaryCta}
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap gap-10 mt-16"
            >
              {hero.stats.map((stat: any, index: number) => (
                <div key={index} className="flex flex-col">
                  <span className={`text-4xl font-extrabold tracking-tight ${stat.color} mb-1`}>{stat.value}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - Premium Medical Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-400 group">
              <img 
                src={hero.image ? (hero.image.startsWith('http') ? hero.image : `http://localhost:3000${hero.image}`) : "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000"} 
                alt="Medical Professional" 
                className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-60"></div>
              
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-12 -left-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/50 dark:border-slate-800/50 w-64"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Status Terverifikasi</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Klinik Terakreditasi A</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                className="absolute bottom-12 -right-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-slate-800/50 w-72"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">+50k Pasien</div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">"Pelayanan dokter sangat ramah dan profesional!"</p>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-60 -z-1"></div>
            <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60 -z-1"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
