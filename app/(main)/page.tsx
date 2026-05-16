"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight, BookOpen, Users, Award,
  Clock, Play, Star, TrendingUp,
  LayoutDashboard, MessageSquareQuote
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


  useEffect(() => {
    getFeaturedCourses().then(setCourses).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white selection:bg-blue-500/30 overflow-hidden">
      
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-[#F8FAFC] overflow-hidden pt-20">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-blue-300/30 blur-[120px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-300/30 blur-[150px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col lg:flex-row items-center gap-16">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex-1 text-center lg:text-left">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-blue-100 text-blue-700 text-sm font-semibold px-5 py-2 rounded-full mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Elevating Tech Education
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-[#0F172A] mb-8 tracking-tight leading-[1.05]">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Your Future</span><br />
              In Design & Tech
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-[#475569] max-w-2xl mx-auto lg:mx-0 mb-10 font-medium leading-relaxed">
              Award-winning training in BIM, CAD, and Project Management. Join thousands of alumni building the modern world.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_30px_rgb(37,99,235,0.3)] rounded-full px-8 h-14 text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_40px_rgb(37,99,235,0.4)] border-0">
                <Link href="/courses">Explore Programmes <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 rounded-full px-8 h-14 text-base font-bold transition-all duration-300 hover:scale-105 shadow-sm">
                <Link href="/auth/register">Talk to an Advisor</Link>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-70">
              <div className="flex flex-col items-start"><span className="text-2xl font-black text-gray-900">10k+</span><span className="text-xs font-semibold text-gray-500 uppercase">Graduates</span></div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex flex-col items-start"><span className="text-2xl font-black text-gray-900">98%</span><span className="text-xs font-semibold text-gray-500 uppercase">Success Rate</span></div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex flex-col items-start"><span className="text-2xl font-black text-gray-900">ISO</span><span className="text-xs font-semibold text-gray-500 uppercase">Certified</span></div>
            </motion.div>
          </motion.div>

          {/* Floating Hero UI Element */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3 }} className="flex-1 hidden lg:block relative">
             <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative z-20 bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-xl max-w-sm ml-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Star className="w-6 h-6 fill-current" /></div>
                  <div><h4 className="font-bold text-gray-900">Top Rated</h4><p className="text-sm text-gray-500">Master Certificate in BIM</p></div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-3/4"></div></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 w-1/2"></div></div>
                </div>
             </motion.div>
             
             {/* Secondary floating card */}
             <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-10 -left-10 z-10 bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-white/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><TrendingUp className="w-5 h-5" /></div>
                <div><h4 className="font-bold text-gray-900">+12% Salary</h4><p className="text-xs text-gray-500">Average increase post-course</p></div>
             </motion.div>
          </motion.div>
        </div>
        
        {/* Soft Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── CLIENTS / SUPPORTERS ───────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest">Our Clients & Supporters</p>
        </div>
        
        {/* Infinite Logo Carousel */}
        <div className="relative flex overflow-hidden group max-w-7xl mx-auto w-full">
          <div className="animate-marquee flex whitespace-nowrap hover:[animation-play-state:paused] items-center">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 md:gap-24 px-6 md:px-12">
                {[
                  "https://caddcentre.lk/wp-content/uploads/2024/06/1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/3-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/4-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/5-1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/7-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/8-2.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/10-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/13-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/17-1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/18-1-1.jpg",
                  "https://caddcentre.lk/wp-content/uploads/2024/06/19-1.jpg",
                ].map((src, index) => (
                  <img 
                    key={index} 
                    src={src} 
                    alt={`Client Logo ${index + 1}`} 
                    className="h-16 md:h-20 w-auto max-w-[200px] object-contain flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 mix-blend-multiply" 
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM COURSES SECTION ───────────────────────── */}
      <section className="py-32 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-6">
            <div className="max-w-2xl">
              <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Elite Training Programs</span>
              <h2 className="text-4xl md:text-6xl font-black text-[#0F172A] tracking-tight leading-tight">Trending Courses</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full px-8 h-14 border-gray-200 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 shadow-sm">
              <Link href="/courses">View All Catalog <ArrowRight className="h-5 w-5 ml-2" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-[450px] bg-gray-100 rounded-[2rem] animate-pulse" />)
            ) : (
              courses.map((course, i) => (
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }} key={course.id}>
                  <Link href={`/courses/${course.slug}`} className="group block bg-white rounded-[2rem] border border-gray-100 p-3 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                    <div className="h-64 rounded-3xl overflow-hidden relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/20 to-transparent z-10 transition-opacity group-hover:opacity-90" />
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
                          <BookOpen className="h-20 w-20 text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-white/90 text-[#0F172A] border-none shadow-sm backdrop-blur-md hover:bg-white">{course.level}</Badge>
                      </div>
                      {course.is_featured && (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Popular
                        </div>
                      )}
                      
                      {/* Hover CTA Reveal */}
                      <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <span className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300">View Details</span>
                      </div>
                    </div>
                    
                    <div className="px-5 pb-6">
                      <div className="flex items-center justify-between mb-3">
                         <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{course.category}</p>
                         <div className="flex items-center gap-1 text-amber-400"><Star className="w-4 h-4 fill-current"/><span className="text-sm font-bold text-gray-700">4.9</span></div>
                      </div>
                      <h3 className="font-bold text-2xl text-[#0F172A] mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#475569] mb-6 pt-4 border-t border-gray-50">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {course.total_hours}h</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 1.2k+ Students</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#0F172A]">{formatCurrency(course.price)}</span>
                            {course.original_price && <span className="text-sm text-gray-400 line-through">{formatCurrency(course.original_price)}</span>}
                         </div>
                         <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                           <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
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

      {/* ── DASHBOARD PREVIEW / LEARNING EXPERIENCE ────────────── */}
      <section className="py-32 bg-[#F8FAFC] relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-white rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-cyan-50 blur-[80px] rounded-full" />
               
               <div className="flex-1 relative z-10">
                  <Badge className="bg-blue-50 text-blue-600 border-none shadow-none mb-6 px-4 py-1">Next-Gen Platform</Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-6 leading-tight">A Learning Experience Built for Success</h2>
                  <p className="text-[#475569] text-lg mb-8 leading-relaxed">Access your courses, track your progress, and collaborate with peers through our custom-built student portal. Seamlessly integrated across all your devices.</p>
                  <ul className="space-y-4 mb-10">
                     {[
                        { text: "Interactive module tracking", icon: LayoutDashboard },
                        { text: "Direct mentorship access", icon: Users },
                        { text: "Verifiable digital certificates", icon: Award }
                     ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#0F172A] font-medium">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <item.icon className="w-4 h-4" />
                           </div>
                           {item.text}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="flex-1 relative z-10 w-full">
                  <div className="relative rounded-2xl bg-gray-900 p-2 shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                     <div className="absolute top-4 left-4 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                     </div>
                     <div className="bg-white mt-8 rounded-xl overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                        {/* Mockup UI content */}
                        <div className="absolute inset-0 bg-[#F8FAFC] flex flex-col">
                           <div className="h-12 border-b border-gray-100 flex items-center px-6"><div className="w-32 h-4 bg-gray-200 rounded-full"></div></div>
                           <div className="flex-1 p-6 flex gap-6">
                              <div className="w-1/3 flex flex-col gap-4">
                                 <div className="h-24 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                                    <div className="w-1/2 h-3 bg-gray-200 rounded-full mb-3"></div>
                                    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-blue-600"></div></div>
                                 </div>
                                 <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm"></div>
                              </div>
                              <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                                 <div className="w-1/3 h-6 bg-gray-200 rounded-full mb-6"></div>
                                 <div className="w-full h-40 bg-blue-50 rounded-lg mb-4 flex items-center justify-center">
                                    <Play className="w-12 h-12 text-blue-400" />
                                 </div>
                                 <div className="space-y-3">
                                    <div className="w-full h-3 bg-gray-100 rounded-full"></div>
                                    <div className="w-5/6 h-3 bg-gray-100 rounded-full"></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white relative">
         <div className="max-w-7xl mx-auto text-center">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-16">Don&apos;t Just Take Our Word For It</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { name: "Sarah Jenkins", role: "BIM Coordinator @ Arup", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80", text: "The Master Certificate in BIM completely transformed my career trajectory. The practical, hands-on approach gave me the exact skills employers were looking for." },
                  { name: "David Chen", role: "Senior Architect", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", text: "Incredible instructors who actually work in the industry. The insights I gained here went far beyond what I learned in my university degree." },
                  { name: "Priya Sharma", role: "Project Manager", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80", text: "The Primavera P6 training was rigorous but entirely worth it. I was promoted to Lead Project Planner within 6 months of completing my certification." }
               ].map((t, i) => (
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="bg-[#F8FAFC] p-10 rounded-[2rem] text-left relative group hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
                     <MessageSquareQuote className="absolute top-10 right-10 w-12 h-12 text-blue-100 group-hover:text-blue-200 transition-colors" />
                     <div className="flex items-center gap-1 text-amber-400 mb-6">
                        {[...Array(5)].map((_,j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                     </div>
                     <p className="text-[#475569] text-lg mb-8 leading-relaxed flex-1">&quot;{t.text}&quot;</p>
                     <div className="flex items-center gap-4 mt-auto">
                        <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" />
                        <div>
                           <h4 className="font-bold text-[#0F172A]">{t.name}</h4>
                           <p className="text-sm text-gray-500">{t.role}</p>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── PREMIUM CTA ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-gradient-to-br from-blue-600 via-[#1D4ED8] to-cyan-500 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-[0_20px_50px_rgb(37,99,235,0.2)]">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Ready to Elevate Your Career?</h2>
              <p className="text-xl text-blue-100 mb-12 font-medium">Join thousands of successful alumni. Start your journey towards mastery today.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register" className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-gray-50 rounded-full px-10 h-16 text-lg font-bold transition-all duration-300 hover:scale-105 shadow-xl">
                  Enroll Now
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-16 text-lg font-bold backdrop-blur-md transition-all duration-300 hover:scale-105">
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
