"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"

interface FieldErrorProps {
  message?: string
}

/** Animated inline field validation error */
export function FieldError({ message }: FieldErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center gap-1.5 mt-1.5 overflow-hidden"
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-medium text-red-500">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
