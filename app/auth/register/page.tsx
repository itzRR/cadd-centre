"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, Phone, BookOpen, ArrowRight, Sparkles, GraduationCap, Award, CheckCircle2 } from "lucide-react"
import { FieldError } from "@/components/ui/field-error"
import { signUp } from "@/lib/auth"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone, getPasswordStrength } from "@/lib/validation"

const perks = [
  { icon: GraduationCap, text: "Courses from industry experts" },
  { icon: Award,         text: "Earn recognised certifications" },
  { icon: CheckCircle2,  text: "Lifetime access to materials" },
]

export default function RegisterPage() {
  const [fullName, setFullName]           = useState("")
  const [email, setEmail]                 = useState("")
  const [phone, setPhone]                 = useState("")
  const [education, setEducation]         = useState("")
  const [password, setPassword]           = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword]   = useState(false)
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState("")
  const [success, setSuccess]             = useState("")
  const [touched, setTouched]             = useState<Record<string, boolean>>({})
  const [focusedField, setFocusedField]   = useState<string | null>(null)
  const router = useRouter()

  // Real-time field errors
  const fieldErrors: Record<string, string> = {}
  if (touched.fullName && fullName.trim() && !isValidName(fullName))
    fieldErrors.fullName = "Name can only contain letters, spaces, and hyphens"
  if (touched.fullName && !fullName.trim())
    fieldErrors.fullName = "Full name is required"
  if (touched.email && email.trim() && !isValidEmail(email))
    fieldErrors.email = "Please enter a valid email (e.g. name@example.com)"
  if (touched.email && !email.trim())
    fieldErrors.email = "Email is required"
  if (touched.phone && phone.trim() && !isValidSriLankanPhone(phone))
    fieldErrors.phone = "Enter a valid Sri Lankan number (e.g. 071 234 5678)"
  if (touched.password && password && password.length < 8)
    fieldErrors.password = "Password must be at least 8 characters"
  if (touched.confirmPassword && confirmPassword && confirmPassword !== password)
    fieldErrors.confirmPassword = "Passwords do not match"

  const passwordStrength = password ? getPasswordStrength(password) : null
  const handleBlur  = (field: string) => setTouched(p => ({ ...p, [field]: true }))
  const handleFocus = (field: string) => setFocusedField(field)
  const handleBlurField = (field: string) => { handleBlur(field); setFocusedField(null) }

  const handleNameChange  = (value: string) => setFullName(sanitizeName(value))
  const handlePhoneChange = (value: string) => setPhone(formatSriLankanPhone(value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setSuccess("")
    setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true })
    if (!fullName.trim())                               { setError("Full name is required"); return }
    if (!isValidName(fullName))                         { setError("Name can only contain letters, spaces, and hyphens"); return }
    if (!isValidEmail(email))                           { setError("Please enter a valid email address"); return }
    if (phone.trim() && !isValidSriLankanPhone(phone))  { setError("Please enter a valid Sri Lankan phone number"); return }
    if (password.length < 8)                            { setError("Password must be at least 8 characters"); return }
    if (password !== confirmPassword)                   { setError("Passwords do not match"); return }

    setIsLoading(true)
    const { user, error: authError } = await signUp(email, password, fullName)
    setIsLoading(false)
    if (authError) { setError(authError); return }
    if (user) {
      setSuccess("Account created! Please check your email to verify, then sign in.")
      setTimeout(() => router.push("/auth/login"), 3000)
    }
  }

  const inputStyle = (field: string, hasError?: boolean) => ({
    background: "rgba(255,255,255,0.05)",
    border: hasError
      ? "1px solid rgba(239,68,68,0.5)"
      : focusedField === field
        ? "1px solid rgba(59,130,246,0.5)"
        : "1px solid rgba(255,255,255,0.08)",
    boxShadow: hasError
      ? "0 0 0 3px rgba(239,68,68,0.1)"
      : focusedField === field
        ? "0 0 0 3px rgba(59,130,246,0.1)"
        : "none",
  })

  const inputCls = "w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1635 50%, #0a1628 100%)" }}>

      {/* ── Animated background orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ── Left Panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <img src="/cadd-logo.png" alt="CADD Centre" className="h-12 w-auto object-contain brightness-200" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-0.5 bg-blue-400" />
              <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em]">Join CADD Centre</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Start Your
              <span className="block bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                Journey Now
              </span>
            </h2>
            <p className="text-white/50 text-lg mt-5 leading-relaxed max-w-sm">
              Create your free account and get instant access to hundreds of professional CAD courses.
            </p>
          </div>
          <div className="space-y-4">
            {perks.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/70 font-medium">{p.text}</span>
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
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/cadd-logo.png" alt="CADD Centre" className="h-12 w-auto object-contain brightness-200 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-white">CADD Centre</h1>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-transparent to-indigo-500/20" />
            <div className="relative rounded-[2rem] p-8 space-y-5"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Free access</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
                <p className="text-white/40 text-sm">Join thousands of learners today</p>
              </div>

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="fullName" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Full Name *</label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "fullName" ? "text-blue-400" : "text-white/20"}`} />
                    <input id="fullName" type="text" placeholder="Your full name" value={fullName}
                      onChange={e => handleNameChange(e.target.value)}
                      onFocus={() => handleFocus("fullName")}
                      onBlur={() => handleBlurField("fullName")}
                      className={inputCls} style={inputStyle("fullName", !!fieldErrors.fullName)} required />
                  </div>
                  <FieldError message={fieldErrors.fullName} />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Email *</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "email" ? "text-blue-400" : "text-white/20"}`} />
                    <input id="email" type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => handleFocus("email")}
                      onBlur={() => handleBlurField("email")}
                      className={inputCls} style={inputStyle("email", !!fieldErrors.email)} required />
                  </div>
                  <FieldError message={fieldErrors.email} />
                </div>

                {/* Phone & Education row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Phone</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "phone" ? "text-blue-400" : "text-white/20"}`} />
                      <input id="phone" type="tel" placeholder="071 234 5678" value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        onFocus={() => handleFocus("phone")}
                        onBlur={() => handleBlurField("phone")}
                        className={inputCls} style={inputStyle("phone", !!fieldErrors.phone)} />
                    </div>
                    <FieldError message={fieldErrors.phone} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="education" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Education</label>
                    <div className="relative">
                      <BookOpen className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "education" ? "text-blue-400" : "text-white/20"}`} />
                      <input id="education" type="text" placeholder="A/L, Diploma…" value={education}
                        onChange={e => setEducation(e.target.value)}
                        onFocus={() => handleFocus("education")}
                        onBlur={() => setFocusedField(null)}
                        className={inputCls} style={inputStyle("education")} />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Password *</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "password" ? "text-blue-400" : "text-white/20"}`} />
                    <input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlurField("password")}
                      className={inputCls + " pr-12"} style={inputStyle("password", !!fieldErrors.password)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-lg">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.password} />
                  {/* Strength meter */}
                  {passwordStrength && password.length >= 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          className={`h-full rounded-full ${passwordStrength.score <= 1 ? "bg-red-500" : passwordStrength.score <= 2 ? "bg-yellow-500" : passwordStrength.score <= 3 ? "bg-blue-500" : "bg-emerald-500"}`} />
                      </div>
                      <span className={`text-xs font-bold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Confirm Password *</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "confirmPassword" ? "text-blue-400" : "text-white/20"}`} />
                    <input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => handleFocus("confirmPassword")}
                      onBlur={() => handleBlurField("confirmPassword")}
                      className={inputCls} style={inputStyle("confirmPassword", !!fieldErrors.confirmPassword)} required />
                  </div>
                  <FieldError message={fieldErrors.confirmPassword} />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden"
                  style={{
                    height: "52px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    boxShadow: "0 8px 32px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.2)",
                  }}>
                  {!isLoading && (
                    <motion.div className="absolute inset-0 -translate-x-full"
                      animate={{ translateX: ["−100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
                  )}
                  {isLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-white/30 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
