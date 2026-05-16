"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle, Clock, ChevronDown, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field-error"
import { sanitizeName, isValidName, isValidEmail } from "@/lib/validation"

const fadeIn = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

const FAQS = [
  { q: "How do I enroll in a course?", a: "You can enroll directly through our student portal or by visiting any of our branch locations. Our academic advisors will guide you through the process." },
  { q: "Are your certificates internationally recognized?", a: "Yes, our Master and Expert level certificates are globally recognized and highly valued by employers in the design and engineering sectors." },
  { q: "Do you offer placement assistance?", a: "Absolutely. We have a dedicated career services team that helps our top-performing students connect with leading companies in the industry." },
  { q: "Can I pay in installments?", a: "Yes, we offer flexible payment plans for all our long-term programs. Contact our finance team for details." }
]

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  // Active day calculation for Office Hours
  const today = new Date().getDay()
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Real-time validation
  const fieldErrors: Record<string, string> = {}
  if (touched.name && !formState.name.trim()) {
    fieldErrors.name = "Name is required"
  } else if (touched.name && formState.name.trim() && !isValidName(formState.name)) {
    fieldErrors.name = "Name can only contain letters, spaces, and hyphens"
  }
  if (touched.email && !formState.email.trim()) {
    fieldErrors.email = "Email is required"
  } else if (touched.email && formState.email.trim() && !isValidEmail(formState.email)) {
    fieldErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (touched.subject && !formState.subject.trim()) {
    fieldErrors.subject = "Subject is required"
  }
  if (touched.message && !formState.message.trim()) {
    fieldErrors.message = "Message is required"
  }

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const handleNameChange = (value: string) => {
    setFormState({ ...formState, name: sanitizeName(value) })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all touched
    setTouched({ name: true, email: true, subject: true, message: true })

    // Final validation
    if (!formState.name.trim() || !isValidName(formState.name)) return
    if (!formState.email.trim() || !isValidEmail(formState.email)) return
    if (!formState.subject.trim() || !formState.message.trim()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 5000)
      setFormState({ name: "", email: "", subject: "", message: "" })
      setTouched({})
    }, 1500)
  }

  const inputBaseClass = "w-full bg-[#F8FAFC] border rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-[#0F172A]"
  const errorInputClass = "border-red-400 focus:ring-red-400/20 focus:border-red-400"
  const normalInputClass = "border-gray-200"

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 bg-gradient-to-b from-[#F0F6FA] to-[#F8FAFC] overflow-hidden border-b border-gray-100">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-200/40 blur-[100px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-cyan-200/40 blur-[80px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        
        {/* Floating animated icon */}
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-24 right-20 hidden lg:flex items-center justify-center w-24 h-24 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-white">
           <MessageCircle className="w-10 h-10 text-blue-500" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-sm font-bold tracking-widest uppercase px-5 py-2 rounded-full mb-6 shadow-sm">
              We're Here to Help
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] mb-6 tracking-tight">Let's start a <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Conversation</span></h1>
            <p className="text-lg text-[#475569] mb-8 font-medium">Whether you have a question about our programs, pricing, or anything else, our team is ready to answer all your questions.</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── CONTACT FORM (LEFT) ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:w-3/5">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white relative overflow-hidden">
              <h2 className="text-3xl font-black text-[#0F172A] mb-8">Send us a message</h2>
              
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center py-16 text-center h-[400px]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <h3 className="text-3xl font-black text-[#0F172A] mb-2">Message Sent!</h3>
                    <p className="text-[#475569] text-lg">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  </motion.div>
                ) : (
                  <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                        <input
                          required
                          type="text"
                          value={formState.name}
                          onChange={e => handleNameChange(e.target.value)}
                          onBlur={() => handleBlur("name")}
                          className={`${inputBaseClass} ${fieldErrors.name ? errorInputClass : normalInputClass}`}
                          placeholder="John Doe"
                        />
                        <FieldError message={fieldErrors.name} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                        <input
                          required
                          type="email"
                          value={formState.email}
                          onChange={e => setFormState({...formState, email: e.target.value})}
                          onBlur={() => handleBlur("email")}
                          className={`${inputBaseClass} ${fieldErrors.email ? errorInputClass : normalInputClass}`}
                          placeholder="john@example.com"
                        />
                        <FieldError message={fieldErrors.email} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                      <input
                        required
                        type="text"
                        value={formState.subject}
                        onChange={e => setFormState({...formState, subject: e.target.value})}
                        onBlur={() => handleBlur("subject")}
                        className={`${inputBaseClass} ${fieldErrors.subject ? errorInputClass : normalInputClass}`}
                        placeholder="How can we help?"
                      />
                      <FieldError message={fieldErrors.subject} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                      <textarea
                        required
                        rows={5}
                        value={formState.message}
                        onChange={e => setFormState({...formState, message: e.target.value})}
                        onBlur={() => handleBlur("message")}
                        className={`${inputBaseClass} resize-none ${fieldErrors.message ? errorInputClass : normalInputClass}`}
                        placeholder="Tell us more about your inquiry..."
                      />
                      <FieldError message={fieldErrors.message} />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all duration-300 group">
                      {isSubmitting ? (
                        <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</div>
                      ) : (
                        <div className="flex items-center gap-2">Send Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></div>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── INFO & HOURS CARDS (RIGHT) ──────────────────────────── */}
          <div className="lg:w-2/5 space-y-6">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 group hover:shadow-[0_20px_50px_rgba(37,99,235,0.06)] transition-all duration-500">
              <h3 className="text-xl font-black text-[#0F172A] mb-6">Contact Information</h3>
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Phone className="w-5 h-5 text-blue-600" /></div>
                    <div>
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                       <p className="text-lg font-bold text-[#0F172A]">+94 11 234 5678</p>
                       <p className="text-gray-500 text-sm">Mon-Fri from 8am to 6pm</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                    <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Mail className="w-5 h-5 text-cyan-600" /></div>
                    <div>
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                       <p className="text-lg font-bold text-[#0F172A]">hello@scholar-sync.edu</p>
                       <p className="text-gray-500 text-sm">We'll respond within 24h</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><MapPin className="w-5 h-5 text-purple-600" /></div>
                    <div>
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Headquarters</p>
                       <p className="text-lg font-bold text-[#0F172A]">No. 45, Galle Road</p>
                       <p className="text-gray-500 text-sm">Colombo 03, Sri Lanka</p>
                    </div>
                 </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="relative bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.3)] overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[30px] rounded-full group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-black text-white flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Office Hours</h3>
                  </div>
                  <ul className="space-y-3">
                     {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, idx) => {
                        const isActive = day === days[today]
                        return (
                           <li key={day} className={`flex justify-between items-center text-sm ${isActive ? 'text-white font-bold bg-white/10 px-3 py-2 rounded-lg' : 'text-gray-400 px-3 py-1'}`}>
                              <span>{day}</span>
                              <span>08:00 AM - 06:00 PM</span>
                           </li>
                        )
                     })}
                     <li className={`flex justify-between items-center text-sm mt-4 pt-4 border-t border-white/10 ${days[today] === 'Saturday' || days[today] === 'Sunday' ? 'text-white font-bold' : 'text-gray-500'}`}>
                        <span>Weekend</span>
                        <span>Closed</span>
                     </li>
                  </ul>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── MAP EMBED ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
         <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 bg-white p-2">
            <div className="rounded-[2.5rem] overflow-hidden w-full h-[400px] relative group">
               <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
               {/* Replace with actual map embed, using a styled iframe placeholder */}
               <iframe 
                  src="https://maps.google.com/maps?q=Colombo%2003,%20Sri%20Lanka&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: 'contrast(1.1) opacity(0.9) grayscale(0.2)' }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="group-hover:scale-105 transition-transform duration-1000 ease-out"
               ></iframe>
            </div>
         </motion.div>
      </section>

      {/* ── FAQ ACCORDION ─────────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
         <div className="text-center mb-12">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Got Questions?</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A]">Frequently Asked Questions</h2>
         </div>
         <div className="space-y-4">
            {FAQS.map((faq, i) => (
               <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none">
                     <span className="font-bold text-[#0F172A] pr-4">{faq.q}</span>
                     <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                     {activeFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                           <div className="px-6 pb-5 pt-0 text-[#475569] leading-relaxed">
                              {faq.a}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
            ))}
         </div>
      </section>

      {/* ── FLOATING CTAs ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
         <motion.a initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }} href="https://wa.me/94112345678" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-110 transition-all duration-300">
            <MessageCircle className="w-7 h-7" />
         </motion.a>
         <motion.a initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }} href="tel:+94112345678" className="md:hidden w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-110 transition-all duration-300">
            <PhoneCall className="w-6 h-6" />
         </motion.a>
      </div>
    </div>
  )
}
