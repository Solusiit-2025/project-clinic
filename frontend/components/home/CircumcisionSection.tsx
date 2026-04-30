'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { FiCheck, FiInfo, FiZap, FiTarget, FiShield, FiScissors, FiHome, FiHeart, FiGift, FiUsers, FiX, FiAward, FiActivity, FiClock } from 'react-icons/fi'

export default function CircumcisionSection() {
  const { settings } = useSettingsStore()
  const circumcision = settings.circumcision || { methods: [], services: [] }
  const [selectedMethod, setSelectedMethod] = useState<any>(null)

  const methodIcons = [
    <FiScissors key="1" />,
    <FiZap key="2" />,
    <FiTarget key="3" />,
    <FiActivity key="4" />,
    <FiShield key="5" />,
    <FiAward key="6" />,
  ]

  return (
    <section id="circumcision" className="section-padding bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="container-custom">
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-20">
          {/* Left: Heading Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-widest mb-6 border border-amber-500/20">
              <FiZap className="w-3 h-3" />
              Layanan Unggulan
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 text-gray-900 dark:text-white leading-[1.1]">
              Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Rumah Sunat</span> Modern Yasfina
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
              Kami menghadirkan pengalaman khitan yang nyaman, aman, dan minim rasa sakit dengan dukungan tenaga medis profesional serta teknologi sunat tercanggih saat ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {circumcision.services.map((service: string, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    service.includes('Gratis') || service.includes('Massal') 
                    ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-200 dark:shadow-none' 
                    : 'bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    service.includes('Gratis') || service.includes('Massal') ? 'bg-white/20' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    <FiCheck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">{service}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Premium Methods List */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <div className="relative z-10 p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-gray-900 to-black text-white shadow-2xl overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-[3s]">
                  <FiZap className="w-64 h-64" />
               </div>
               
               <h3 className="text-3xl font-black mb-8 relative z-10 leading-tight">Metode Modern <br/> <span className="text-amber-500">Minim Rasa Sakit</span></h3>
               
               <div className="space-y-4 relative z-10">
                  {circumcision.methods.map((method: any, i: number) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 10 }}
                      onClick={() => setSelectedMethod(method)}
                      className="flex gap-5 group/item cursor-pointer p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                    >
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-500 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all duration-300 shrink-0 shadow-xl">
                          {methodIcons[i] || <FiCheck />}
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-lg group-hover/item:text-amber-500 transition-colors flex items-center justify-between">
                            {method.name}
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover/item:text-amber-500">Detail &rarr;</span>
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed line-clamp-1">{method.desc}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>

               <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Konsultasi Gratis</p>
                    <p className="text-sm font-bold">Tanya Dokter Sekarang</p>
                  </div>
                  <button className="px-6 py-3 bg-amber-500 text-black font-black text-xs rounded-xl uppercase tracking-widest hover:bg-white transition-all active:scale-95">
                    Hubungi Kami
                  </button>
               </div>
            </div>

            {/* Floating Info */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -right-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 z-20 hidden md:block"
            >
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 text-center">Tingkat Kesembuhan</p>
               <p className="text-4xl font-black text-gray-900 dark:text-white text-center">99.9%</p>
               <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase text-center">Aman & Terpercaya</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMethod && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMethod(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
            >
              <button 
                onClick={() => setSelectedMethod(null)}
                className="absolute top-6 right-6 p-3 bg-gray-100 dark:bg-slate-800 rounded-2xl hover:bg-rose-500 hover:text-white transition-all z-20"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row h-full">
                {/* Left side modal */}
                <div className="w-full md:w-5/12 bg-gray-900 p-10 text-white flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
                   <div className="relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                         <FiAward className="w-8 h-8 text-black" />
                      </div>
                      <h3 className="text-3xl font-black mb-4 leading-tight">{selectedMethod.name}</h3>
                      <p className="text-amber-500 font-bold text-xs uppercase tracking-widest leading-relaxed">{selectedMethod.desc}</p>
                   </div>
                </div>

                {/* Right side modal */}
                <div className="flex-1 p-10 md:p-12">
                   <div className="mb-8">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Mengenal Metode</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        {selectedMethod.detail}
                      </p>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4">Kelebihan & Keunggulan</h4>
                      <div className="grid grid-cols-1 gap-3">
                         {selectedMethod.advantages.map((adv: string, i: number) => (
                           <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                              <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                                 <FiCheck className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{adv}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="mt-10 flex items-center gap-4">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-gray-200 overflow-hidden">
                              <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Patient" />
                           </div>
                         ))}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Dipilih oleh <span className="text-gray-900 dark:text-white font-black">1.200+</span> Pasien</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
