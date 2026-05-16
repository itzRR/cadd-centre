"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Users, BookOpen, CalendarDays, UserCheck, ClipboardList,
  Award, TrendingUp, BarChart3, ArrowUpRight, RefreshCw,
  Activity, GraduationCap, Clock, PhoneCall, FolderOpen, MessageSquare, Layers
} from "lucide-react"
import { QuickGuide, type GuideStep } from "@/components/ui/quick-guide"
import { getDashboardStats } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatDateTime } from "@/lib/utils"

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const loadStats = useCallback(async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
      setLastRefreshed(new Date())
      setError("")
    } catch {
      setError("Failed to load stats")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30_000)

    // Real-time: listen to enrollments & profiles changes
    const channel = supabase
      .channel('asms_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => loadStats())
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [loadStats])

  if (!stats) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-500 font-medium">{error || "No data available"}</p>
            <button onClick={loadStats} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Retry
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse h-64" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { title: "Total Students",    value: stats.totalStudents,      icon: Users,         gradient: "from-blue-500 to-blue-600",      bg: "bg-blue-50",  text: "text-blue-700",  href: "/admin/students" },
    { title: "Active Courses",    value: stats.totalCourses,       icon: BookOpen,      gradient: "from-purple-500 to-purple-600",  bg: "bg-purple-50",text: "text-purple-700",href: "/admin/courses" },
    { title: "Active Batches",    value: stats.totalBatches,       icon: CalendarDays,  gradient: "from-cyan-500 to-cyan-600",      bg: "bg-cyan-50",  text: "text-cyan-700",  href: "/admin/batches" },
    { title: "Lecturers",          value: stats.totalLecturers,      icon: UserCheck,     gradient: "from-orange-500 to-orange-600",  bg: "bg-orange-50",text: "text-orange-700",href: "/admin/lecturers" },
    { title: "Total Enrollments", value: stats.totalEnrollments,   icon: ClipboardList, gradient: "from-green-500 to-green-600",    bg: "bg-green-50", text: "text-green-700", href: "/admin/enrollments" },
    { title: "Certificates",      value: stats.certificatesIssued, icon: Award,         gradient: "from-yellow-500 to-amber-500",   bg: "bg-yellow-50",text: "text-yellow-700",href: "/admin/certificates" },
    { title: "Total Revenue",     value: formatCurrency(stats.totalRevenue), icon: TrendingUp, gradient: "from-emerald-500 to-emerald-600",bg: "bg-emerald-50",text: "text-emerald-700", href: "/admin/reports", isRevenue: true },
    { title: "Attendance Rate",   value: `${stats.attendanceRate}%`, icon: BarChart3,   gradient: "from-rose-500 to-rose-600",      bg: "bg-rose-50",  text: "text-rose-700",  href: "/admin/attendance" },
  ]

  const adminGuideSteps: GuideStep[] = [
    { title: "Welcome to ASMS Dashboard", description: "This is your central hub for managing the entire academic system. View real-time stats, revenue, enrollments, and student lifecycle - all at a glance.", icon: GraduationCap, gradient: "from-blue-500 to-cyan-500", tip: "Stats auto-refresh every 30 seconds and update in real-time when changes happen." },
    { title: "Managing People", description: "Under the 'People' group in the sidebar, you'll find Leads (prospective students), Students (enrolled), and Lecturers. Click any stat card to jump directly to that section.", icon: Users, gradient: "from-blue-500 to-blue-600", tip: "Use the sidebar groups - click a category to expand it and see its items." },
    { title: "Courses & Batches", description: "Set up your courses with modules, then create batches to group students into scheduled classes. Enrollments link students to specific courses and batches.", icon: BookOpen, gradient: "from-purple-500 to-purple-600", tip: "Follow the Student Lifecycle Flow at the bottom of this dashboard to see the full journey." },
    { title: "Attendance & Assessments", description: "Track student attendance per batch and manage assessments to evaluate performance. Both sections are under 'Operations' in the sidebar.", icon: CalendarDays, gradient: "from-cyan-500 to-cyan-600" },
    { title: "Certificates & Resources", description: "Issue certificates for completed students and manage shared learning resources. Find these in the 'Operations' group in the sidebar.", icon: Award, gradient: "from-yellow-500 to-amber-500" },
    { title: "Reports & Messages", description: "View detailed analytics about revenue, enrollments, and attendance under 'Insights'. Send and receive messages to communicate with students and staff.", icon: BarChart3, gradient: "from-rose-500 to-rose-600", tip: "The sidebar groups collapse/expand - only the active section stays open for easy navigation." },
    { title: "Institute Management (IMS)", description: "Expand 'Institute Mgmt' in the sidebar for department-level dashboards - Marketing, Academic Ops, Finance, HR, Staff Users, Tasks, Roster, and the Control Panel.", icon: Activity, gradient: "from-emerald-500 to-emerald-600", tip: "Each IMS department has its own guide! Look for the 'Guide' button when you enter them." },
  ]

  const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">ASMS Dashboard</h1>
              <p className="text-sm text-gray-500">Academic & Student Management System</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live · {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <QuickGuide
            guideKey="admin_asms_dashboard"
            dashboardName="ASMS Dashboard"
            accentGradient="from-blue-600 to-cyan-500"
            steps={adminGuideSteps}
          />
          <button onClick={loadStats} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-sm font-medium transition-all hover:shadow-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href="/admin/students" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 text-sm font-medium transition-all hover:shadow-sm">
            <Users className="h-3.5 w-3.5" /> Students
          </Link>
          <Link href="/admin/batches" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg">
            <CalendarDays className="h-3.5 w-3.5" /> Manage Batches
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div variants={item} key={i}>
            <Link href={stat.href}>
              <div className="group bg-white rounded-2xl p-4 md:p-5 border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
                {/* Background accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-full -mr-6 -mt-6 opacity-50 group-hover:opacity-80 transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.title}</p>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className={`text-2xl md:text-3xl font-black ${stat.text}`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Real-time</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Monthly Revenue</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 6 months performance</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {stats.monthlyRevenue.map((month, i) => (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3 group"
              >
                <span className="text-xs font-bold text-gray-500 w-14 flex-shrink-0">{month.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max((month.revenue / maxRevenue) * 100, 3)}%` }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 group-hover:from-blue-400 group-hover:to-cyan-300 transition-colors"
                  />
                </div>
                <span className="text-xs font-black text-gray-800 w-24 text-right">{formatCurrency(month.revenue)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Recent Enrollments</h3>
                <p className="text-xs text-gray-400 mt-0.5">{stats.recentEnrollments.length} latest entries</p>
              </div>
              <Link href="/admin/enrollments" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                View All →
              </Link>
            </div>
          </div>
          <div className="p-4">
            {stats.recentEnrollments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {stats.recentEnrollments.slice(0, 6).map((enrollment: any, i: number) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(enrollment.students?.full_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {enrollment.students?.full_name || "Unknown"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {enrollment.courses?.title || "Unknown course"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-sm text-gray-900">{formatCurrency(enrollment.amount_paid)}</p>
                      <Badge className={`text-[10px] mt-0.5 font-bold ${
                        enrollment.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        enrollment.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>{enrollment.status}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Student Lifecycle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-900">Student Lifecycle Flow</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { step: "1", label: "Registration",       href: "/admin/students",     color: "from-blue-500 to-blue-600" },
            { step: "2", label: "Course Enrollment",  href: "/admin/enrollments",  color: "from-purple-500 to-purple-600" },
            { step: "3", label: "Batch Allocation",   href: "/admin/batches",      color: "from-cyan-500 to-cyan-600" },
            { step: "4", label: "Module Learning",    href: "/admin/courses",      color: "from-green-500 to-green-600" },
            { step: "5", label: "Attendance",         href: "/admin/attendance",   color: "from-orange-500 to-orange-600" },
            { step: "6", label: "Assessment",         href: "/admin/courses",      color: "from-rose-500 to-rose-600" },
            { step: "7", label: "Certification",      href: "/admin/certificates", color: "from-yellow-500 to-amber-500" },
          ].map((s, i, arr) => (
            <motion.div key={s.step} className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}>
              <Link href={s.href}
                className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 text-gray-700 hover:text-blue-700 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold transition-all hover:shadow-sm">
                <span className={`w-5 h-5 bg-gradient-to-br ${s.color} text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm`}>
                  {s.step}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.label.split(' ')[0]}</span>
              </Link>
              {i < arr.length - 1 && <span className="text-gray-300 text-xs">→</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Enrollment Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h3 className="font-bold text-gray-900">Enrollment Activity</h3>
          </div>
          <Link href="/admin/enrollments" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Batch</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentEnrollments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No enrollment activity</td></tr>
              ) : stats.recentEnrollments.map((e: any) => (
                <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(e.students?.full_name || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[120px]">{e.students?.full_name || "-"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-gray-400 text-xs font-mono hidden md:table-cell">{e.students?.student_id || "-"}</td>
                  <td className="py-3.5 px-6 text-gray-600 text-xs max-w-[140px] truncate">{e.courses?.title || "-"}</td>
                  <td className="py-3.5 px-6 text-gray-500 text-xs hidden lg:table-cell">{e.batches?.name || "-"}</td>
                  <td className="py-3.5 px-6 font-bold text-gray-900">{formatCurrency(e.amount_paid)}</td>
                  <td className="py-3.5 px-6">
                    <Badge className={`text-[10px] font-bold ${
                      e.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                      e.status === "confirmed" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}>{e.status}</Badge>
                  </td>
                  <td className="py-3.5 px-6 text-gray-400 text-xs hidden md:table-cell">{formatDateTime(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
