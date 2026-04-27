'use client'

import { motion } from 'framer-motion'
import { FiStar } from 'react-icons/fi'

const testimonials = [
  {
    name: 'Bpk. Ahmad Junaidi',
    role: 'Pasien Rawat Jalan',
    text: 'Sangat puas dengan pelayanan di Klinik Yasfina. Dokternya sangat detail menjelaskan kondisi penyakit saya dan perawatnya sangat ramah.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    name: 'Ibu Ratna Sari',
    role: 'Pasien Gigi',
    text: 'Fasilitasnya sangat modern dan bersih. Proses pendaftaran online-nya juga sangat mudah, jadi tidak perlu mengantre lama di klinik.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
  },
  {
    name: 'Bpk. Hendra Kurniawan',
    role: 'Check-up Rutin',
    text: 'Klinik terbaik di wilayah ini. Pelayanan farmasinya cepat dan ketersediaan obatnya selalu lengkap. Sangat direkomendasikan.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="section-padding bg-gray-50 dark:bg-slate-900/50 overflow-hidden transition-colors duration-500">
      <div className="container-custom">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Apa Kata <span className="text-secondary">Pasien Kami</span>?
          </motion.h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Kepercayaan Anda adalah motivasi kami untuk terus memberikan pelayanan kesehatan terbaik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:border-primary/30 transition-all duration-300"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-8">
                  "{testimonial.text}"
                </p>
              </div>
                <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-14 h-14 rounded-full object-cover ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all" 
                />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
