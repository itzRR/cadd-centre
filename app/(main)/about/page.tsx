"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Building2, Users, Award, BookOpen, Target, Heart, Shield, Lightbulb, ChevronRight, CheckCircle, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeIn = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

// Reusable Counter component
function AnimatedCounter({ value, label, prefix = "", suffix = "" }: { value: number, label: string, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView) {
      let start = 0
      const duration = 2000 // 2s
      const increment = value / (duration / 16) // 60fps
      
      const timer = setInterval(() => {
        start += increment
        if (start >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)
      return () => clearInterval(timer)
    }
  }, [value, isInView])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-[#0F172A] mb-2 font-mono tracking-tighter">
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{label}</div>
    </div>
  )
}

export default function AboutPage() {
  const { scrollYProgress } = useScroll()
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200])

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 bg-[#F8FAFC] border-b border-gray-100 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Shapes */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-[120px] rounded-full pointer-events-none" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 to-purple-200/30 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full flex flex-col lg:flex-row items-center gap-16">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex-1">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-sm font-bold tracking-widest uppercase px-5 py-2 rounded-full mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Our Story
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-[#0F172A] mb-8 tracking-tight leading-[1.05]">
              Empowering <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Minds</span> Since 2005.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-[#475569] mb-10 leading-relaxed font-medium max-w-xl">
              We are Sri Lanka's leading institute for technical software training, dedicated to transforming ambitions into industry-recognized expertise.
            </motion.p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }} className="flex-1 relative">
             <div className="relative w-full aspect-[4/3] rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-8 border-white/50 backdrop-blur-sm">
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071" alt="Students collaborating" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
             </div>
             
             <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center"><Building2 className="w-7 h-7 text-blue-600" /></div>
                <div><h4 className="text-2xl font-black text-[#0F172A]">18+</h4><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Years of Excellence</p></div>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── ANIMATED STATS ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white relative z-20 -mt-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-10 md:p-16 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-gray-100">
               <AnimatedCounter value={10000} label="Graduates" prefix="+" />
               <AnimatedCounter value={50} label="Expert Lecturers" prefix="+" />
               <AnimatedCounter value={15} label="Branch Network" />
               <AnimatedCounter value={98} label="Success Rate" suffix="%" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STORY PARALLAX ───────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 relative">
                 <motion.div style={{ y: y1 }} className="absolute -top-20 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-[80px] -z-10" />
                 <div className="relative rounded-[2rem] overflow-hidden h-[600px] shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070" alt="Office environment" className="w-full h-full object-cover" />
                 </div>
                 {/* Floating offset image */}
                 <motion.div style={{ y: y2 }} className="absolute -bottom-16 -right-16 w-64 h-64 rounded-3xl overflow-hidden border-8 border-white shadow-xl hidden md:block">
                    <img src="https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=2070" alt="Team meeting" className="w-full h-full object-cover" />
                 </motion.div>
              </div>
              
              <div className="flex-1">
                 <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">The Genesis</span>
                 <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-8 leading-tight">Bridging the gap between academia and industry.</h2>
                 
                 <div className="space-y-6 text-[#475569] text-lg leading-relaxed">
                    <p>Founded in 2005, CADD Centre Lanka began with a simple mission: to provide world-class technical software training that directly translates into real-world career success.</p>
                    <p>We saw a disconnect between theoretical university education and the practical, software-driven demands of the modern engineering and architectural workplace. We built our curriculum specifically to bridge that gap.</p>
                    <p>Today, we are proud to be the premier training institution for BIM, CAD, and Project Management, holding ISO certification and maintaining a network of successful alumni across the globe.</p>
                 </div>
                 
                 <div className="mt-10 flex gap-4">
                    <div className="flex items-center gap-2 text-[#0F172A] font-bold"><CheckCircle className="w-5 h-5 text-green-500" /> ISO 9001:2015</div>
                    <div className="flex items-center gap-2 text-[#0F172A] font-bold"><CheckCircle className="w-5 h-5 text-blue-500" /> Global Partners</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ── VISION & MISSION ──────────────────────────────────────── */}
      <section className="py-32 px-4 bg-[#F8FAFC]">
         <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="group bg-white p-12 rounded-[3rem] border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-[0_20px_50px_rgba(37,99,235,0.05)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                     <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-black text-[#0F172A] mb-4">Our Mission</h3>
                  <p className="text-[#475569] text-lg leading-relaxed relative z-10">To provide high-quality, industry-relevant training and certification that empowers individuals to excel in design, engineering, and management fields globally.</p>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="group bg-white p-12 rounded-[3rem] border border-gray-100 hover:border-cyan-200 shadow-sm hover:shadow-[0_20px_50px_rgba(6,182,212,0.05)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                  <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                     <Lightbulb className="w-8 h-8 text-cyan-600" />
                  </div>
                  <h3 className="text-3xl font-black text-[#0F172A] mb-4">Our Vision</h3>
                  <p className="text-[#475569] text-lg leading-relaxed relative z-10">To be the most trusted and universally recognized institution for technical skill development, setting the benchmark for professional education in Sri Lanka.</p>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ── CORE VALUES ───────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white">
         <div className="max-w-7xl mx-auto text-center">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Our Principles</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-16">Core Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { icon: Award, title: "Excellence", desc: "We strive for the highest standards in everything we do, from curriculum design to student support." },
                  { icon: Users, title: "Student Success", desc: "Our ultimate measure of success is the career progression and achievements of our alumni." },
                  { icon: Shield, title: "Integrity", desc: "We conduct our business and educational practices with absolute honesty and transparency." }
               ].map((v, i) => (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="bg-[#F8FAFC] p-10 rounded-[2.5rem] text-center group hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2">
                     <div className="w-20 h-20 mx-auto bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <v.icon className="w-8 h-8 text-blue-600" />
                     </div>
                     <h4 className="text-xl font-black text-[#0F172A] mb-4">{v.title}</h4>
                     <p className="text-[#475569] leading-relaxed">{v.desc}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-[#0F172A] text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
         <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-20">
               <span className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-4 block">Our Journey</span>
               <h2 className="text-4xl md:text-5xl font-black mb-6">Milestones</h2>
            </div>
            
            <div className="relative border-l-2 border-white/10 ml-6 md:ml-0 md:pl-0 md:mx-auto md:w-full md:flex md:flex-col items-center">
               {[
                  { year: "2005", title: "Foundation", desc: "Established the first training center in Colombo with a focus on AutoCAD." },
                  { year: "2010", title: "Expansion", desc: "Opened 5 new branches and introduced Project Management courses." },
                  { year: "2015", title: "ISO Certification", desc: "Awarded ISO 9001:2015 for quality management in education." },
                  { year: "2020", title: "Digital Shift", desc: "Launched online learning portal to support hybrid education models." },
                  { year: "2025", title: "Global Reach", desc: "Introduced internationally accredited BIM Master Programs." }
               ].map((item, i) => (
                  <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} key={i} className={`relative pl-8 md:pl-0 mb-12 md:w-1/2 ${i % 2 === 0 ? 'md:pr-16 md:self-start md:text-right' : 'md:pl-16 md:self-end md:text-left'}`}>
                     <div className={`absolute top-0 md:top-2 w-5 h-5 rounded-full bg-blue-500 border-4 border-[#0F172A] shadow-[0_0_0_4px_rgba(59,130,246,0.2)] ${i % 2 === 0 ? '-left-[11px] md:-right-[11px] md:left-auto' : '-left-[11px]'}`}>
                        <div className="w-full h-full bg-blue-400 rounded-full animate-ping opacity-50" />
                     </div>
                     <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">{item.year}</h3>
                     <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                     <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
               ))}
               {/* Center line for desktop */}
               <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/10 -z-10" />
            </div>
         </div>
      </section>

      {/* ── INSTRUCTORS ───────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
               <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Our Experts</span>
               <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-6">Learn from Industry Leaders</h2>
               <p className="text-[#475569] max-w-2xl mx-auto text-lg">Our instructors are active professionals who bring real-world project experience directly into the classroom.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                  { name: "Hiruni Piumika", role: "Academic Head", img: "/hiruni.webp", cred: "BSc in Information Technology" },
                  { name: "Albus Dambadeniya", role: "Senior CAD Instructor", img: "/albus.webp", cred: "Autodesk Certified Professional" },
                  { name: "Sanduni Gunathilake", role: "Technical Lead", img: "/sanduni.webp", cred: "Lecturer in Computing" },
                  { name: "Harry Poththage", role: "MEP Specialist", img: "/harry.webp", cred: "M.Sc. Engineering" }
               ].map((inst, i) => (
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="group relative rounded-[2rem] overflow-hidden bg-[#F8FAFC] border border-gray-100">
                     <div className="aspect-[4/5] overflow-hidden relative">
                        <img src={inst.img} alt={inst.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                        
                        {/* Hover Reveal Content */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                           <h4 className="text-2xl font-black text-white mb-1">{inst.name}</h4>
                           <p className="text-blue-300 font-bold text-sm mb-3">{inst.role}</p>
                           
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                              <p className="text-gray-300 text-sm mb-4">{inst.cred}</p>
                              <div className="flex gap-3">
                                 <a href="#" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-blue-600 transition-colors"><Linkedin className="w-4 h-4" /></a>
                                 <a href="#" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-blue-400 transition-colors"><Twitter className="w-4 h-4" /></a>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>
    </div>
  )
}
