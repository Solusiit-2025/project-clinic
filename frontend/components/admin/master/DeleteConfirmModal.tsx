'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertCircle, FiTrash2, FiX } from 'react-icons/fi'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName?: string
  loading?: boolean
}

export default function DeleteConfirmModal({
  isOpen, onClose, onConfirm, title, message, itemName, loading = false
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Decoration Header */}
            <div className="h-2 w-full bg-red-500" />
            
            <div className="p-8">
              {/* Icon Section */}
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
                <FiAlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
              </div>

              {/* Text Section */}
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-1">
                  {message}
                </p>
                {itemName && (
                  <p className="text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-3 break-all">
                    "{itemName}"
                  </p>
                )}
              </div>

              {/* Warning box */}
              <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-800 leading-tight uppercase tracking-wider">
                  Tindakan ini tidak dapat dibatalkan secara permanen.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Close Cross */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
