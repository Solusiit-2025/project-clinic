'use client'

import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import Link from 'next/link'
import { FiArrowLeft, FiFileText, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen text-gray-800 dark:text-gray-200">
        <div className="container-custom max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-14 shadow-xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <FiFileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  Syarat & Ketentuan
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Aturan & Ketentuan Layanan • Klinik Yasfina Pusat
                </p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-slate-800 mb-8" />

            <div className="space-y-8 text-sm md:text-base leading-relaxed font-medium">
              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiCheckCircle className="text-primary" /> 1. Pendaftaran Janji Temu Online
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Pendaftaran janji temu online yang dilakukan melalui website Klinik Yasfina merupakan estimasi jadwal kedatangan. Konfirmasi kepastian jadwal dokter akan dikirimkan oleh staf klinik melalui WhatsApp atau telepon resmi.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiClock className="text-primary" /> 2. Waktu Kedatangan Pasien
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Pasien diharapkan hadir di klinik sekurang-kurangnya 15 menit sebelum estimasi waktu pendaftaran untuk melakukan verifikasi ulang data dan pengambilan nomor antrean fisik di meja pendaftaran.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiAlertCircle className="text-primary" /> 3. Pembatalan & Perubahan Jadwal
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Jika pasien tidak dapat hadir sesuai jadwal yang telah dikonfirmasi, dimohon untuk menginformasikan pembatalan atau penundaan jadwal melalui WhatsApp Admin Klinik sekurang-kurangnya 2 jam sebelum waktu janji temu.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">4. Layanan Pengobatan & Rumah Sunat</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Seluruh prosedur medis, termasuk pengobatan umum, perawatan poli gigi, dan khitan modern dilakukan setelah evaluasi pra-tindakan oleh dokter berlisensi (SIP aktif). Pembayaran tindakan medis dapat dilakukan secara tunai, kartu debit/kredit, maupun transfer resmi klinik.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
