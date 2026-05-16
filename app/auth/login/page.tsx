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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1635 50%, #0a1628 100%)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1635 50%, #0a1628 100%)" }}>

      {/* ── Animated background orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <img src="/cadd-logo.png" alt="CADD Centre" className="h-12 w-auto object-contain brightness-200" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-0.5 bg-blue-400" />
              <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em]">CADD Centre</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Design Your
              <span className="block bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                Future Today
              </span>
            </h2>
            <p className="text-white/50 text-lg mt-5 leading-relaxed max-w-sm">
              Join thousands of students mastering world-class CAD skills through our premium education platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/70 font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-white/20 text-sm">
          © {new Date().getFullYear()} CADD Centre Lanka. All rights reserved.
        </motion.p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/cadd-logo.png" alt="CADD Centre" className="h-12 w-auto object-contain brightness-200 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-white">CADD Centre</h1>
          </div>

          {/* Card */}
          <div className="relative">
            {/* Glow border */}
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-transparent to-indigo-500/20" />
            <div className="relative rounded-[2rem] p-8 space-y-6"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Welcome back</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Sign In</h2>
                <p className="text-white/40 text-sm">Access your learning dashboard</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Email Address</label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "email" ? "text-blue-400" : "text-white/20"}`} />
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
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: focusedField === "email" ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: focusedField === "email" ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "password" ? "text-blue-400" : "text-white/20"}`} />
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
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: focusedField === "password" ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: focusedField === "password" ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-lg">
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
                  className="w-full h-13 rounded-xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden mt-2"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    boxShadow: "0 8px 32px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.2)",
                    height: "52px",
                  }}>
                  {/* Shimmer */}
                  {!isLoading && (
                    <motion.div className="absolute inset-0 -translate-x-full"
                      animate={{ translateX: ["−100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
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
              <p className="text-center text-white/30 text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
