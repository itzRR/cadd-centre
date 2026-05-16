"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BookOpen, Award, ArrowRight, CheckCircle,
  GraduationCap, ClipboardList, CalendarDays,
  BarChart3, FolderOpen, Layers, User
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getUserEnrollmentsAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth"

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { router.push("/auth/login?redirect=/dashboard"); return }
      if (["admin", "academic_manager", "coordinator"].includes(u.role)) {
        router.push("/admin"); return
      }
      setUser(u)
      try {
        const e = await getUserEnrollmentsAction()
        setEnrollments(e || [])
      } catch (err) {
        console.error("Failed to load enrollments", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest animate-pulse">Syncing Portal...</p>
      </div>
    )
  }

  const completed = enrollments.filter(e => e.status === "completed").length
  const active = enrollments.filter(e => e.status === "confirmed").length

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Subtle background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 blur-[100px] rounded-full opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 mx-auto sm:mx-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Welcome back, <span className="text-blue-600">{user?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">Your CADD Centre Lanka student portal is active.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
            <Button asChild variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl px-6 h-12 w-full sm:w-auto">
              <Link href="/profile">My Profile</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12 shadow-md border-none font-bold w-full sm:w-auto">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Enrolled",     value: enrollments.length, icon: BookOpen,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-100" },
            { label: "Active",       value: active,             icon: ClipboardList, color: "text-sky-600",     bg: "bg-sky-50 border-sky-100" },
            { label: "Completed",    value: completed,          icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Certificates", value: completed,          icon: Award,         color: "text-amber-600",   bg: "bg-amber-50 border-amber-100" },
          ].map(s => (
            <motion.div key={s.label} variants={item}
              className="bg-white border border-gray-200 rounded-[2rem] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-2xl border ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state */}
        {enrollments.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-[2.5rem] p-12 text-center mb-10 relative overflow-hidden shadow-xl shadow-blue-500/20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Start Your Professional Journey</h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto leading-relaxed">Enroll in our industry-leading BIM & CAD programmes to unlock your career potential.</p>
              <Button asChild className="bg-white text-blue-700 hover:bg-gray-50 rounded-2xl px-10 h-14 font-black shadow-xl transition-all hover:scale-105">
                <Link href="/courses">Browse All Courses</Link>
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* Enrolled Courses */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                My Enrolled Courses
              </h2>
              <Link href="/my-courses" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest transition-all">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active enrollments</p>
                <Link href="/courses" className="text-blue-600 text-xs font-bold mt-3 inline-block hover:underline">Browse catalogue →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 4).map(enrollment => {
                  const isCompleted = enrollment.status === "completed"
                  return (
                    <Link key={enrollment.id} href={`/courses/${enrollment.courses?.slug}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                      <div className={`w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 ${isCompleted ? "bg-emerald-50" : "bg-blue-50"} border ${isCompleted ? "border-emerald-100" : "border-blue-100"} flex items-center justify-center`}>
                        {isCompleted
                          ? <CheckCircle className="w-6 h-6 text-emerald-500" />
                          : <BookOpen className="w-6 h-6 text-blue-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {enrollment.courses?.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
                            isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {enrollment.status}
                          </span>
                          {enrollment.batch && (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {enrollment.batch.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Student Portal Tiles */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              Student Portal
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Courses",      href: "/my-courses",      icon: BookOpen,     color: "from-blue-500 to-blue-600" },
                { label: "Attendance",   href: "/my-attendance",   icon: CalendarDays, color: "from-sky-500 to-cyan-600" },
                { label: "Results",      href: "/my-results",      icon: BarChart3,    color: "from-purple-500 to-purple-600" },
                { label: "Certificates", href: "/my-certificates", icon: Award,        color: "from-amber-500 to-amber-600" },
                { label: "E-books",      href: "/resources",       icon: FolderOpen,   color: "from-emerald-500 to-emerald-600" },
                { label: "Progress",     href: "/my-progress",     icon: Layers,       color: "from-pink-500 to-pink-600" },
              ].map(tile => (
                <Link key={tile.label} href={tile.href} className="group">
                  <div className="bg-gray-50 border border-gray-100 rounded-[1.5rem] p-5 text-center hover:bg-white hover:shadow-lg hover:border-gray-200 hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
                      <tile.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-tight group-hover:text-gray-800 transition-colors">{tile.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Academic Progress */}
        {enrollments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-sky-600" />
              </div>
              Academic Progress Overview
            </h2>
            <div className="space-y-8">
              {enrollments.map(enrollment => (
                <div key={enrollment.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-blue-600" />
                      <p className="text-base font-bold text-gray-900">{enrollment.courses?.title}</p>
                    </div>
                    <Badge className={`rounded-xl px-4 py-1 font-black uppercase text-[10px] ${
                      enrollment.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  {enrollment.courses?.modules && enrollment.courses.modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {enrollment.courses.modules.map((mod: any, i: number) => (
                        <div key={mod.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate leading-tight">{mod.title}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{mod.duration_hours} Credit Hours</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Curriculum details pending</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
