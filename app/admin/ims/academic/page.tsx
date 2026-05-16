"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  GraduationCap, Users, BookOpen, CalendarDays,
  CheckCircle, List, Calendar, User, LogOut,
  Building2, Menu, Clock, TrendingUp, BarChart3,
  Activity, Layers
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { getCurrentUser, signOut } from "@/lib/auth"
import { getLeadConfirmations } from "@/lib/ims-data"
import { getLecturersProfiles } from "@/lib/data"
import type { ImsAcademicStudent, Lecturer } from "@/types"

import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import IMSTasksPage from "../tasks/page"

import BatchesView from "@/components/ims/academic/BatchesView"
import StudentsView from "@/components/ims/academic/StudentsView"
import LecturersView from "@/components/ims/academic/LecturersView"
import CoursesView from "@/components/ims/academic/CoursesView"

interface AcademicCourse { id: string; name: string; duration: string; fee: number; instructor: string; schedule: string; created_at: string }
interface AcademicBatch { id: string; name: string; course_id: string; course_name: string; start_date: string; end_date: string; student_ids: string[]; created_at: string }

export default function AcademicDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview") // will be overridden for lecturer after auth
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [students, setStudents] = useState<ImsAcademicStudent[]>([])
  const [courses, setCourses] = useState<AcademicCourse[]>([])
  const [batches, setBatches] = useState<AcademicBatch[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [leadConfirmationCount, setLeadConfirmationCount] = useState(0)
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0, late: 0 })
  const [enrollmentStats, setEnrollmentStats] = useState({ confirmed: 0, pending: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: stu }, { data: cou }, { data: bat }, { data: enr }, 
        { data: attData }, cu, lecs, lcData
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "student"),
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("batches").select("*").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("course_id, batch_id, status"),
        supabase.from("attendance").select("status"),
        getCurrentUser(),
        getLecturersProfiles(),
        getLeadConfirmations('finance_confirmed'),
      ])
      
      const enrollments = enr || []
      const attendance = attData || []
      setStudents(stu || [])
      setCourses((cou || []).map((c: any) => ({ 
        ...c, 
        name: c.title,
        enrolled_count: enrollments.filter((e: any) => e.course_id === c.id).length
      })))
      setBatches((bat || []).map((b: any) => ({ 
        ...b, 
        enrolled_count: enrollments.filter((e: any) => e.batch_id === b.id).length 
      })))
      setCurrentUser(cu)
      setLecturers(lecs)
      setLeadConfirmationCount(lcData.length)
      // Lecturer should default to batches (attendance) tab
      if (cu?.role === 'lecturer') setActiveTab(prev => prev === 'overview' ? 'batches' : prev)
      
      // Attendance stats
      setAttendanceStats({
        total: attendance.length,
        present: attendance.filter((a: any) => a.status === 'present').length,
        absent: attendance.filter((a: any) => a.status === 'absent').length,
        late: attendance.filter((a: any) => a.status === 'late').length,
      })
      
      // Enrollment stats
      setEnrollmentStats({
        confirmed: enrollments.filter((e: any) => e.status === 'confirmed').length,
        pending: enrollments.filter((e: any) => e.status === 'pending').length,
        completed: enrollments.filter((e: any) => e.status === 'completed').length,
      })
    } catch (e: any) { 
      toast.error("Load failed: " + e.message) 
    } finally { 
      setLoading(false) 
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  
  useEffect(() => {
    const handleSwitchTab = (e: any) => setActiveTab(e.detail)
    window.addEventListener('switch-tab', handleSwitchTab)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) setActiveTab(tab)
    }
    return () => window.removeEventListener('switch-tab', handleSwitchTab)
  }, [])

  useEffect(() => { 
    const t = setTimeout(() => setShowLoadingAnimation(false), 2000); 
    return () => clearTimeout(t); 
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // ── SIDEBAR NAV: Only these 5 items under Academic ──
  const isLecturer = currentUser?.role === 'lecturer'

  const navSections = [
    {
      label: '🎓 Academic',
      items: [
        ...(isLecturer ? [] : [{ id: 'overview',       label: 'Overview',        icon: Building2,     badge: 0 }]),
        { id: 'batches',        label: 'Batches',         icon: CalendarDays,  badge: 0 },
        ...(isLecturer ? [] : [
          { id: 'students',       label: 'Students',        icon: Users,         badge: leadConfirmationCount },
          { id: 'lecturers',      label: 'Lecturer Panel',  icon: GraduationCap, badge: 0 },
          { id: 'courses',        label: 'Courses',         icon: BookOpen,      badge: 0 },
        ]),
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'tasks',          label: 'Tasks',            icon: List,         badge: 0 },
        { id: 'leave-requests', label: 'My Leaves',        icon: Calendar,     badge: 0 },
        { id: 'my-attendance',  label: 'My Attendance',    icon: Clock,        badge: 0 },
        { id: 'profile',        label: 'My Profile',       icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',       label: 'Calendar',         icon: Calendar,     badge: 0 },
      ]
    },
  ]

  if (loading && showLoadingAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-gray-900">Loading Academic Data...</h2>
        </div>
      </div>
    )
  }

  const attendanceRate = attendanceStats.total > 0 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-blue-100">
      
      {/* 📱 Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"><GraduationCap className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-lg">Academic</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 bg-gray-50 rounded-xl"><Menu className="w-5 h-5" /></button>
      </div>

      {/* 🚀 SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-gray-900">Academic</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CADD Centre Lanka</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <motion.button key={item.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                      activeTab === item.id ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                    {activeTab === item.id && <motion.div layoutId="ac-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />}
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 ${
                        activeTab === item.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                      }`}>{item.badge}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* 🌟 MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-gray-50 mt-16 md:mt-0">
        
        {/* ══════════════════════════════════════ */}
        {/* OVERVIEW TAB — Full Academic Summary */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-gray-900">Academic Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Complete summary of academic operations</p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Batches',   value: batches.length,   color: 'from-emerald-500 to-cyan-500',   icon: CalendarDays },
                { label: 'Total Students',  value: students.length,  color: 'from-blue-500 to-indigo-500',    icon: Users },
                { label: 'Total Courses',   value: courses.length,   color: 'from-purple-500 to-pink-500',    icon: BookOpen },
                { label: 'Lecturers',       value: lecturers.length, color: 'from-amber-500 to-orange-500',   icon: GraduationCap },
                { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'from-green-500 to-emerald-600', icon: BarChart3 },
                { label: 'Lead Confirms',   value: leadConfirmationCount, color: 'from-rose-500 to-red-500',  icon: CheckCircle },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] border border-gray-100 group hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Enrollment Breakdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Layers className="w-4 h-4 text-blue-600" /></div>
                  <h3 className="font-bold text-gray-900">Enrollment Status</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Confirmed', value: enrollmentStats.confirmed, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    { label: 'Pending', value: enrollmentStats.pending, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                    { label: 'Completed', value: enrollmentStats.completed, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                  ].map(s => {
                    const total = enrollmentStats.confirmed + enrollmentStats.pending + enrollmentStats.completed
                    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                    return (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-20 ${s.text}`}>{s.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-8 text-right">{s.value}</span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Attendance Breakdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><Activity className="w-4 h-4 text-green-600" /></div>
                  <h3 className="font-bold text-gray-900">Attendance Activity</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Present', value: attendanceStats.present, color: 'bg-green-500' },
                    { label: 'Late', value: attendanceStats.late, color: 'bg-amber-500' },
                    { label: 'Absent', value: attendanceStats.absent, color: 'bg-red-500' },
                  ].map(s => {
                    const pct = attendanceStats.total > 0 ? Math.round((s.value / attendanceStats.total) * 100) : 0
                    return (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-16 text-gray-600">{s.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-12 text-right">{s.value} <span className="text-xs text-gray-400">({pct}%)</span></span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3 font-medium">Total records: {attendanceStats.total}</p>
              </motion.div>

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-purple-600" /></div>
                  <h3 className="font-bold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Manage Batches', tab: 'batches', icon: CalendarDays, color: 'from-emerald-500 to-cyan-500' },
                    { label: 'View Students', tab: 'students', icon: Users, color: 'from-blue-500 to-indigo-500' },
                    { label: 'Course Catalog', tab: 'courses', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
                    { label: 'Lecturer Panel', tab: 'lecturers', icon: GraduationCap, color: 'from-amber-500 to-orange-500' },
                  ].map(action => (
                    <button
                      key={action.tab}
                      onClick={() => setActiveTab(action.tab)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recent Batches Quick View */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-cyan-600" /></div>
                  <h3 className="font-bold text-gray-900">Recent Batches</h3>
                </div>
                <button onClick={() => setActiveTab('batches')} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors">
                  View All →
                </button>
              </div>
              {batches.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No batches created yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {batches.slice(0, 4).map((batch: any) => (
                    <div key={batch.id} onClick={() => setActiveTab('batches')}
                      className="p-4 rounded-xl bg-gray-50 hover:bg-cyan-50/50 border border-gray-100 hover:border-cyan-200 cursor-pointer transition-all group">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{batch.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'N/A'}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <span className="text-xs font-medium text-gray-500">{batch.enrolled_count || 0} students</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          batch.status === 'active' ? 'bg-green-100 text-green-700' :
                          batch.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{batch.status || 'upcoming'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* MODULAR VIEWS */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'batches' && <BatchesView courses={courses.map(c => ({ id: c.id, name: c.name }))} lecturers={lecturers} />}
        {activeTab === 'students' && <StudentsView />}
        {activeTab === 'lecturers' && <LecturersView />}
        {activeTab === 'courses' && <CoursesView />}

        {/* MY WORK / TOOLS */}
        {activeTab === 'calendar' && <SriLankaCalendar accentColor="emerald" />}
        {activeTab === 'leave-requests' && <LeaveRequestsView />}
        {activeTab === 'my-attendance' && (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
            <StaffAttendance />
          </div>
        )}
        {activeTab === 'profile' && currentUser && (
          <ProfileSection userData={currentUser} />
        )}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
            <IMSTasksPage embedded={true} />
          </div>
        )}

      </main>
    </div>
  )
}
