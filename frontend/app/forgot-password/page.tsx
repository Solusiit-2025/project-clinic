'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiShield,
  FiUser,
  FiClock,
} from 'react-icons/fi'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const contactChannels = [
    {
      icon: FiPhone,
      label: 'Telepon',
      value: '+62 812-3456-7890',
      href: 'tel:+6281234567890',
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      text: 'text-green-700',
      description: 'Senin – Sabtu, 08.00 – 17.00 WIB',
    },
    {
      icon: FiMessageCircle,
      label: 'WhatsApp',
      value: '+62 812-3456-7890',
      href: 'https://wa.me/6281234567890?text=Halo%20Admin%20Yasfina%20Pusat%2C%20saya%20membutuhkan%20bantuan%20reset%20password%20akun%20saya.',
      color: 'from-teal-500 to-green-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      text: 'text-teal-700',
      description: 'Respon cepat via pesan',
    },
    {
      icon: FiMail,
      label: 'Email',
      value: 'admin@yasfina.co.id',
      href: 'mailto:admin@yasfina.co.id?subject=Permintaan%20Reset%20Password&body=Halo%20Admin%20Yasfina%20Pusat%2C%0A%0ASaya%20membutuhkan%20bantuan%20untuk%20mereset%20password%20akun%20saya.%0A%0ANama%3A%20%0AEmail%20Akun%3A%20%0AUnit%20Kerja%3A%20%0A%0ATerima%20kasih.',
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      description: 'Balasan dalam 1×24 jam kerja',
    },
  ]

  const steps = [
    {
      icon: FiUser,
      title: 'Siapkan Identitas Anda',
      desc: 'Nama lengkap, email akun, dan unit kerja / cabang klinik Anda.',
    },
    {
      icon: FiMessageCircle,
      title: 'Hubungi Admin Yasfina Pusat',
      desc: 'Gunakan salah satu saluran kontak di bawah ini untuk mengajukan permintaan.',
    },
    {
      icon: FiShield,
      title: 'Verifikasi Identitas',
      desc: 'Admin akan memverifikasi identitas Anda sebelum melakukan reset password.',
    },
    {
      icon: FiClock,
      title: 'Password Baru Dikirimkan',
      desc: 'Password sementara akan dikirimkan ke email terdaftar Anda.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-secondary/10 to-transparent rounded-full blur-3xl -z-10" />

      {/* Back button */}
      <button
        onClick={() => router.push('/login')}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-semibold"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Kembali ke Login</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-white/80 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary px-8 pt-10 pb-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Lupa Password?</h1>
            <p className="text-white/80 text-sm font-medium leading-relaxed">
              Untuk keamanan akun Anda, reset password dilakukan<br className="hidden sm:block" /> melalui Admin Yasfina Pusat.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8">

            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">!</span>
              </div>
              <p className="text-amber-800 text-xs font-semibold leading-relaxed">
                Sistem ini tidak mendukung reset password mandiri. Silakan hubungi <span className="font-black">Admin Yasfina Pusat</span> untuk mendapatkan bantuan.
              </p>
            </div>

            {/* Steps */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Langkah Reset Password</p>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                      <step.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Contact channels */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Hubungi Admin Yasfina Pusat</p>
              <div className="space-y-3">
                {contactChannels.map((ch, i) => (
                  <motion.a
                    key={i}
                    href={ch.href}
                    target={ch.label !== 'Telepon' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border ${ch.bg} ${ch.border} hover:shadow-md transition-all group`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <ch.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black uppercase tracking-widest ${ch.text} mb-0.5`}>{ch.label}</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{ch.value}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{ch.description}</p>
                    </div>
                    <FiArrowLeft className={`w-4 h-4 ${ch.text} rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Back to login */}
            <div className="pt-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium mb-3">Sudah ingat password Anda?</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Kembali ke halaman Login
              </Link>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
          Powered by Klinik Yasfina &copy; 2026
        </p>
      </motion.div>
    </div>
  )
}
