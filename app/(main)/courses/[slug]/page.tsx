"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Clock, BookOpen, CheckCircle, Lock,
  Layers, Award, GraduationCap, X, User, Mail, Phone,
  Sparkles, MessageCircle, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FieldError } from "@/components/ui/field-error"
import { getCourseBySlug } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone } from "@/lib/validation"
import { supabase } from "@/lib/supabase"
import type { Course } from "@/types"

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Enquiry modal state
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [education, setEducation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getCourseBySlug(slug).then(c => { setCourse(c); setIsLoading(false) })
  }, [slug])

  // Validation
  const fieldErrors: Record<string, string> = {}
  if (touched.fullName && !fullName.trim()) fieldErrors.fullName = "Full name is required"
  else if (touched.fullName && fullName.trim() && !isValidName(fullName)) fieldErrors.fullName = "Name can only contain letters, spaces, and hyphens"
  if (touched.email && email.trim() && !isValidEmail(email)) fieldErrors.email = "Please enter a valid email"
  if (touched.phone && phone.trim() && !isValidSriLankanPhone(phone)) fieldErrors.phone = "Enter a valid number (e.g. 071 234 5678)"

  const handleBlur = (field: string) => setTouched(p => ({ ...p, [field]: true }))

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setTouched({ fullName: true, email: true, phone: true })
    if (!fullName.trim() || !isValidName(fullName)) return
    if (email.trim() && !isValidEmail(email)) return
    if (phone.trim() && !isValidSriLankanPhone(phone)) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from("marketing_leads").insert({
        name: fullName.trim(),
        email: email.trim() || null,
        contact: phone.trim() || null,
        source: "Website – Course Page",
        course_interested: course?.title || "Unknown",
        status: "New",
        notes: education ? `Education: ${education}` : null,
      })
      if (error) throw error
      setSubmitSuccess(true)
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFullName(""); setEmail(""); setPhone(""); setEducation("")
    setTouched({}); setSubmitError(""); setSubmitSuccess(false)
    setShowEnquiry(false)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Course not found</p>
        <Button asChild variant="outline"><Link href="/courses">Back to Courses</Link></Button>
      </div>
    </div>
  )

  const levelColor =
    course.level === "Expert Certificate"   ? "bg-purple-100 text-purple-800" :
    course.level === "Master Certificate"   ? "bg-blue-100 text-blue-800" :
                                              "bg-green-100 text-green-800"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1A2F] to-[#0D2340] text-white pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/courses" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Courses
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={levelColor}>{course.level}</Badge>
                <Badge className="bg-white/10 text-white border-white/20">{course.category}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-blue-200 text-lg mb-6">{course.short_description || course.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.total_hours} hours</span>
                <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" /> {course.modules?.length || 0} modules</span>
                <span className="flex items-center gap-1.5"><Award className="h-4 w-4" /> {course.level}</span>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="bg-white rounded-2xl p-6 text-gray-900 shadow-2xl self-start">
              {course.image_url && (
                <img src={course.image_url} alt={course.title} className="w-full h-36 object-cover rounded-xl mb-4" />
              )}
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(course.price)}</span>
                {course.original_price && (
                  <span className="text-gray-400 line-through ml-2">{formatCurrency(course.original_price)}</span>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-6"
                  onClick={() => setShowEnquiry(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Enroll Now
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Submit your details & our team will contact you
                </p>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> {course.total_hours} total hours</div>
                <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-gray-400" /> {course.modules?.length || 0} modules</div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gray-400" /> Certificate upon completion</div>
                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-gray-400" /> {course.level}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">About This Programme</h2>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          {/* Modules */}
          {course.modules && course.modules.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> Course Modules
              </h2>
              <div className="space-y-4">
                {[...course.modules].sort((a: any, b: any) => a.order_index - b.order_index).map((mod: any, i: number) => (
                  <div key={mod.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                          {mod.description && <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>}
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 text-xs ml-3 flex-shrink-0">{mod.duration_hours}h</Badge>
                    </div>
                    {mod.topics && mod.topics.length > 0 && (
                      <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-1">
                        {mod.topics.map((topic: string) => (
                          <div key={topic} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" /> What You Get
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Practical & theory training</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Module-wise progress tracking</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Access to BIM tutorials & guides</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Module tests & final evaluation</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> QR-verified certificate</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">Need more info?</h3>
            <p className="text-sm text-blue-700 mb-4">Contact CADD Centre Lanka for batch schedules and registration assistance.</p>
            <Button asChild variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── ENQUIRY MODAL ── */}
      <AnimatePresence>
        {showEnquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,15,30,0.7)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative"
            >
              {submitSuccess ? (
                /* ── SUCCESS STATE ── */
                <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Thank You!</h2>
                  <p className="text-white/60 mb-4">Your enquiry for <span className="text-blue-400 font-semibold">{course.title}</span> has been submitted.</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-white/80 font-semibold text-sm">What happens next?</span>
                    </div>
                    <p className="text-white/50 text-sm">Our team will contact you shortly with course details, fees, and batch schedules.</p>
                  </div>
                  <button onClick={resetForm} className="text-blue-400 font-semibold hover:text-blue-300 text-sm">Close</button>
                </div>
              ) : (
                /* ── FORM ── */
                <div className="rounded-2xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Course Enquiry</span>
                      </div>
                      <h2 className="text-2xl font-black text-white">Get Started</h2>
                      <p className="text-white/40 text-sm">Submit details for <span className="text-blue-400 font-medium">{course.title}</span></p>
                    </div>
                    <button onClick={resetForm} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitEnquiry} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input type="text" placeholder="Your full name" value={fullName}
                          onChange={e => setFullName(sanitizeName(e.target.value))}
                          onBlur={() => handleBlur("fullName")}
                          required
                          className="w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.05)", border: fieldErrors.fullName ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)" }}
                        />
                      </div>
                      <FieldError message={fieldErrors.fullName} />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input type="email" placeholder="you@example.com" value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={() => handleBlur("email")}
                          className="w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.05)", border: fieldErrors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)" }}
                        />
                      </div>
                      <FieldError message={fieldErrors.email} />
                    </div>

                    {/* Phone & Education */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input type="tel" placeholder="071 234 5678" value={phone}
                            onChange={e => setPhone(formatSriLankanPhone(e.target.value))}
                            onBlur={() => handleBlur("phone")}
                            required
                            className="w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.05)", border: fieldErrors.phone ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)" }}
                          />
                        </div>
                        <FieldError message={fieldErrors.phone} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Education</label>
                        <div className="relative">
                          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input type="text" placeholder="A/L, Diploma…" value={education}
                            onChange={e => setEducation(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Course (read-only) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Course</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <div className="w-full h-12 pl-11 pr-4 rounded-xl text-blue-400 text-sm font-semibold flex items-center"
                          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                          {course.title}
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.01 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden"
                      style={{
                        height: "52px",
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        boxShadow: "0 8px 32px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.2)",
                      }}
                    >
                      {submitting ? (
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
                    <Link href="/auth/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in</Link>
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
