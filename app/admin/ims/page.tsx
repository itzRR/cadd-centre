"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Users, TrendingUp, DollarSign, UserCog, ListTodo,
  Megaphone, GraduationCap, Building2, AlertCircle,
  CheckCircle, Calendar, Terminal, Menu, LogOut, ArrowRight, Home
} from "lucide-react"
import { QuickGuide, type GuideStep } from "@/components/ui/quick-guide"

import { getIMSDashboardStats, getLeadConfirmations } from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { IMSDashboardStats, AuthUser } from "@/types"

export default function IMSDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<IMSDashboardStats | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [pipelineCounts, setPipelineCounts] = useState({ marketing: 0, finance: 0, academic: 0 })

  useEffect(() => {
    Promise.all([
      getIMSDashboardStats(),
      getCurrentUser(),
      getLeadConfirmations('marketing_confirmed'),
      getLeadConfirmations('finance_confirmed'),
      getLeadConfirmations('academic_confirmed'),
    ])
      .then(([s, u, mc, fc, ac]) => {
        setStats(s); setUser(u as any);
        setPipelineCounts({ marketing: mc.length, finance: fc.length, academic: ac.length })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowLoadingAnimation(false), 1500)
    return () => clearTimeout(t)
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const imsGuideSteps: GuideStep[] = [
    { title: "IMS Overview", description: "This is your central hub for all institute operations. Each department module has its own dashboard with dedicated features.", icon: Building2, gradient: "from-blue-500 to-sky-400", tip: "The top stat cards show real-time numbers across all departments." },
    { title: "Marketing Module", description: "Track leads from inquiry to enrollment. Manage campaigns, schedule follow-ups, and analyze conversion rates.", icon: Megaphone, gradient: "from-orange-500 to-pink-500", tip: "Leads marked as 'Converted' will auto-create student records." },
    { title: "Academic Ops", description: "Manage internal academic operations - register students, create courses & batches, track attendance, and publish exam results.", icon: GraduationCap, gradient: "from-emerald-500 to-cyan-500" },
    { title: "Finance Module", description: "Record payments, generate invoices with PDF downloads, log expenses, and view profit & loss reports.", icon: DollarSign, gradient: "from-blue-500 to-indigo-500", tip: "Link payments to invoices for automatic status tracking." },
    { title: "HR Module", description: "Manage the staff directory, process leave requests, handle payroll, and track performance reviews.", icon: UserCog, gradient: "from-purple-500 to-pink-500" },
    { title: "Tasks & Collaboration", description: "Create and assign cross-department tasks. Track progress and manage priorities in one shared workspace.", icon: ListTodo, gradient: "from-yellow-500 to-orange-500" },
    { title: "Roster & Control Panel", description: "Schedule staff shifts in the Roster and use the Control Panel for system-wide actions like broadcasts and forced logouts.", icon: Terminal, gradient: "from-red-500 to-rose-500", tip: "The Control Panel is super admin only." },
  ]

  const modules = [
    {
      title: "Marketing",
      href: "/admin/ims/marketing",
      icon: Megaphone,
      gradient: "from-orange-500 to-pink-500",
      description: "Leads, campaigns & follow-ups",
      stat: stats ? `${stats.activeLeads} active leads` : "-",
      badge: stats?.activeLeads ? `${stats.activeLeads}` : "0",
      badgeColor: "bg-orange-500/20 text-orange-700 border-orange-500/20",
    },
    {
      title: "Academic Ops",
      href: "/admin/ims/academic",
      icon: GraduationCap,
      gradient: "from-emerald-500 to-cyan-500",
      description: "Students, courses & batches",
      stat: stats ? `${stats.totalStudents} students` : "-",
      badge: stats?.totalStudents ? `${stats.totalStudents}` : "0",
      badgeColor: "bg-emerald-500/20 text-emerald-700 border-emerald-500/20",
    },
    {
      title: "Finance",
      href: "/admin/ims/finance",
      icon: DollarSign,
      gradient: "from-blue-500 to-indigo-500",
      description: "Payments, invoices & expenses",
      stat: stats ? `LKR ${stats.totalRevenue.toLocaleString()} collected` : "-",
      badge: stats?.pendingPayments ? "Unpaid" : "Clear",
      badgeColor: stats?.pendingPayments ? "bg-red-100 text-red-600 border-red-200" : "bg-blue-500/20 text-blue-600 border-blue-500/20",
    },
    {
      title: "Human Resources",
      href: "/admin/ims/hr",
      icon: UserCog,
      gradient: "from-purple-500 to-pink-500",
      description: "Staff, leaves & salary",
      stat: stats ? `${stats.pendingLeaves} pending leaves` : "-",
      badge: stats?.pendingLeaves ? `${stats.pendingLeaves} pending` : "All clear",
      badgeColor: stats?.pendingLeaves ? "bg-orange-500/20 text-orange-700 border-orange-500/20" : "bg-purple-100 text-purple-600 border-purple-200",
    },
    {
      title: "Staff Users",
      href: "/admin/ims/users",
      icon: Users,
      gradient: "from-cyan-500 to-blue-500",
      description: "Manage staff accounts & roles",
      stat: stats ? `${stats.totalStaff} staff members` : "-",
      badge: stats?.totalStaff ? `${stats.totalStaff}` : "0",
      badgeColor: "bg-cyan-500/20 text-cyan-700 border-cyan-500/20",
    },
    {
      title: "Tasks",
      href: "/admin/ims/tasks",
      icon: ListTodo,
      gradient: "from-yellow-500 to-orange-500",
      description: "Cross-department shared tasks",
      stat: stats ? `${stats.openTasks} open tasks` : "-",
      badge: stats?.openTasks ? `${stats.openTasks} open` : "All done",
      badgeColor: stats?.openTasks ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    {
      title: "Roster",
      href: "/admin/ims/roster",
      icon: Calendar,
      gradient: "from-pink-500 to-rose-500",
      description: "Duty & shift scheduling",
      stat: "Manage shifts",
      badge: "Roster",
      badgeColor: "bg-pink-100 text-pink-600 border-pink-200",
    },
    {
      title: "Control Panel",
      href: "/admin/ims/control-panel",
      icon: Terminal,
      gradient: "from-red-500 to-rose-500",
      description: "System commands & broadcast",
      stat: "Admin only",
      badge: "System",
      badgeColor: "bg-red-100 text-red-600 border-red-200",
    },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-blue-500/20">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-blue-500 to-sky-400 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Institute Management System</h2>
            <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-500 to-sky-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700">IMS Overview</h1>
            <p className="text-gray-500 text-sm hidden md:block">CADD Centre Lanka - Operations &amp; Management Hub</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QuickGuide
            guideKey="ims_overview_dashboard"
            dashboardName="IMS Overview"
            accentGradient="from-blue-600 to-sky-400"
            steps={imsGuideSteps}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors font-medium text-sm md:text-base">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Staff",    value: stats.totalStaff,      icon: Users,      color: "text-blue-600",   gradient: "from-blue-500 to-cyan-500" },
              { label: "Active Leads",   value: stats.activeLeads,     icon: TrendingUp, color: "text-orange-700", gradient: "from-orange-500 to-pink-500" },
              { label: "Revenue (LKR)",  value: stats.totalRevenue.toLocaleString(), icon: DollarSign, color: "text-emerald-700", gradient: "from-emerald-500 to-cyan-500" },
              { label: "Open Tasks",     value: stats.openTasks,       icon: ListTodo,   color: "text-yellow-700", gradient: "from-yellow-500 to-orange-500" },
            ].map((s, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} 
                className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl hover:shadow-md transition-all flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${s.gradient}`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900">{loading ? "…" : s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Enrollment Pipeline Status */}
        {(pipelineCounts.marketing > 0 || pipelineCounts.finance > 0 || pipelineCounts.academic > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" /> Enrollment Pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/ims/finance?tab=lead-confirmations">
                <div className={`relative p-5 rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                  pipelineCounts.marketing > 0 ? 'border-amber-300 bg-amber-50 hover:border-amber-400' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Finance</p>
                      <p className="text-2xl font-black text-gray-900">{pipelineCounts.marketing}</p>
                    </div>
                  </div>
                  {pipelineCounts.marketing > 0 && (
                    <p className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded-lg inline-block">
                      Marketing confirmed → needs payment verification
                    </p>
                  )}
                </div>
              </Link>

              <Link href="/admin/ims/academic?tab=lead-confirmations">
                <div className={`relative p-5 rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                  pipelineCounts.finance > 0 ? 'border-blue-300 bg-blue-50 hover:border-blue-400' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Academic</p>
                      <p className="text-2xl font-black text-gray-900">{pipelineCounts.finance}</p>
                    </div>
                  </div>
                  {pipelineCounts.finance > 0 && (
                    <p className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded-lg inline-block">
                      Finance verified → needs batch allocation
                    </p>
                  )}
                </div>
              </Link>

              <div className={`relative p-5 rounded-2xl border-2 transition-all ${
                pipelineCounts.academic > 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrolled</p>
                    <p className="text-2xl font-black text-gray-900">{pipelineCounts.academic}</p>
                  </div>
                </div>
                {pipelineCounts.academic > 0 && (
                  <p className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-1 rounded-lg inline-block">
                    ✓ Successfully enrolled this period
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Modules Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Home className="w-5 h-5"/> Departments &amp; Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, i) => (
              <Link key={mod.href} href={mod.href}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 h-full p-5 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mod.gradient} rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.gradient}`}>
                      <mod.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${mod.badgeColor.replace('/20', '/10').replace('text-', 'text-').replace('border-', 'border-')}`}>{mod.badge}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1 relative z-10">{mod.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 relative z-10">{mod.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 relative z-10">
                    <p className="text-xs font-semibold text-gray-600">{mod.stat}</p>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {stats && (stats.pendingLeaves > 0 || stats.openTasks > 0 || stats.convertedLeads > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white border border-orange-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" /> Attention Required
            </h2>
            <div className="space-y-3">
              {stats.pendingLeaves > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200 gap-3">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-5 w-5 text-orange-500 shrink-0" />
                    <span className="text-sm font-semibold text-orange-800">{stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} awaiting approval</span>
                  </div>
                  <Link href="/admin/ims/hr" className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-bold rounded-lg transition-colors text-center w-full sm:w-auto">Review</Link>
                </div>
              )}
              {stats.openTasks > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200 gap-3">
                  <div className="flex items-center gap-3">
                    <ListTodo className="h-5 w-5 text-yellow-600 shrink-0" />
                    <span className="text-sm font-semibold text-yellow-800">{stats.openTasks} task{stats.openTasks > 1 ? 's' : ''} pending completion</span>
                  </div>
                  <Link href="/admin/ims/tasks" className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs font-bold rounded-lg transition-colors text-center w-full sm:w-auto">View Tasks</Link>
                </div>
              )}
              {stats.convertedLeads > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">{stats.convertedLeads} lead{stats.convertedLeads > 1 ? 's' : ''} converted to enrollment</span>
                  </div>
                  <Link href="/admin/ims/marketing" className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold rounded-lg transition-colors">View Leads</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}


