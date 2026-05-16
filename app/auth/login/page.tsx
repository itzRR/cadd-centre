"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, BookOpen, GraduationCap, Award } from "lucide-react"
import { signIn, getCurrentUser, isIMSRole } from "@/lib/auth"

const features = [
  { icon: GraduationCap, text: "World-class CAD Education" },
  { icon: BookOpen,      text: "100+ Premium Courses" },
  { icon: Award,         text: "Industry Certifications" },
]

export default function LoginPage() {
  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError]             = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const router = useRouter()

  const getParam = (key: string) => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get(key) || ""
  }

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        const isStaff = user.role === 'admin' || isIMSRole(user.role)
        router.replace(isStaff ? "/admin" : "/dashboard")
      } else {
        setIsCheckingSession(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setIsLoading(true)
    setError("")
    const { user, error: authError } = await signIn(email.trim(), password)
    if (authError || !user) {
      setError(authError || "Login failed. Please try again.")
      setIsLoading(false)
      return
    }
    const redirect = getParam("redirect")
    const isStaff = user.role === 'admin' || isIMSRole(user.role)
    const destination = redirect || (isStaff ? "/admin" : "/dashboard")
    router.replace(destination)
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-red-200 selection:text-red-900">

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#e31e24] overflow-hidden flex-col justify-between p-16">
        {/* Background Decor */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,white,transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,black,transparent_50%)]" />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10">
          <img src="/cadd-logo.png" alt="CADD Centre" className="h-16 w-auto object-contain brightness-0 invert" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold tracking-wider uppercase mb-6 shadow-sm">
            Student Portal
          </div>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Design Your <br />
            <span className="text-red-200">Future Today</span>
          </h1>
          <p className="text-white/90 text-xl font-medium leading-relaxed max-w-md mb-12">
            Join thousands of students mastering world-class CAD skills through our premium education platform.
          </p>

          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-lg font-semibold">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="relative z-10 text-white/60 text-sm font-medium">
          © {new Date().getFullYear()} CADD Centre Lanka. All rights reserved.
        </motion.p>
      </div>

      {/* ── Right Panel Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 relative bg-white">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/cadd-logo.png" alt="CADD Centre" className="h-14 w-auto object-contain mx-auto mb-4" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-base font-medium">Please enter your details to sign in.</p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200">
                  <ShieldCheck className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-gray-700 block">Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === "email" ? "text-red-600" : "text-gray-400"}`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@cadd.edu"
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full h-14 pl-12 pr-4 rounded-xl text-gray-900 placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                  style={{
                    border: focusedField === "email" ? "2px solid #e31e24" : "2px solid transparent",
                    boxShadow: focusedField === "email" ? "0 4px 14px rgba(227,30,36,0.1)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-bold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === "password" ? "text-red-600" : "text-gray-400"}`} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-14 pl-12 pr-12 rounded-xl text-gray-900 placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                  style={{
                    border: focusedField === "password" ? "2px solid #e31e24" : "2px solid transparent",
                    boxShadow: focusedField === "password" ? "0 4px 14px rgba(227,30,36,0.1)" : "none",
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors rounded-lg">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full h-14 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-200 relative overflow-hidden mt-6 bg-[#e31e24] hover:bg-[#c2181d] shadow-[0_8px_20px_rgba(227,30,36,0.25)] hover:shadow-[0_12px_24px_rgba(227,30,36,0.35)]"
            >
              {/* Shimmer overlay */}
              {!isLoading && (
                <motion.div className="absolute inset-0 -translate-x-full"
                  animate={{ translateX: ["−100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />
              )}
              {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Don't have an account?{" "}
              <Link href="/contact" className="text-[#e31e24] font-bold hover:underline underline-offset-4">
                Enroll Now
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
