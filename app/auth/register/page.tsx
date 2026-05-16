"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, User, Phone, BookOpen, ArrowRight, Sparkles, GraduationCap, Award, CheckCircle2, MessageCircle } from "lucide-react"
import { FieldError } from "@/components/ui/field-error"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone } from "@/lib/validation"
import { supabase } from "@/lib/supabase"

const perks = [
  { icon: GraduationCap, text: "Courses from industry experts" },
  { icon: Award,         text: "Earn recognised certifications" },
  { icon: CheckCircle2,  text: "Lifetime access to materials" },
]

const COURSES = ["AutoCAD", "SolidWorks", "3ds Max", "Revit", "CATIA", "BIM (Full Course)", "Navisworks", "Photoshop", "Other"]

export default function RegisterPage() {
  const [fullName, setFullName]           = useState("")
  const [email, setEmail]                 = useState("")
  const [phone, setPhone]                 = useState("")
  const [education, setEducation]         = useState("")
  const [courseInterested, setCourseInterested] = useState("AutoCAD")
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState("")
  const [success, setSuccess]             = useState(false)
  const [touched, setTouched]             = useState<Record<string, boolean>>({})
  const [focusedField, setFocusedField]   = useState<string | null>(null)

  // Real-time field errors
  const fieldErrors: Record<string, string> = {}
  if (touched.fullName && fullName.trim() && !isValidName(fullName))
    fieldErrors.fullName = "Name can only contain letters, spaces, and hyphens"
  if (touched.fullName && !fullName.trim())
    fieldErrors.fullName = "Full name is required"
  if (touched.email && email.trim() && !isValidEmail(email))
    fieldErrors.email = "Please enter a valid email (e.g. name@example.com)"
  if (touched.phone && phone.trim() && !isValidSriLankanPhone(phone))
    fieldErrors.phone = "Enter a valid Sri Lankan number (e.g. 071 234 5678)"

  const handleBlur  = (field: string) => setTouched(p => ({ ...p, [field]: true }))
  const handleFocus = (field: string) => setFocusedField(field)
  const handleBlurField = (field: string) => { handleBlur(field); setFocusedField(null) }

  const handleNameChange  = (value: string) => setFullName(sanitizeName(value))
  const handlePhoneChange = (value: string) => setPhone(formatSriLankanPhone(value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched({ fullName: true, email: true, phone: true })
    if (!fullName.trim())                               { setError("Full name is required"); return }
    if (!isValidName(fullName))                         { setError("Name can only contain letters, spaces, and hyphens"); return }
    if (email.trim() && !isValidEmail(email))           { setError("Please enter a valid email address"); return }
    if (phone.trim() && !isValidSriLankanPhone(phone))  { setError("Please enter a valid Sri Lankan phone number"); return }

    setIsLoading(true)
    try {
      // Submit as marketing lead with source = "Website"
      const { error: insertError } = await supabase.from("marketing_leads").insert({
        name: fullName.trim(),
        email: email.trim() || null,
        contact: phone.trim() || null,
        source: "Website",
        course_interested: courseInterested,
        status: "New",
        notes: education ? `Education: ${education}` : null,
      })
      if (insertError) throw insertError
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
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

  // SUCCESS STATE
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1635 50%, #0a1628 100%)" }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Thank You!</h2>
          <p className="text-white/60 text-lg mb-4">Your enquiry has been submitted successfully.</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-white/90 font-semibold">What happens next?</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Our team at <span className="text-blue-400 font-semibold">CADD Centre Lanka</span> will contact you shortly with course details, fees, and enrollment options.
            </p>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 text-sm font-medium">📞 Contact us directly:</p>
              <p className="text-white/70 text-sm mt-1">+94 XX XXX XXXX</p>
            </div>
          </div>
          <Link href="/" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors text-sm">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    )
  }

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
              <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em]">Begin Your Journey</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Enquire
              <span className="block bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                About Courses
              </span>
            </h2>
            <p className="text-white/50 text-lg mt-5 leading-relaxed max-w-sm">
              Submit your details and our team will reach out with course information, fees, and batch schedules.
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
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Course Enquiry</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Get Started</h2>
                <p className="text-white/40 text-sm">Submit your details & we'll contact you</p>
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
                  <label htmlFor="email" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "email" ? "text-blue-400" : "text-white/20"}`} />
                    <input id="email" type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => handleFocus("email")}
                      onBlur={() => handleBlurField("email")}
                      className={inputCls} style={inputStyle("email", !!fieldErrors.email)} />
                  </div>
                  <FieldError message={fieldErrors.email} />
                </div>

                {/* Phone & Course row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Phone *</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "phone" ? "text-blue-400" : "text-white/20"}`} />
                      <input id="phone" type="tel" placeholder="071 234 5678" value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        onFocus={() => handleFocus("phone")}
                        onBlur={() => handleBlurField("phone")}
                        className={inputCls} style={inputStyle("phone", !!fieldErrors.phone)} required />
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

                {/* Course Interested */}
                <div className="space-y-1">
                  <label htmlFor="courseInterested" className="text-xs font-bold text-white/40 uppercase tracking-widest block">Course Interested *</label>
                  <div className="relative">
                    <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "courseInterested" ? "text-blue-400" : "text-white/20"}`} />
                    <select id="courseInterested" value={courseInterested}
                      onChange={e => setCourseInterested(e.target.value)}
                      onFocus={() => handleFocus("courseInterested")}
                      onBlur={() => setFocusedField(null)}
                      className={inputCls + " appearance-none cursor-pointer"} style={inputStyle("courseInterested")}>
                      {COURSES.map(c => <option key={c} value={c} style={{ background: "#1a1a2e", color: "#fff" }}>{c}</option>)}
                    </select>
                  </div>
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
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Enquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-white/30 text-sm">
                Already a student?{" "}
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
