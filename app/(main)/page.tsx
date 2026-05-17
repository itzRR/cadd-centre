"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight, BookOpen, Users, Award,
  Clock, Play, Star, TrendingUp,
  LayoutDashboard, MessageSquareQuote,
  CheckCircle2, Sparkles, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getFeaturedCourses } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import type { Course } from "@/types"

const fadeIn = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 150])
  const opacityFade = useTransform(scrollYProgress, [0, 1], [1, 0])

  useEffect(() => {
    getFeaturedCourses().then(setCourses).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFC] selection:bg-red-500/30 overflow-hidden font-sans">
      
      {/* ── BACKGROUND NOISE & GRADIENTS ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 mix-blend-overlay opacity-40" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-100/50 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-100/50 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12 z-10">
        <motion.div style={{ y: yParallax, opacity: opacityFade }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center gap-16">
          
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex-1 text-center lg:text-left z-20">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-gray-200 text-gray-800 text-xs font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Elevating Tech Education
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-6xl md:text-7xl lg:text-[6.5rem] font-black text-[#0F172A] mb-8 tracking-tighter leading-[0.95]">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-500 to-cyan-500">Your Future</span><br />
              In Design & Tech
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-[#475569] max-w-2xl mx-auto lg:mx-0 mb-10 font-medium leading-relaxed">
              Award-winning training in BIM, CAD, and Project Management. Join thousands of alumni building the modern world.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button asChild size="lg" className="bg-[#0F172A] hover:bg-black text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-8 h-14 text-base font-bold transition-all duration-300 hover:scale-105 border-0 group">
                <Link href="/courses">
                  Explore Programmes 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-red-600 rounded-full px-8 h-14 text-base font-bold transition-all duration-300 hover:scale-105 shadow-sm">
                <Link href="/contact">Talk to an Advisor</Link>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeIn} className="mt-16 flex items-center justify-center lg:justify-start gap-8 md:gap-12 opacity-80">
              <div className="flex flex-col items-start"><span className="text-3xl font-black text-gray-900 tracking-tight">10k+</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Graduates</span></div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="flex flex-col items-start"><span className="text-3xl font-black text-gray-900 tracking-tight">98%</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Success Rate</span></div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="flex flex-col items-start"><span className="text-3xl font-black text-gray-900 tracking-tight">ISO</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Certified</span></div>
            </motion.div>
          </motion.div>

          {/* Floating Hero UI Element */}
          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="flex-1 hidden lg:block relative z-20">
             
             {/* Main Glass Card */}
             <div className="relative z-20 bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.05)] border border-white/80 max-w-md ml-auto transform hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20"><Star className="w-6 h-6 fill-current" /></div>
                    <div><h4 className="font-bold text-gray-900 text-lg">Master in BIM</h4><p className="text-sm font-medium text-gray-500">Top Rated Course</p></div>
                  </div>
                  <Badge className="bg-red-50 text-red-600 border-none shadow-none font-bold">New</Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest"><span>Progress</span> <span>75%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest"><span>Placement Rate</span> <span>98%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" /></div>
                  </div>
                </div>

                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Student" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600 z-10">+2k</div>
                </div>
             </div>
             
             {/* Secondary floating card */}
             <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-10 -left-12 z-30 bg-white backdrop-blur-xl p-5 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center gap-4 group">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
                <div><h4 className="font-black text-gray-900 text-lg">+12% Salary</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Post-course average</p></div>
             </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CLIENTS / SUPPORTERS ───────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Trusted by Industry Leaders</p>
        </div>
        
        <div className="relative flex overflow-hidden group w-full">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="animate-marquee flex whitespace-nowrap hover:[animation-play-state:paused] items-center">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-16 md:gap-32 px-8 md:px-16">
                {[
                  "https://caddcentre.lk/wp-content/uploads/2024/06/1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/3-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/4-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/5-1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/7-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/8-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/10-1.jpg",
                ].map((src, index) => (
                  <img 
                    key={index} 
                    src={src} 
                    alt="Client Logo" 
                    className="h-12 md:h-16 w-auto object-contain flex-shrink-0 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 mix-blend-multiply" 
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM COURSES SECTION (Bento Style) ─────────────── */}
      <section className="py-32 px-4 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" /> Elite Programs
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-[#0F172A] tracking-tighter leading-tight">Master The Skills<br />That Matter.</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full px-8 h-12 md:h-14 border-gray-200 hover:border-gray-900 hover:text-white hover:bg-gray-900 transition-all duration-300 shadow-sm group">
              <Link href="/courses" className="font-bold">View All Catalog <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-[450px] bg-white rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />)
            ) : (
              courses.slice(0, 3).map((course, i) => (
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} key={course.id} className={i === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
                  <Link href={`/courses/${course.slug}`} className="group block bg-white rounded-[2rem] border border-gray-100 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
                    <div className={`${i === 0 ? "h-72 md:h-96" : "h-60"} rounded-[1.5rem] overflow-hidden relative`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                          <BookOpen className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <Badge className="bg-white/90 text-gray-900 border-none shadow-sm backdrop-blur-md uppercase tracking-widest text-[9px] font-black px-3 py-1">{course.level}</Badge>
                        {course.is_featured && <Badge className="bg-red-500 text-white border-none shadow-sm uppercase tracking-widest text-[9px] font-black px-3 py-1">Popular</Badge>}
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                         <span className="bg-white text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">View Details <ChevronRight className="w-4 h-4" /></span>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{course.category}</p>
                           <div className="flex items-center gap-1 text-amber-400"><Star className="w-3.5 h-3.5 fill-current"/><span className="text-xs font-bold text-gray-600">4.9</span></div>
                        </div>
                        <h3 className={`font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors leading-tight ${i === 0 ? "text-2xl md:text-3xl line-clamp-2" : "text-xl line-clamp-2"}`}>{course.title}</h3>
                      </div>
                      
                      <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Investment</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-gray-900">{formatCurrency(course.price)}</span>
                              {course.original_price && <span className="text-xs text-gray-400 line-through">{formatCurrency(course.original_price)}</span>}
                            </div>
                         </div>
                         <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                           <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg"><Clock className="w-3.5 h-3.5" /> {course.total_hours}h</span>
                         </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────── */}
      <section className="py-32 bg-white relative overflow-hidden border-y border-gray-100 z-20">
         <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
               
               {/* Left Content */}
               <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex-1 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-black uppercase tracking-widest mb-6">
                    <LayoutDashboard className="w-3 h-3" /> Platform
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight tracking-tighter">Engineered For<br />Student Success.</h2>
                  <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">Access your courses, track assignments, and collaborate with peers through our bespoke, award-winning student portal.</p>
                  
                  <div className="space-y-6 mb-10">
                     {[
                        { title: "Real-time Progress Tracking", desc: "Monitor your attendance and grades effortlessly." },
                        { title: "Verifiable Certificates", desc: "Download and share your credentials instantly." },
                        { title: "Direct Mentorship", desc: "Connect with industry experts on demand." }
                     ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                           </div>
                           <div>
                             <h4 className="text-gray-900 font-bold mb-1">{item.title}</h4>
                             <p className="text-sm text-gray-500">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>

               {/* Right 3D Mockup */}
               <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} className="flex-1 w-full relative z-10 perspective-1000">
                  {/* Decorative Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-cyan-100/50 to-red-100/50 blur-[60px] rounded-full -z-10" />
                  
                  <div className="relative rounded-[2rem] bg-white border border-gray-100 p-3 shadow-[0_30px_60px_rgba(0,0,0,0.08)] transform lg:-rotate-y-12 lg:rotate-x-12 hover:rotate-0 transition-transform duration-700 ease-out">
                     <div className="bg-gray-50 rounded-[1.5rem] overflow-hidden border border-gray-100" style={{ aspectRatio: '16/10' }}>
                        {/* Mockup UI content */}
                        <div className="flex h-full flex-col">
                           <div className="h-10 border-b border-gray-200 bg-white flex items-center px-4 gap-2">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                           </div>
                           <div className="flex-1 flex">
                             <div className="w-1/4 border-r border-gray-200 bg-white p-4 space-y-3">
                               <div className="w-full h-8 bg-gray-100 rounded-lg"></div>
                               <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                               <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
                             </div>
                             <div className="flex-1 p-6 flex flex-col gap-4 bg-[#FAFAFC]">
                               <div className="flex justify-between items-center mb-2">
                                 <div className="w-1/3 h-6 bg-gray-200 rounded"></div>
                                 <div className="w-8 h-8 bg-white border border-gray-200 rounded-full"></div>
                               </div>
                               <div className="w-full h-1/2 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
                               <div className="flex gap-4 flex-1">
                                 <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
                                 <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
                               </div>
                             </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ── TESTIMONIALS (Clean Grid) ────────────────────────── */}
      <section className="py-32 px-4 relative z-20">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-red-600 font-black uppercase tracking-[0.2em] text-xs mb-4 block">Success Stories</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Trusted By Professionals</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                  { name: "Sarah Jenkins", role: "BIM Coordinator @ Arup", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80", text: "The Master Certificate in BIM completely transformed my career trajectory. The practical, hands-on approach gave me the exact skills employers were looking for." },
                  { name: "David Chen", role: "Senior Architect", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", text: "Incredible instructors who actually work in the industry. The insights I gained here went far beyond what I learned in my university degree." },
                  { name: "Priya Sharma", role: "Project Manager", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80", text: "The Primavera P6 training was rigorous but entirely worth it. I was promoted to Lead Project Planner within 6 months of completing my certification." }
               ].map((t, i) => (
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col h-full group">
                     <div className="flex items-center gap-1 text-amber-400 mb-6">
                        {[...Array(5)].map((_,j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                     </div>
                     <p className="text-gray-600 text-lg mb-8 leading-relaxed font-medium flex-1">&quot;{t.text}&quot;</p>
                     <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                        <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:scale-110 transition-transform" />
                        <div>
                           <h4 className="font-bold text-gray-900">{t.name}</h4>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.role}</p>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── PREMIUM CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative z-20 pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-[#0F172A] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.2)]">
            
            {/* Glowing Orbs inside CTA */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">Start Building<br />Your Legacy.</h2>
              <p className="text-lg md:text-xl text-gray-400 mb-12 font-medium">Join a global network of professionals. Enroll today and take the first step towards mastery.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses" className="inline-flex items-center justify-center bg-white text-gray-900 hover:bg-gray-100 rounded-full px-10 h-16 text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-xl">
                  Explore Courses
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center border border-white/20 text-white hover:bg-white/10 rounded-full px-10 h-16 text-sm font-black uppercase tracking-widest backdrop-blur-md transition-all duration-300">
                  Talk to an Advisor
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
