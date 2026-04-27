'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiPhone, FiMail, FiClock } from 'react-icons/fi'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { useThemeStore } from '@/lib/store/useThemeStore'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { settings } = useSettingsStore()
  const { theme } = useThemeStore()
  const contact = settings.contact
  const navItems = settings.navItems
  const brandShort = settings.brandShort

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
      {/* Top Bar */}
      <div className={`hidden lg:block bg-primary text-white py-2 transition-all duration-300 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
        <div className="container-custom flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
              <FiPhone className="w-4 h-4" />
              <span>{contact.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMail className="w-4 h-4" />
              <span>{contact.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            <span>{contact.hours}</span>
          </div>
        </div>
      </div>

      <nav className={`container-custom flex justify-between items-center transition-all duration-300 ${isScrolled ? 'py-3' : 'py-5'}`}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">{brandShort?.charAt(0)}</span>
          </div>
          <span className={`font-bold text-xl transition-colors duration-300 ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white lg:text-primary'}`}>
            {brandShort}
          </span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item: any, index: number) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <a
                href={item.href}
                className={`font-medium hover:text-primary transition-colors duration-300 ${isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-200 lg:text-gray-800 lg:dark:text-gray-100'}`}
              >
                {item.label}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Link
            href="/login"
            className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 ${isScrolled ? 'text-primary border-2 border-primary hover:bg-primary hover:text-white' : 'text-primary border-2 border-primary hover:bg-primary hover:text-white lg:bg-white/10 lg:text-primary lg:border-primary/20'}`}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-primary shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            Janji Temu
          </Link>
        </div>

        {/* Mobile Menu Button + Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <FiX className="w-6 h-6 text-primary" />
            ) : (
              <FiMenu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="container-custom py-6 space-y-4">
              {navItems.map((item: any) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2 border-b border-gray-50 dark:border-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <Link
                  href="/login"
                  className="block w-full px-6 py-3 text-primary border-2 border-primary rounded-xl text-center font-bold"
                  onClick={() => setIsOpen(false)}
                >
                  Login Admin
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-6 py-4 bg-primary text-white rounded-xl text-center font-bold shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Booking Online
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
