'use client'

import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface ModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-neutral-900 text-white rounded-xl border border-white/10 shadow-2xl w-full max-w-lg ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ModalWrapper
