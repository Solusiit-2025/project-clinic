'use client'

import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import Link from 'next/link'
import { FiArrowLeft, FiShield, FiLock, FiFileText } from 'react-icons/fi'

export default function PrivacyPage() {
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
                <FiShield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  Kebijakan Privasi
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Perlindungan & Kerahasiaan Data Medis Pasien • Klinik Yasfina
                </p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-slate-800 mb-8" />

            <div className="space-y-8 text-sm md:text-base leading-relaxed font-medium">
              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiLock className="text-primary" /> 1. Komitmen Kerahasiaan Rekam Medis
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Klinik Yasfina berkomitmen penuh menjaga privasi dan kerahasiaan data medis seluruh pasien sesuai dengan Undang-Undang Kesehatan Republik Indonesia dan Peraturan Menteri Kesehatan (Permenkes) No. 24 Tahun 2022 tentang Rekam Medis.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiFileText className="text-primary" /> 2. Pengumpulan Data Pribadi
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Data pribadi yang kami kumpulkan melalui sistem pendaftaran online maupun registrasi langsung meliputi:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 pl-4">
                  <li>Nama lengkap, tanggal lahir, dan nomor identitas (KTP/NIK).</li>
                  <li>Nomor telepon / WhatsApp aktif dan alamat email untuk konfirmasi janji temu.</li>
                  <li>Riwayat kesehatan, riwayat alergi, dan riwayat pengobatan yang relevan untuk kebutuhan medis.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiShield className="text-primary" /> 3. Penggunaan Informasi
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Informasi pasien hanya digunakan untuk kepentingan diagnostik medis, pemberian perawatan, pengelolaan jadwal janji temu, pengingat kontrol rutin, serta pelaporan resmi kesehatan sesuai ketentuan hukum yang berlaku. Kami tidak pernah menjual atau membagikan data Anda kepada pihak ketiga untuk kepentingan komersial.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiLock className="text-primary" /> 4. Keamanan Sistem & Penyimpanan
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Seluruh data disimpan dalam peladen (*server*) aman berstandar enkripsi industri untuk mencegah akses tanpa wewenang, kebocoran, atau manipulasi data.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">5. Kontak & Pertanyaan Privacy</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Jika Anda memiliki pertanyaan mengenai kebijakan privasi atau ingin memperbarui informasi kesehatan Anda, silakan hubungi tim kami melalui email <strong>info@yasfina.com</strong> atau telepon / WhatsApp <strong>0896-2935-3621</strong>.
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
