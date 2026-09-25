'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { siteConfig } from '@/lib/siteConfig'
import {
  FiCheck, FiX, FiZap, FiTarget, FiShield, FiActivity,
  FiPhone, FiClock, FiHeart, FiUsers, FiGift, FiAward, FiSmile,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

export default function CircumcisionSection() {
  const { settings } = useSettingsStore()
  const data = settings?.circumcision?.methods?.length
    ? settings.circumcision
    : siteConfig.circumcision

  const contact = settings?.contact || siteConfig.contact
  const waNumber = contact?.whatsapp || '6281299441313'
  const waFormatted = contact?.whatsappFormatted || '+62 812-9944-1313'
  const [selectedMethod, setSelectedMethod] = useState<any>(null)

  const methodIcons = [
    <FiZap key="laser" className="w-6 h-6" />,
    <FiTarget key="klamp" className="w-6 h-6" />,
    <FiShield key="lem" className="w-6 h-6" />,
    <FiActivity key="stapler" className="w-6 h-6" />,
  ]

  const waLink = (msg: string) =>
    `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`

  const includedIcons = [
    <FiAward key="d" className="w-5 h-5" />,
    <FiHeart key="p" className="w-5 h-5" />,
    <FiGift key="c" className="w-5 h-5" />,
    <FiActivity key="o" className="w-5 h-5" />,
    <FiCheck key="k" className="w-5 h-5" />,
  ]

  return (
    <section id="circumcision" className="section-padding bg-gradient-to-b from-white via-amber-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container-custom relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-widest mb-4 border border-amber-500/20"
          >
            <FiZap className="w-3 h-3" />
            {data.badge || 'Rumah Sunat Modern Yasfina'}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight"
          >
            {data.title || 'Sunat Aman, Nyaman &'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              {data.highlight || 'Minim Trauma Anak'}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed"
          >
            {data.description}
          </motion.p>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-7"
          >
            {[
              { icon: <FiShield className="w-4 h-4" />, label: 'Dokter Berpengalaman' },
              { icon: <FiCheck className="w-4 h-4" />, label: 'Harga Transparan' },
              { icon: <FiSmile className="w-4 h-4" />, label: 'Ramah Anak' },
            ].map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm"
              >
                <span className="text-emerald-600">{s.icon}</span>
                {s.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Metode */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
          {data.methods.map((method: any, i: number) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-white dark:bg-slate-900 rounded-[1.75rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 flex flex-col"
            >
              <div className="p-7 pb-5 flex-1">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                    {methodIcons[i] || <FiCheck className="w-6 h-6" />}
                  </div>
                  {i === 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest">
                      Paling Dipilih
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400 mb-1">
                  {method.short}
                </p>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {method.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  {method.desc}
                </p>
                <ul className="space-y-2 mb-5">
                  {method.advantages?.map((adv: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-[13px] font-bold text-gray-700 dark:text-gray-300">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <FiCheck className="w-3.5 h-3.5" />
                      </span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-7 pb-7">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-4 py-3 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Biaya</p>
                  <p className="text-base font-black text-gray-900 dark:text-white">{method.price}</p>
                  {method.priceNote && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{method.priceNote}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMethod(method)}
                    className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-slate-800 text-white text-xs font-black uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-all"
                  >
                    Detail
                  </button>
                  <a
                    href={waLink(`Halo Klinik Yasfina, saya ingin tanya detail harga dan pendaftaran untuk ${method.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all"
                    title={`Chat WA - ${method.name}`}
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Biaya */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Anak */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2rem] bg-gray-900 text-white p-8 md:p-10 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-2 relative">
              <span className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-black" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">Biaya Khitan Anak</p>
                <h3 className="text-2xl font-black">Transparan & Lengkap</h3>
              </div>
            </div>
            <div className="divide-y divide-white/10 relative mt-4">
              {(data.pricingAnak || []).map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm font-bold text-gray-200">{row.label}</span>
                  <span className="text-sm font-black text-amber-400 whitespace-nowrap">{row.price}</span>
                </div>
              ))}
            </div>
            <a
              href={waLink('Halo Klinik Yasfina, saya ingin konsultasi biaya khitan ANAK.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-amber-500 hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all relative"
            >
              <FaWhatsapp className="w-5 h-5" /> Tanya Biaya Anak
            </a>
          </motion.div>

          {/* Dewasa */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2rem] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-8 md:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FiHeart className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">Biaya Khitan Dewasa</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Privasi Terjaga</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800 mt-4">
              {(data.pricingDewasa || []).map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{row.label}</span>
                  <span className="text-sm font-black text-emerald-600 whitespace-nowrap">{row.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Khitan Remaja / Khusus</span>
                <span className="text-sm font-black text-gray-500">Chat Admin</span>
              </div>
            </div>
            <a
              href={waLink('Halo Klinik Yasfina, saya ingin konsultasi biaya khitan DEWASA.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all"
            >
              <FaWhatsapp className="w-5 h-5" /> Tanya Biaya Dewasa
            </a>
          </motion.div>
        </div>

        {/* Sudah termasuk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 px-8 py-7 mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                <FiGift className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Biaya Sudah Termasuk</p>
                <p className="font-extrabold text-gray-900 dark:text-white">Tanpa biaya tersembunyi</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 md:ml-auto">
              {(data.included || []).map((item: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 text-[13px] font-bold text-gray-800 dark:text-gray-100 shadow-sm"
                >
                  <span className="text-emerald-600">{includedIcons[i % includedIcons.length]}</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Fasilitas + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/25"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
            <div className="p-8 md:p-12">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80 mb-3">Fasilitas & Suasana</p>
              <h3 className="text-2xl md:text-3xl font-black leading-tight mb-4">
                {data.facilityTitle}
              </h3>
              <p className="text-white/90 leading-relaxed mb-6">
                {data.facilityDesc}
              </p>
              <ul className="space-y-2.5 mb-8">
                {(data.facilityPoints || []).map((pt: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm">
                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <FiCheck className="w-4 h-4" />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 text-sm font-bold text-white/90">
                <FiClock className="w-4 h-4" />
                Senin – Minggu : 08.00 – 21.00 WIB
                <span className="hidden sm:inline text-white/50">•</span>
                <span className="hidden sm:inline-flex items-center gap-1.5"><FiPhone className="w-4 h-4" /> {waFormatted}</span>
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/15">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Konsultasi Gratis</p>
              <p className="text-xl font-black mb-2">Tanya Dokter Sekarang</p>
              <p className="text-sm text-white/80 mb-6">Balas cepat via WhatsApp di jam operasional.</p>
              <a
                href={waLink('Halo Klinik Yasfina, saya ingin konsultasi mengenai layanan Rumah Sunat Modern.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
              >
                <FaWhatsapp className="w-5 h-5 text-emerald-600" /> Chat WhatsApp Admin
              </a>
              <a
                href="/register"
                className="mt-3 flex items-center justify-center w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Booking Jadwal Khitan
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal detail metode */}
      <AnimatePresence>
        {selectedMethod && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMethod(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800"
            >
              <button
                onClick={() => setSelectedMethod(null)}
                className="absolute top-5 right-5 p-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-rose-500 hover:text-white transition-all z-20"
              >
                <FiX className="w-5 h-5" />
              </button>
              <div className="p-8 md:p-10">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1">{selectedMethod.short}</p>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">{selectedMethod.name}</h3>
                <div className="inline-block px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 font-black text-amber-700 dark:text-amber-300 mb-5">
                  {selectedMethod.price}
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{selectedMethod.detail}</p>
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Kelebihan</h4>
                <div className="grid grid-cols-1 gap-2.5 mb-7">
                  {selectedMethod.advantages?.map((adv: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <FiCheck className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{adv}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={waLink(`Halo Klinik Yasfina, saya ingin tanya detail harga dan pendaftaran untuk ${selectedMethod.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2"
                  >
                    <FaWhatsapp className="w-4 h-4" /> Tanya Harga & Daftar
                  </a>
                  <a
                    href="/register"
                    className="px-6 py-3.5 bg-gray-900 dark:bg-slate-800 text-white font-black text-xs rounded-xl uppercase tracking-wider text-center hover:bg-amber-500 hover:text-black transition-all"
                  >
                    Booking Janji
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
