"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BookOpen, Clock, ArrowRight, Filter, ChevronRight, X, Star, Users, LayoutGrid, Layers, Hexagon, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCourses } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import type { Course } from "@/types"

const LEVELS = ["All", "Proficient Certificate", "Master Certificate", "Expert Certificate"]
const CATEGORIES = [
  { name: "All", icon: LayoutGrid },
  { name: "BIM", icon: Layers },
  { name: "CAD", icon: Hexagon },
  { name: "Project Management", icon: Clock }
]

const levelColor = (l: string) => l === "Expert Certificate" ? "bg-purple-100 text-purple-800" : l === "Master Certificate" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filtered, setFiltered] = useState<Course[]>([])
  const [search, setSearch] = useState("")
  const [level, setLevel] = useState("All")
  const [category, setCategory] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Search bar typing animation effect
  const [placeholderText, setPlaceholderText] = useState("")
  const placeholders = ["Search for BIM courses...", "Master AutoCAD...", "Learn Project Management...", "Find your next skill..."]
  const [currentPlaceholderIdx, setCurrentPlaceholderIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const typingSpeed = isDeleting ? 50 : 100

  useEffect(() => {
    let timer = setTimeout(() => {
      const fullText = placeholders[currentPlaceholderIdx]
      if (!isDeleting && placeholderText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && placeholderText === "") {
        setIsDeleting(false)
        setCurrentPlaceholderIdx((prev) => (prev + 1) % placeholders.length)
      } else {
        setPlaceholderText(
          isDeleting 
            ? fullText.substring(0, placeholderText.length - 1)
            : fullText.substring(0, placeholderText.length + 1)
        )
      }
    }, typingSpeed)
    return () => clearTimeout(timer)
  }, [placeholderText, isDeleting, currentPlaceholderIdx])

  useEffect(() => {
    getCourses(true).then(data => {
      setCourses(data)
      setFiltered(data)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    let res = courses
    if (search) res = res.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.short_description || "").toLowerCase().includes(search.toLowerCase()))
    if (level !== "All") res = res.filter(c => c.level === level)
    if (category !== "All") res = res.filter(c => c.category === category)
    setFiltered(res)
  }, [search, level, category, courses])

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-500/30">
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 bg-[#F8FAFC] overflow-hidden border-b border-gray-100">
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-blue-300/30 blur-[120px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-300/30 blur-[150px] rounded-full pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        
        {/* Floating blurred shapes */}
        <motion.div animate={{ y: [0, -30, 0], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-20 right-20 w-32 h-32 bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-white/60 shadow-xl hidden lg:flex items-center justify-center">
           <Hexagon className="w-12 h-12 text-blue-500/40" />
        </motion.div>
        <motion.div animate={{ y: [0, 40, 0], rotate: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute bottom-10 left-10 w-24 h-24 bg-white/40 backdrop-blur-3xl rounded-full border border-white/60 shadow-xl hidden md:flex items-center justify-center">
           <Layers className="w-10 h-10 text-cyan-500/40" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-sm font-bold tracking-widest uppercase px-5 py-2 rounded-full mb-8 shadow-sm">
              <BookOpen className="w-4 h-4" /> Academic Catalog
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black text-[#0F172A] mb-6 tracking-tight leading-[1.05]">
              Find Your Next <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Mastery Level</span>
            </h1>
            <p className="text-lg md:text-xl text-[#475569] mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
              Industry-oriented BIM, CAD and Project Management training with practical software-based learning.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-[2rem] blur-lg opacity-20 group-focus-within:opacity-50 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/90 backdrop-blur-xl border border-white rounded-2xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 text-blue-600 group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors duration-300">
                   <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={search ? "" : placeholderText}
                  className="w-full bg-transparent text-[#0F172A] placeholder-gray-400 text-lg font-medium focus:outline-none px-2 py-3"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="p-3 text-gray-400 hover:text-[#0F172A] transition-colors rounded-xl hover:bg-gray-50 mr-1">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ── MOBILE FILTER TOGGLE ──────────────────────────────── */}
          <div className="lg:hidden w-full">
             <Button onClick={() => setShowFilters(!showFilters)} className="w-full h-14 rounded-2xl bg-white border border-gray-200 text-[#0F172A] shadow-sm flex justify-between items-center px-6">
                <span className="flex items-center gap-2 font-bold"><SlidersHorizontal className="w-5 h-5 text-blue-600"/> Filters</span>
                <ChevronRight className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
             </Button>
          </div>

          {/* ── FILTERS SIDEBAR (GLASSMORPHISM) ────────────────────── */}
          <AnimatePresence>
            {(showFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="w-full lg:w-1/4 lg:sticky top-28 z-20 overflow-hidden lg:overflow-visible"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <h3 className="font-black text-xl text-[#0F172A] flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Filters</h3>
                    {(level !== "All" || category !== "All") && (
                      <button onClick={() => { setLevel("All"); setCategory("All") }} className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">Clear</button>
                    )}
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Category</h4>
                      <div className="flex flex-col gap-2">
                        {CATEGORIES.map(c => {
                           const isSelected = category === c.name;
                           return (
                             <button key={c.name} onClick={() => setCategory(c.name)} className={`group relative text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 overflow-hidden ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-[#475569] hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100"}`}>
                               <c.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isSelected ? "text-blue-200" : "text-gray-400 group-hover:text-blue-600"}`} />
                               <span className="relative z-10">{c.name}</span>
                             </button>
                           )
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Certification Level</h4>
                      <div className="flex flex-col gap-2">
                        {LEVELS.map(l => {
                           const isSelected = level === l;
                           return (
                             <button key={l} onClick={() => setLevel(l)} className={`group text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-between ${isSelected ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-[#475569] hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100"}`}>
                               {l}
                               {isSelected && <motion.div layoutId="level-indicator" className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm" />}
                             </button>
                           )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── COURSE LISTINGS (STAGGERED GRID FEEL) ──────────────── */}
          <div className="w-full lg:w-3/4">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[#475569] font-medium text-lg">Showing <span className="font-black text-[#0F172A]">{filtered.length}</span> premium courses</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2rem] h-[500px] border border-gray-100 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3rem] border border-gray-100 p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <Search className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-3xl font-black text-[#0F172A] mb-4">No courses found</h3>
                <p className="text-[#475569] text-lg max-w-md mx-auto mb-8">We couldn't find any courses matching your criteria. Try adjusting the filters or search term.</p>
                <Button onClick={() => { setSearch(""); setLevel("All"); setCategory("All") }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 px-10 font-bold shadow-lg hover:shadow-blue-600/30 transition-all duration-300">
                  Reset Search
                </Button>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <AnimatePresence>
                  {filtered.map((course, i) => (
                    <motion.div 
                       layout 
                       initial={{ opacity: 0, y: 50 }} 
                       animate={{ opacity: 1, y: 0 }} 
                       exit={{ opacity: 0, scale: 0.95 }} 
                       transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
                       key={course.id}
                    >
                      <Link href={`/courses/${course.slug}`} className="group block bg-white rounded-[2rem] border border-gray-100 p-3 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 h-full flex flex-col relative overflow-hidden">
                        <div className="h-64 rounded-[1.5rem] overflow-hidden relative mb-5 flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                          {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
                              <BookOpen className="h-20 w-20 text-white/20" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 z-20">
                            <Badge className="bg-white/95 text-[#0F172A] border-none shadow-sm backdrop-blur-xl px-4 py-1.5 font-bold hover:bg-white">{course.level}</Badge>
                          </div>
                          {course.is_featured && (
                            <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Popular
                            </div>
                          )}
                          
                          {/* Hover View Details Button Reveal */}
                          <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] translate-y-4 group-hover:translate-y-0 transition-all duration-300">View Details</span>
                          </div>
                        </div>
                        
                        <div className="px-5 pb-5 flex flex-col flex-1">
                          <div className="flex items-center justify-between mb-3">
                             <p className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {course.category}
                             </p>
                             <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-xs font-bold text-amber-700">4.9</span>
                             </div>
                          </div>
                          
                          <h3 className="font-black text-2xl text-[#0F172A] mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                          
                          <div className="flex items-center gap-4 text-sm font-medium text-[#475569] mb-6 pt-4 border-t border-gray-50 flex-1">
                             <span className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4 text-gray-400" /> {course.total_hours}h</span>
                             <span className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg"><Users className="w-4 h-4 text-gray-400" /> 1.2k+</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[#0F172A] tracking-tight">{formatCurrency(course.price)}</span>
                                {course.original_price && <span className="text-sm font-medium text-gray-400 line-through">{formatCurrency(course.original_price)}</span>}
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_8px_20px_rgb(37,99,235,0.3)]">
                              <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
