'use client'

import { motion } from 'framer-motion'
import { FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'

const doctors = [
  {
    name: 'dr. Andi Pratama, Sp.PD',
    specialty: 'Spesialis Penyakit Dalam',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    bio: 'Berpengalaman lebih dari 10 tahun dalam menangani berbagai keluhan penyakit dalam.'
  },
  {
    name: 'dr. Siska Amelia, Sp.A',
    specialty: 'Spesialis Anak',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400',
    bio: 'Ahli kesehatan anak yang ramah dan berdedikasi tinggi terhadap tumbuh kembang buah hati.'
  },
  {
    name: 'drg. Budi Santoso',
    specialty: 'Dokter Gigi',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    bio: 'Menyediakan perawatan gigi komprehensif dengan pendekatan yang lembut dan modern.'
  }
]

export default function DoctorsSection() {
  return (
    <section id="doctors" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Kenali <span className="text-primary">Tim Dokter</span> Kami
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Tenaga medis profesional yang siap memberikan pelayanan terbaik untuk kesehatan Anda dan keluarga.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-80 overflow-hidden">
                <img 
                  src={doctor.image} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                />
              </div>
              <div className="p-6">
                <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">{doctor.specialty}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{doctor.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {doctor.bio}
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                    <FiInstagram />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                    <FiTwitter />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                    <FiLinkedin />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
