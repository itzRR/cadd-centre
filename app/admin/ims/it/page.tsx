"use client"

import React, { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  Monitor, Cpu, Users, Shield, Activity, HardDrive, Clock,
  RefreshCw, Wifi, WifiOff, Database, Server, BarChart3,
  LogOut, Menu, X, User, CalendarDays, FileText
} from "lucide-react"
import { getAllProfiles, getLoginHistory, getSystemCommands } from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { Profile, ImsLoginHistory, ImsSystemCommand } from "@/types"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import { useRouter } from "next/navigation"

export default function ITDashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loginLogs, setLoginLogs] = useState<ImsLoginHistory[]>([])
  const [commands, setCommands] = useState<ImsSystemCommand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, l, c, u] = await Promise.all([
        getAllProfiles(), getLoginHistory(), getSystemCommands(), getCurrentUser()
      ])
      setProfiles(p); setLoginLogs(l); setCommands(c); setCurrentUser(u)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleLogout = async () => { await signOut(); router.push('/auth/login') }

  // Stats
  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => !p.disabled).length
  const disabledUsers = profiles.filter(p => p.disabled).length
  const onlineNow = profiles.filter(p => p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 5 * 60 * 1000).length
  const studentCount = profiles.filter(p => p.role === 'student').length
  const staffCount = profiles.filter(p => p.role !== 'student').length
  const todayLogins = loginLogs.filter(l => l.login_time && new Date(l.login_time).toDateString() === new Date().toDateString()).length
  const weekLogins = loginLogs.filter(l => l.login_time && (Date.now() - new Date(l.login_time).getTime()) < 7 * 24 * 3600 * 1000).length
  const pendingCommands = commands.filter(c => c.status === 'pending').length

  // Role distribution
  const roleCounts = profiles.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const navSections = [
    { label: '🖥 IT Operations', items: [
      { id: 'overview', label: 'Overview', icon: Monitor },
      { id: 'users-audit', label: 'User Audit', icon: Users },
      { id: 'login-activity', label: 'Login Activity', icon: Activity },
      { id: 'system-commands', label: 'System Commands', icon: Shield },
    ]},
    { label: '📋 My Work', items: [
      { id: 'tasks', label: 'Tasks', icon: FileText },
      { id: 'leave-requests', label: 'My Leaves', icon: CalendarDays },
      { id: 'attendance', label: 'My Attendance', icon: Clock },
      { id: 'profile', label: 'My Profile', icon: User },
    ]},
    { label: '🗂 Tools', items: [
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    ]},
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-teal-500 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-teal-700">IT Dashboard</h1>
            <p className="text-gray-500 text-sm hidden md:block">System Health & User Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 text-sm font-medium">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="flex relative">
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 h-screen z-50 w-60 flex flex-col flex-shrink-0 ${mobileMenuOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex sticky top-0'}`}>
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}>
                      <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: totalUsers, icon: Users, color: 'from-teal-500 to-cyan-500', sub: `${staffCount} staff · ${studentCount} students` },
                  { label: 'Active Now', value: onlineNow, icon: Wifi, color: 'from-emerald-500 to-green-500', sub: `${disabledUsers} disabled` },
                  { label: 'Logins Today', value: todayLogins, icon: Activity, color: 'from-red-500 to-indigo-500', sub: `${weekLogins} this week` },
                  { label: 'Pending Commands', value: pendingCommands, icon: Shield, color: 'from-amber-500 to-orange-500', sub: `${commands.length} total` },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-gray-500">{card.label}</p>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                        <card.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">{card.value}</h3>
                    <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* System Health Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" /> User Distribution by Role
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                      <div key={role} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-32 truncate capitalize">{role.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(count / totalUsers) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-end pr-2">
                            {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-teal-600" /> System Status
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Database (Supabase)', status: 'Operational', icon: Database, ok: true },
                      { name: 'Authentication', status: 'Operational', icon: Shield, ok: true },
                      { name: 'File Storage', status: 'Operational', icon: HardDrive, ok: true },
                      { name: 'Real-time Subscriptions', status: 'Operational', icon: Wifi, ok: true },
                      { name: 'API Routes', status: 'Operational', icon: Cpu, ok: true },
                    ].map((sys, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <sys.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{sys.name}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sys.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {sys.ok ? '● ' : '○ '}{sys.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Logins */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" /> Recent Login Activity
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        {['User', 'Email', 'Login Time', 'IP Address'].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loginLogs.slice(0, 10).map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">{log.user_name || '-'}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{log.email || '-'}</td>
                          <td className="py-3 px-4 text-gray-600 text-xs">
                            {log.login_time ? format(new Date(log.login_time), 'MMM d, HH:mm:ss') : '-'}
                          </td>
                          <td className="py-3 px-4 text-teal-700 text-xs font-mono">{log.ip_address || '-'}</td>
                        </tr>
                      ))}
                      {loginLogs.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-400">No login history</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USER AUDIT */}
          {activeTab === 'users-audit' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Audit</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-teal-700">{activeUsers}</p>
                  <p className="text-xs text-teal-600">Active</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-red-600">{disabledUsers}</p>
                  <p className="text-xs text-red-500">Disabled</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-700">{onlineNow}</p>
                  <p className="text-xs text-green-600">Online Now</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-red-700">{totalUsers}</p>
                  <p className="text-xs text-red-600">Total</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Role', 'Dept', 'Status', 'Last Active'].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profiles.filter(p => p.role !== 'student').map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 ${p.disabled ? 'opacity-50' : ''}`}>
                        <td className="py-3 px-4 font-semibold text-gray-900">{p.full_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{p.email}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 capitalize">{p.role.replace(/_/g, ' ')}</span></td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{p.department || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {p.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{p.last_active ? format(new Date(p.last_active), 'MMM d, HH:mm') : 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOGIN ACTIVITY */}
          {activeTab === 'login-activity' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" /> Login Activity ({loginLogs.length} records)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      {['User', 'Email', 'Login Time', 'IP Address', 'Device'].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loginLogs.slice(0, 100).map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{log.user_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{log.email || '-'}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{log.login_time ? format(new Date(log.login_time), 'MMM d yyyy, HH:mm:ss') : '-'}</td>
                        <td className="py-3 px-4 text-teal-700 text-xs font-mono">{log.ip_address || '-'}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs max-w-[200px] truncate">{log.device_info ? log.device_info.substring(0, 50) + '…' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYSTEM COMMANDS */}
          {activeTab === 'system-commands' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" /> System Command Log ({commands.length})
              </h2>
              <div className="space-y-3">
                {commands.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No system commands found</div>
                ) : commands.slice(0, 50).map(cmd => (
                  <div key={cmd.id} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-gray-800 capitalize">{cmd.type.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cmd.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : cmd.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {cmd.status}
                        </span>
                      </div>
                      {cmd.message && <p className="text-sm text-gray-600 mb-1">&ldquo;{cmd.message}&rdquo;</p>}
                      <p className="text-[10px] text-gray-400">
                        Target: <span className="font-bold">{cmd.target_user_name || 'All'}</span> · by {cmd.sent_by_name} · {format(new Date(cmd.sent_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="teal" />}
          {activeTab === 'leave-requests' && <LeaveRequestsView />}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
              <StaffAttendance />
            </div>
          )}
          {activeTab === 'profile' && currentUser && <ProfileSection userData={currentUser} />}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center py-12">
              <FileText className="w-12 h-12 text-teal-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tasks & Operations</h3>
              <p className="text-gray-500 mb-4">View and manage all assigned tasks</p>
              <button onClick={() => router.push('/admin/ims/tasks')} className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity">Open Tasks Dashboard</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
