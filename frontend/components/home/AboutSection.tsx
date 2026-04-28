'use client'

import { motion } from 'framer-motion'
import { FiCheckCircle, FiTarget, FiHeart } from 'react-icons/fi'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function AboutSection() {
  const { settings } = useSettingsStore()
  const about = settings.about

  if (!about) return null;

  return (
    <section id="about" className="section-padding bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Image with floating elements */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200 dark:shadow-none">
              <img 
                src={about.image?.startsWith('http') ? about.image : `http://localhost:3000${about.image}`} 
                alt="Tentang Klinik Yasfina" 
                className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <FiHeart className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Dedikasi Kami</h3>
                </div>
                <p className="text-sm text-gray-200">Melayani sepenuh hati untuk kesehatan Anda.</p>
              </div>
            </div>

            {/* Decorative background blobs */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
              Tentang Kami
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              {about.title}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
              {about.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <FiTarget className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Visi</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{about.vision}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Misi</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{about.mission}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-slate-800">
              <div className="text-3xl font-extrabold text-primary">15+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Tahun Pengalaman <br />Melayani Masyarakat
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
