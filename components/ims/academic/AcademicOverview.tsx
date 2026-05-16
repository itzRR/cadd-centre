"use client"

import { motion } from "framer-motion"
import { Users, BookOpen, CalendarDays, UserCheck, TrendingUp, AlertTriangle, Activity, BarChart3, Clock } from "lucide-react"
import { getAcademicStats } from "@/lib/academic-store"

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function AcademicOverview() {
  const stats = getAcademicStats()

  const cards = [
    { title: "Total Batches", value: stats.totalBatches, icon: CalendarDays, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-700" },
    { title: "Total Students", value: stats.totalStudents, icon: Users, gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    { title: "Total Lecturers", value: stats.totalLecturers, icon: UserCheck, gradient: "from-purple-500 to-indigo-500", bg: "bg-purple-50", text: "text-purple-700" },
    { title: "Total Courses", value: stats.totalCourses, icon: BookOpen, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50", text: "text-orange-700" },
    { title: "Active Batches", value: stats.activeBatches, icon: TrendingUp, gradient: "from-green-500 to-emerald-500", bg: "bg-green-50", text: "text-green-700" },
    { title: "Completed", value: stats.completedBatches, icon: BarChart3, gradient: "from-cyan-500 to-blue-500", bg: "bg-cyan-50", text: "text-cyan-700" },
    { title: "Upcoming", value: stats.upcomingBatches, icon: Clock, gradient: "from-yellow-500 to-orange-500", bg: "bg-yellow-50", text: "text-yellow-700" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Academic Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Summary of all academic operations</p>
      </div>

      {/* Stats Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card, i) => (
          <motion.div variants={item} key={i} className="bg-white border border-gray-200 rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:border-gray-300 transition-all">
            <div className={`absolute top-0 right-0 w-16 h-16 ${card.bg} rounded-full -mr-4 -mt-4 opacity-50 group-hover:opacity-80 transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.title}</p>
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-black ${card.text}`}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Batch Attendance Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Batch Attendance</h3>
                <p className="text-[10px] text-gray-400">Top 5 batches</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {stats.batchAttendance.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No attendance data yet</p>
            ) : stats.batchAttendance.map((ba, i) => (
              <div key={ba.batchId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 truncate">{ba.batchName}</span>
                  <span className={`font-bold ${ba.rate >= 75 ? 'text-green-600' : ba.rate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{ba.rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${ba.rate}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${ba.rate >= 75 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : ba.rate >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-red-400 to-rose-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Batch Performance Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Batch Performance</h3>
                <p className="text-[10px] text-gray-400">Average assessment scores</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {stats.batchPerformance.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No assessment data yet</p>
            ) : stats.batchPerformance.map((bp) => (
              <div key={bp.batchId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{bp.batchName}</p>
                  <p className="text-[10px] text-gray-400">{bp.totalAssessments} assessments</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-purple-600">{bp.avgScore}</p>
                  <p className="text-[10px] text-gray-400">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
              <p className="text-[10px] text-gray-400">Last 10 actions</p>
            </div>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No activity yet. Start by adding courses, students, or batches.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{a.action}</span> {a.entityType}: <span className="font-medium text-emerald-700">{a.entityName}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Pending Actions</h3>
              <p className="text-[10px] text-gray-400">Issues needing attention</p>
            </div>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {stats.alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-green-600 font-medium text-sm">All clear!</p>
                <p className="text-gray-400 text-xs mt-1">No pending actions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{alert}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
