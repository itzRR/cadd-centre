"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, HelpCircle, Sparkles, CheckCircle2, Rocket } from "lucide-react"

export interface GuideStep {
  title: string
  description: string
  icon: React.ElementType
  gradient: string
  tip?: string
}

interface QuickGuideProps {
  /** Unique key to track if this guide has been seen (e.g. "admin_dashboard", "marketing_dashboard") */
  guideKey: string
  /** Dashboard name shown in the header */
  dashboardName: string
  /** Accent gradient for styling */
  accentGradient: string
  /** Steps to walk through */
  steps: GuideStep[]
  /** Optional: render a custom trigger button. If omitted, a default "Guide" button is rendered */
  renderTrigger?: (onClick: () => void) => React.ReactNode
}

export function QuickGuide({ guideKey, dashboardName, accentGradient, steps, renderTrigger }: QuickGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenGuide, setHasSeenGuide] = useState(true) // default true to avoid flash

  const storageKey = `guide_seen_${guideKey}`

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      // First time - auto-open after a short delay
      setHasSeenGuide(false)
      const timer = setTimeout(() => setIsOpen(true), 1200)
      return () => clearTimeout(timer)
    }
    setHasSeenGuide(true)
  }, [storageKey])

  const handleClose = () => {
    setIsOpen(false)
    setCurrentStep(0)
    localStorage.setItem(storageKey, "true")
    setHasSeenGuide(true)
  }

  const handleOpen = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const StepIcon = step?.icon

  return (
    <>
      {/* Trigger Button */}
      {renderTrigger ? (
        renderTrigger(handleOpen)
      ) : (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-sm font-medium transition-all hover:shadow-sm relative"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Guide
          {!hasSeenGuide && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
          )}
        </button>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && step && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${accentGradient} px-6 py-5 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">
                        {!hasSeenGuide ? `Welcome to ${dashboardName}!` : `${dashboardName} Guide`}
                      </h2>
                      <p className="text-white/70 text-xs">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10 mt-4 flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer"
                      onClick={() => setCurrentStep(i)}
                    >
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: i <= currentStep ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Step Icon & Title */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <StepIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </div>

                    {/* Tip */}
                    {step.tip && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-700 text-xs leading-relaxed">{step.tip}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${accentGradient} text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
                  >
                    {isLastStep ? (
                      <>
                        <Rocket className="w-4 h-4" />
                        Get Started!
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Reusable hook to check if guide has been seen
 */
export function useGuideState(guideKey: string) {
  const [hasSeen, setHasSeen] = useState(true)
  useEffect(() => {
    setHasSeen(!!localStorage.getItem(`guide_seen_${guideKey}`))
  }, [guideKey])
  return hasSeen
}
