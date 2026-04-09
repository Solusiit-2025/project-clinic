'use client'

import { motion } from 'framer-motion'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function ServicesSection() {
  const { settings } = useSettingsStore()
  const services = settings.services

  return (
    <section id="services" className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
            Layanan Kami
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kami menyediakan layanan kesehatan komprehensif dengan standar internasional
          </p>
        </motion.div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              
              {/* Card Content */}
              <div className="relative p-8 md:p-10">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`text-6xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent mb-4`}
                >
                  {service.number}
                </motion.div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 text-lg leading-relaxed">
                  {service.description}
                </p>

                {/* Hover indicator */}
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${service.gradient} rounded-full w-0 group-hover:w-12 transition-all duration-300`}></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
