"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

let confirmResolve: ((value: boolean) => void) | null = null

export const confirmDialog = (options: ConfirmOptions | string): Promise<boolean> => {
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options
    confirmResolve = resolve
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-confirm-dialog', { detail: opts }))
    }
  })
}

export function GlobalConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  useEffect(() => {
    const handleShow = (e: any) => {
      setOptions(e.detail)
      setIsOpen(true)
    }
    window.addEventListener('show-confirm-dialog', handleShow)
    return () => window.removeEventListener('show-confirm-dialog', handleShow)
  }, [])

  const handleClose = (value: boolean) => {
    setIsOpen(false)
    if (confirmResolve) {
      confirmResolve(value)
      confirmResolve = null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{options?.title || "Are you sure?"}</h2>
              <p className="text-sm text-gray-500 mb-6">{options?.message}</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  {options?.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  {options?.confirmText || "Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
