"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, BookOpen, GraduationCap, Award } from "lucide-react"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#FAFAFA] selection:bg-red-200 selection:text-red-900">

      {/* ── Animated background orbs (Red/White theme) ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(227,30,36,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(227,30,36,0.04) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(227,30,36,0.03) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 relative z-10 bg-white border-r border-gray-100 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <img src="/cadd-logo.png" alt="CADD Centre" className="h-14 w-auto object-contain" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-0.5 bg-red-600" />
              <span className="text-red-600 text-xs font-bold uppercase tracking-[0.3em]">CADD Centre</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Design Your
              <span className="block bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent mt-1">
                Future Today
              </span>
            </h2>
            <p className="text-gray-500 text-lg mt-5 leading-relaxed max-w-sm">
              Join thousands of students mastering world-class CAD skills through our premium education platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-gray-700 font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-gray-400 text-sm font-medium">
          © {new Date().getFullYear()} CADD Centre Lanka. All rights reserved.
        </motion.p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/cadd-logo.png" alt="CADD Centre" className="h-12 w-auto object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-black text-gray-900">CADD Centre</h1>
          </div>

          {/* Card */}
          <div className="relative">
            {/* Soft subtle shadow backplate */}
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-red-200/50 via-transparent to-red-100/30 blur-sm" />
            <div className="relative rounded-[2rem] p-8 space-y-6 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-red-900/5">

              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-red-600 text-xs font-bold uppercase tracking-widest">Welcome back</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sign In</h2>
                <p className="text-gray-500 text-sm font-medium">Access your learning dashboard</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Email Address</label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "email" ? "text-red-600" : "text-gray-400"}`} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      autoFocus
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-medium outline-none transition-all duration-200 bg-gray-50/50"
                      style={{
                        border: focusedField === "email" ? "1px solid rgba(227,30,36,0.4)" : "1px solid rgba(0,0,0,0.06)",
                        boxShadow: focusedField === "email" ? "0 0 0 4px rgba(227,30,36,0.1)" : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "password" ? "text-red-600" : "text-gray-400"}`} />
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
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-medium outline-none transition-all duration-200 bg-gray-50/50"
                      style={{
                        border: focusedField === "password" ? "1px solid rgba(227,30,36,0.4)" : "1px solid rgba(0,0,0,0.06)",
                        boxShadow: focusedField === "password" ? "0 0 0 4px rgba(227,30,36,0.1)" : "none",
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-lg">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden mt-4"
                  style={{
                    background: "linear-gradient(135deg, #e31e24 0%, #c2181d 100%)",
                    boxShadow: "0 8px 24px rgba(227,30,36,0.25), 0 2px 8px rgba(227,30,36,0.15)",
                    height: "52px",
                  }}>
                  {/* Shimmer */}
                  {!isLoading && (
                    <motion.div className="absolute inset-0 -translate-x-full"
                      animate={{ translateX: ["−100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />
                  )}
                  {isLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer link */}
              <p className="text-center text-gray-500 text-sm font-medium">
                New student?{" "}
                <Link href="/contact" className="text-red-600 font-bold hover:text-red-500 transition-colors">
                  Contact us to enroll
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
