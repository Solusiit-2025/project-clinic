'use client'

import Link from 'next/link'
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi'
import { useSettingsStore } from '@/lib/store/useSettingsStore'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { settings } = useSettingsStore()
  const contact = settings.contact
  const footerLinks = settings.footerLinks
  const brandName = settings.brandName
  const description = settings.description

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom section-padding pb-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/20"></div>
              <h3 className="font-bold text-white text-xl tracking-tight">{brandName}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Tautan Cepat</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.map((item: any) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-primary transition-colors flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary mr-0 transition-all group-hover:mr-2"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Layanan & Bantuan</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#contact" className="hover:text-primary transition-colors">Hubungi Kami</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Pusat Bantuan (FAQ)</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Kontak Resmi</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FiPhone className="w-4 h-4 text-primary" />
                </div>
                <span className="mt-1.5">{contact.phone}</span>
              </li>
              <li className="flex items-start space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FiMail className="w-4 h-4 text-primary" />
                </div>
                <span className="mt-1.5">{contact.email}</span>
              </li>
              <li className="flex items-start space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FiMapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="mt-1.5 leading-relaxed">{contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-gray-500 text-center md:text-left">
              &copy; {currentYear} {brandName}. Pelayanan Kesehatan Profesional & Terintegrasi. Semua hak cipta dilindungi.
            </p>
            <div className="flex items-center space-x-4">
              {[
                { icon: FiFacebook, href: '#' },
                { icon: FiTwitter, href: '#' },
                { icon: FiInstagram, href: '#' },
                { icon: FiLinkedin, href: '#' },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
