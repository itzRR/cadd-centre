"use client"

import React, { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Monitor, Cpu, Users, Shield, Activity, HardDrive, Clock,
  RefreshCw, Wifi, Database, Server, BarChart3, Lock, AlertTriangle,
  LogOut, Menu, X, User, CalendarDays, FileText, Terminal, Network
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

  // Simulated Live Metrics State
  const [cpuUsage, setCpuUsage] = useState(34)
  const [ramUsage, setRamUsage] = useState(62)
  const [networkIn, setNetworkIn] = useState(14.2)
  const [networkOut, setNetworkOut] = useState(8.5)
  const [liveDataHistory, setLiveDataHistory] = useState<number[]>(Array(20).fill(30))

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

  // Live Metrics Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.min(100, Math.max(10, prev + (Math.random() * 10 - 5))))
      setRamUsage(prev => Math.min(100, Math.max(40, prev + (Math.random() * 4 - 2))))
      setNetworkIn(prev => Math.max(1, prev + (Math.random() * 6 - 3)))
      setNetworkOut(prev => Math.max(1, prev + (Math.random() * 4 - 2)))
      setLiveDataHistory(prev => {
        const next = [...prev.slice(1), cpuUsage]
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [cpuUsage])

  const handleLogout = async () => { await signOut(); router.push('/auth/login') }

  // Stats
  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => !p.disabled).length
  const disabledUsers = profiles.filter(p => p.disabled).length
  const onlineNow = profiles.filter(p => p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 5 * 60 * 1000).length
  const todayLogins = loginLogs.filter(l => l.login_time && new Date(l.login_time).toDateString() === new Date().toDateString()).length
  
  // Security Mocks
  const failedLogins = Math.floor(todayLogins * 0.15) // Simulate 15% failure rate
  const blockedIPs = 24

  const navSections = [
    { label: '🖥 IT Operations', items: [
      { id: 'overview', label: 'System Overview', icon: Monitor },
      { id: 'infrastructure', label: 'Infrastructure', icon: Server },
      { id: 'security', label: 'Security & SOC', icon: Shield },
      { id: 'users-audit', label: 'User Audit', icon: Users },
      { id: 'system-commands', label: 'Command Line', icon: Terminal },
    ]},
    { label: '📋 My Work', items: [
      { id: 'tasks', label: 'Tasks', icon: FileText },
      { id: 'leave-requests', label: 'My Leaves', icon: CalendarDays },
      { id: 'attendance', label: 'My Attendance', icon: Clock },
      { id: 'profile', label: 'My Profile', icon: User },
    ]},
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">IT Operations</h1>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest hidden md:block">System Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-700">All Systems Operational</span>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 text-sm font-bold shadow-sm transition-all">
            <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Sync Data</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 text-sm font-bold transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex relative max-w-[1600px] mx-auto">
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 min-h-[calc(100vh-88px)] z-50 w-64 flex flex-col flex-shrink-0 ${mobileMenuOpen ? 'fixed inset-y-0 left-0 mt-[88px]' : 'hidden md:flex sticky top-[88px]'}`}>
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-3 px-2">{section.label}</p>
                <div className="space-y-1">
                  {section.items.map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}>
                      <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+3 this week" },
                      { title: "Active Sessions", value: onlineNow, icon: Activity, color: "text-green-600", bg: "bg-green-50", trend: "Live" },
                      { title: "Avg Latency", value: "42ms", icon: Wifi, color: "text-purple-600", bg: "bg-purple-50", trend: "Optimal" },
                      { title: "Failed Logins", value: failedLogins, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", trend: "Normal limits" },
                    ].map((kpi, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${kpi.bg}`}>
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.trend}</span>
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-gray-900">{kpi.value}</h3>
                          <p className="text-sm font-semibold text-gray-500 mt-1">{kpi.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Database Health */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500"/> Core Infrastructure Health</h3>
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">All Systems Normal</span>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { name: 'Primary Database', desc: 'Supabase PostgreSQL', status: 'Healthy', ping: '12ms' },
                          { name: 'Authentication Auth', desc: 'JWT Token Service', status: 'Healthy', ping: '24ms' },
                          { name: 'Storage Buckets', desc: 'AWS S3 Backed', status: 'Healthy', ping: '45ms' },
                          { name: 'Edge Functions', desc: 'Vercel Serverless', status: 'Healthy', ping: '18ms' }
                        ].map((sys, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{sys.name}</span>
                              <span className="text-xs font-medium text-gray-500">{sys.desc}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono text-gray-400">{sys.ping}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-bold text-gray-700">{sys.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Terminal className="w-5 h-5 text-gray-500"/> Quick Tools</h3>
                      <div className="space-y-3">
                        <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                          <p className="font-bold text-gray-900 group-hover:text-blue-700">Force Global Refresh</p>
                          <p className="text-xs text-gray-500 mt-1">Clears frontend cache for all active clients.</p>
                        </button>
                        <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group">
                          <p className="font-bold text-gray-900 group-hover:text-red-700">Purge Inactive Sessions</p>
                          <p className="text-xs text-gray-500 mt-1">Logs out users inactive for &gt;24 hours.</p>
                        </button>
                        <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                          <p className="font-bold text-gray-900 group-hover:text-indigo-700">Trigger DB Backup</p>
                          <p className="text-xs text-gray-500 mt-1">Initiates an immediate PG dump to S3.</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INFRASTRUCTURE TAB */}
              {activeTab === 'infrastructure' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Compute Resource */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-600"/> Compute Resources</h3>
                      
                      <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-gray-500">CPU Allocation (8 Cores)</span>
                          <span className="text-2xl font-black text-gray-900 font-mono">{cpuUsage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className={`h-full ${cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 60 ? 'bg-amber-500' : 'bg-blue-500'}`} animate={{ width: `${cpuUsage}%` }} transition={{ type: "spring", stiffness: 100 }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-gray-500">Memory Usage (16GB)</span>
                          <span className="text-2xl font-black text-gray-900 font-mono">{ramUsage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-indigo-500" animate={{ width: `${ramUsage}%` }} transition={{ type: "spring", stiffness: 100 }} />
                        </div>
                      </div>
                    </div>

                    {/* Network Activity */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Network className="w-5 h-5 text-emerald-600"/> Network Throughput</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Inbound</p>
                          <p className="text-3xl font-black text-gray-900 font-mono">{networkIn.toFixed(1)} <span className="text-sm text-gray-400 font-sans">Mbps</span></p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Outbound</p>
                          <p className="text-3xl font-black text-gray-900 font-mono">{networkOut.toFixed(1)} <span className="text-sm text-gray-400 font-sans">Mbps</span></p>
                        </div>
                      </div>

                      <div className="h-24 w-full flex items-end gap-1 px-2 border-b border-gray-200 pb-2">
                        {liveDataHistory.map((val, i) => (
                          <motion.div key={i} className="flex-1 bg-gradient-to-t from-blue-100 to-blue-300 rounded-t-sm" animate={{ height: `${val}%` }} transition={{ type: "tween", duration: 0.2 }} />
                        ))}
                      </div>
                      <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Live Activity Chart</p>
                    </div>

                    {/* Storage Breakdown */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><HardDrive className="w-5 h-5 text-gray-600"/> Storage Allocation (250GB Total)</h3>
                      
                      <div className="w-full h-8 flex rounded-xl overflow-hidden mb-4 shadow-inner">
                        <div className="bg-blue-500 h-full" style={{ width: '45%' }} title="Student Data (112GB)" />
                        <div className="bg-indigo-500 h-full" style={{ width: '25%' }} title="Course Materials (62GB)" />
                        <div className="bg-emerald-500 h-full" style={{ width: '15%' }} title="System Logs (37GB)" />
                        <div className="bg-gray-200 h-full" style={{ width: '15%' }} title="Free Space (39GB)" />
                      </div>
                      
                      <div className="flex flex-wrap gap-6 justify-center mt-6">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-sm font-bold text-gray-600">Student Data (45%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-500" /><span className="text-sm font-bold text-gray-600">Course Materials (25%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-sm font-bold text-gray-600">Logs & Backups (15%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-200" /><span className="text-sm font-bold text-gray-600">Available (15%)</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY & SOC TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                      <h3 className="text-sm font-black text-red-500 uppercase tracking-widest relative z-10 mb-2">Threat Level</h3>
                      <p className="text-4xl font-black text-gray-900 relative z-10">Low</p>
                      <p className="text-sm font-semibold text-gray-500 relative z-10 mt-1">No active breaches detected</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Failed Logins (24h)</h3>
                      <p className="text-4xl font-black text-gray-900 font-mono">{failedLogins}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Blocked IPs</h3>
                      <p className="text-4xl font-black text-gray-900 font-mono">{blockedIPs}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-teal-600"/> Access Logs</h3>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Export CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left py-4 px-4 font-black">User / Event</th>
                            <th className="text-left py-4 px-4 font-black">Time</th>
                            <th className="text-left py-4 px-4 font-black">IP Address</th>
                            <th className="text-left py-4 px-4 font-black">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loginLogs.slice(0, 15).map(log => {
                            const isFailed = Math.random() > 0.9; // Simulate a few failed logs
                            return (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-gray-900">{log.user_name || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500">{log.email || 'No email'}</p>
                                </td>
                                <td className="py-4 px-4 text-gray-600 font-medium">
                                  {log.login_time ? format(new Date(log.login_time), 'MMM d, HH:mm:ss') : '-'}
                                </td>
                                <td className="py-4 px-4 text-gray-500 font-mono text-xs">{log.ip_address || '192.168.1.1'}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isFailed ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                    {isFailed ? 'Failed' : 'Success'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* USER AUDIT TAB */}
              {activeTab === 'users-audit' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> System Accounts</h2>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <span>{totalUsers} Total</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left py-4 px-4 font-black">Account Info</th>
                          <th className="text-left py-4 px-4 font-black">Role & Dept</th>
                          <th className="text-left py-4 px-4 font-black">Status</th>
                          <th className="text-right py-4 px-4 font-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {profiles.filter(p => p.role !== 'student').map(p => (
                          <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.disabled ? 'opacity-60 bg-gray-50/50' : ''}`}>
                            <td className="py-4 px-4">
                              <p className="font-bold text-gray-900">{p.full_name || 'Unnamed Staff'}</p>
                              <p className="text-xs text-gray-500">{p.email}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-black uppercase tracking-wider mb-1">
                                {p.role.replace(/_/g, ' ')}
                              </span>
                              <p className="text-xs text-gray-500 font-medium">{p.department || 'No Dept'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${p.disabled ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${p.disabled ? 'bg-red-500' : 'bg-green-500'}`} />
                                {p.disabled ? 'Disabled' : 'Active'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                View Logs
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SYSTEM COMMANDS TAB */}
              {activeTab === 'system-commands' && (
                <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden font-mono text-sm">
                  <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="ml-4 text-gray-400 text-xs font-bold tracking-widest">root@cadd-ims:~</span>
                    </div>
                    <Terminal className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="p-6 h-[600px] overflow-y-auto custom-scrollbar space-y-3">
                    <p className="text-green-400 mb-6">CADD IMS Administrative Terminal v2.4.0<br/>Type 'help' for a list of available commands.</p>
                    
                    {commands.length === 0 ? (
                      <p className="text-gray-500 italic">No system commands found in log.</p>
                    ) : commands.slice(0, 50).map((cmd, idx) => (
                      <div key={cmd.id} className="text-gray-300">
                        <span className="text-blue-400">[{format(new Date(cmd.sent_at), 'yyyy-MM-dd HH:mm:ss')}]</span> 
                        <span className="text-purple-400 ml-2">{cmd.sent_by_name}</span>
                        <span className="text-gray-500"> executed </span>
                        <span className="text-yellow-300 font-bold">{cmd.type}</span>
                        {cmd.message && <span className="text-green-300 ml-2">&gt; "{cmd.message}"</span>}
                        <br/>
                        <span className="text-gray-600">↳ Target: {cmd.target_user_name || 'GLOBAL'} | Status: <span className={cmd.status === 'delivered' ? 'text-green-500' : 'text-gray-400'}>[{cmd.status.toUpperCase()}]</span></span>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-6 animate-pulse">
                      <span className="text-green-400">root@cadd-ims:~#</span>
                      <div className="w-2 h-4 bg-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* PERSONAL TABS */}
              {activeTab === 'calendar' && <SriLankaCalendar accentColor="blue" />}
              {activeTab === 'leave-requests' && <LeaveRequestsView />}
              {activeTab === 'attendance' && (
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                  <h2 className="text-xl font-black text-gray-900 mb-6">My Attendance Record</h2>
                  <StaffAttendance />
                </div>
              )}
              {activeTab === 'profile' && currentUser && <ProfileSection userData={currentUser} />}
              {activeTab === 'tasks' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center py-16">
                  <FileText className="w-16 h-16 text-blue-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Task Management</h3>
                  <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">Track, manage, and complete your assigned operational tasks.</p>
                  <button onClick={() => router.push('/admin/ims/tasks')} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg">
                    Open Tasks Workspace
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
