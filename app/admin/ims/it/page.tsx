"use client"

import React, { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Monitor, Cpu, Users, Shield, Activity, HardDrive, Clock,
  RefreshCw, Wifi, Database, Server, BarChart3, Lock, AlertTriangle,
  LogOut, Menu, X, User, CalendarDays, FileText, Terminal, Network, Calendar
} from "lucide-react"
import { getAllProfiles, getLoginHistory, getSystemCommands } from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { Profile, ImsLoginHistory, ImsSystemCommand } from "@/types"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import { useRouter } from "next/navigation"
import IMSTasksPage from "../tasks/page"

export default function ITDashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loginLogs, setLoginLogs] = useState<ImsLoginHistory[]>([])
  const [commands, setCommands] = useState<ImsSystemCommand[]>([])
  const [storageData, setStorageData] = useState<{ totalSizeBytes: number, bucketSizes: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modals & Terminal
  const [viewingLogsFor, setViewingLogsFor] = useState<Profile | null>(null)
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalOutput, setTerminalOutput] = useState<{text: string, isCommand: boolean}[]>([
    { text: "CADD IMS Administrative Terminal v2.4.0", isCommand: false },
    { text: "Type 'help' for a list of available commands.", isCommand: false }
  ])
  const terminalEndRef = React.useRef<HTMLDivElement>(null)

  // Simulated Live Metrics State
  const [cpuUsage, setCpuUsage] = useState(34)
  const [ramUsage, setRamUsage] = useState(62)
  const [networkIn, setNetworkIn] = useState(14.2)
  const [networkOut, setNetworkOut] = useState(8.5)
  const [liveDataHistory, setLiveDataHistory] = useState<number[]>(Array(20).fill(30))

  const [latencyDb, setLatencyDb] = useState(12)
  const [latencyAuth, setLatencyAuth] = useState(24)
  const [latencyStorage, setLatencyStorage] = useState(45)
  const [latencyEdge, setLatencyEdge] = useState(18)

  // SOC Live Metrics
  const [socFailedLogins, setSocFailedLogins] = useState(0)
  const [socBlockedIPs, setSocBlockedIPs] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, l, c, u, s] = await Promise.all([
        getAllProfiles(), getLoginHistory(), getSystemCommands(), getCurrentUser(),
        fetch('/api/ims/storage').then(r => r.json()).catch(() => null)
      ])
      setProfiles(p); setLoginLogs(l); setCommands(c); setCurrentUser(u)
      if (s?.success) setStorageData(s)
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
      setLatencyDb(prev => Math.max(8, prev + Math.floor(Math.random() * 5) - 2))
      setLatencyAuth(prev => Math.max(15, prev + Math.floor(Math.random() * 7) - 3))
      setLatencyStorage(prev => Math.max(30, prev + Math.floor(Math.random() * 10) - 5))
      setLatencyEdge(prev => Math.max(10, prev + Math.floor(Math.random() * 6) - 3))

      setLiveDataHistory(prev => {
        const next = [...prev.slice(1), cpuUsage]
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [cpuUsage])

  const handleLogout = async () => { await signOut(); router.push('/auth/login') }

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!terminalInput.trim()) return
    const cmd = terminalInput.trim().toLowerCase()
    const newOutput = [...terminalOutput, { text: `root@cadd-ims:~# ${cmd}`, isCommand: true }]
    
    if (cmd === 'clear') {
      setTerminalOutput([])
    } else if (cmd === 'help') {
      setTerminalOutput([...newOutput, 
        { text: "Available commands:", isCommand: false },
        { text: "  help    - Show this message", isCommand: false },
        { text: "  clear   - Clear terminal output", isCommand: false },
        { text: "  whoami  - Show current user info", isCommand: false },
        { text: "  date    - Show system date/time", isCommand: false },
        { text: "  ping    - Test system connectivity", isCommand: false },
        { text: "  status  - Show active system metrics", isCommand: false },
        { text: "  ls      - List directories", isCommand: false }
      ])
    } else if (cmd === 'whoami') {
      setTerminalOutput([...newOutput, { text: currentUser?.email || "root", isCommand: false }])
    } else if (cmd === 'date') {
      setTerminalOutput([...newOutput, { text: new Date().toString(), isCommand: false }])
    } else if (cmd === 'ping') {
      setTerminalOutput([...newOutput, { text: "PONG! 1ms", isCommand: false }])
    } else if (cmd === 'ls') {
      setTerminalOutput([...newOutput, { text: "bin  boot  dev  etc  home  lib  opt  root  run  sbin  tmp  usr  var", isCommand: false }])
    } else if (cmd === 'status') {
      setTerminalOutput([...newOutput, { text: `CPU: ${cpuUsage.toFixed(1)}% | RAM: ${ramUsage.toFixed(1)}% | Network: ${networkIn.toFixed(1)}M/s`, isCommand: false }])
    } else {
      setTerminalOutput([...newOutput, { text: `Command not found: ${cmd}`, isCommand: false }])
    }
    setTerminalInput("")
    setTimeout(() => terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleQuickTool = (action: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)),
      {
        loading: `Executing: ${action}...`,
        success: `${action} completed successfully across all nodes.`,
        error: `Failed to execute ${action}`
      }
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Stats
  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => !p.disabled).length
  const disabledUsers = profiles.filter(p => p.disabled).length
  const onlineNow = profiles.filter(p => p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 5 * 60 * 1000).length
  const todayLogins = loginLogs.filter(l => l.login_time && new Date(l.login_time).toDateString() === new Date().toDateString()).length

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
      { id: 'calendar', label: 'Calendar', icon: Calendar },
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

      <div className="flex relative w-full">
        {/* Mobile Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
          onClick={() => setMobileMenuOpen(false)} 
        />

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-[88px] left-0 h-[calc(100vh-88px)] w-[280px] bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 z-50 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          {mobileMenuOpen && (
            <div className="flex justify-end p-3 md:hidden">
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <Menu size={20} className="hidden" /> {/* just placeholder */}
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
          )}

          <div className="px-5 pt-6 pb-5 border-b border-white/10 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-lg shadow-blue-500/20">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0).toUpperCase() || 'I'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-blue-400 text-sm font-bold truncate">System Admin</p>
                <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-widest font-bold">CCL Taskflow</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-3">{section.label}</p>
                <div className="space-y-1">
                  {section.items.map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm relative group font-bold ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}>
                      {activeTab === item.id && (
                        <motion.div layoutId="it-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                      <span className="flex-1 text-left">{item.label}</span>
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
                      { title: "Avg Latency", value: `${Math.floor((latencyDb + latencyAuth + latencyStorage + latencyEdge) / 4)}ms`, icon: Wifi, color: "text-purple-600", bg: "bg-purple-50", trend: "Optimal" },
                      { title: "Failed Logins", value: socFailedLogins, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", trend: "Normal limits" },
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
                          { name: 'Primary Database', desc: 'Supabase PostgreSQL', status: 'Healthy', ping: `${latencyDb}ms` },
                          { name: 'Authentication Auth', desc: 'JWT Token Service', status: 'Healthy', ping: `${latencyAuth}ms` },
                          { name: 'Storage Buckets', desc: 'AWS S3 Backed', status: 'Healthy', ping: `${latencyStorage}ms` },
                          { name: 'Edge Functions', desc: 'Vercel Serverless', status: 'Healthy', ping: `${latencyEdge}ms` }
                        ].map((sys, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{sys.name}</span>
                              <span className="text-xs font-medium text-gray-500">{sys.desc}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono text-gray-400 w-10 text-right">{sys.ping}</span>
                              <div className="flex items-center gap-1.5 w-20">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
                        <button onClick={() => handleQuickTool('Force Global Refresh')} className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                          <p className="font-bold text-gray-900 group-hover:text-blue-700">Force Global Refresh</p>
                          <p className="text-xs text-gray-500 mt-1">Clears frontend cache for all active clients.</p>
                        </button>
                        <button onClick={() => handleQuickTool('Purge Inactive Sessions')} className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group">
                          <p className="font-bold text-gray-900 group-hover:text-red-700">Purge Inactive Sessions</p>
                          <p className="text-xs text-gray-500 mt-1">Logs out users inactive for &gt;24 hours.</p>
                        </button>
                        <button onClick={() => handleQuickTool('Trigger DB Backup')} className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
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
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><HardDrive className="w-5 h-5 text-gray-600"/> Live Storage Allocation (Supabase)</h3>
                      
                      {storageData ? (
                        <>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-gray-500">Total Usage Across All Buckets</span>
                            <span className="text-xl font-black text-gray-900 font-mono">{formatBytes(storageData.totalSizeBytes)}</span>
                          </div>
                          <div className="w-full h-8 flex rounded-xl overflow-hidden mb-4 shadow-inner bg-gray-100">
                            {Object.entries(storageData.bucketSizes).length > 0 ? Object.entries(storageData.bucketSizes).map(([bucket, size], i) => {
                              const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500']
                              const pct = storageData.totalSizeBytes > 0 ? (size / storageData.totalSizeBytes) * 100 : 0
                              return (
                                <motion.div key={bucket} className={`${colors[i % colors.length]} h-full`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} title={`${bucket} (${formatBytes(size)})`} />
                              )
                            }) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">No active objects stored</div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-6 justify-center mt-6">
                            {Object.entries(storageData.bucketSizes).map(([bucket, size], i) => {
                              const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500']
                              const pct = storageData.totalSizeBytes > 0 ? (size / storageData.totalSizeBytes) * 100 : 0
                              return (
                                <div key={bucket} className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                                  <span className="text-sm font-bold text-gray-600 capitalize">{bucket} ({pct.toFixed(1)}%)</span>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Fetching Storage Data...</p>
                        </div>
                      )}
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
                      <p className="text-4xl font-black text-gray-900 font-mono transition-all">{socFailedLogins}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Blocked IPs</h3>
                      <p className="text-4xl font-black text-gray-900 font-mono transition-all">{socBlockedIPs}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-teal-600"/> Access Logs</h3>
                      <button onClick={() => toast.success("Access logs exported to CSV successfully.")} className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Export CSV</button>
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
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-green-50 text-green-700 border-green-100">
                                    Success
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
                              <button onClick={() => setViewingLogsFor(p)} className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
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
                  
                  <div className="p-6 h-[600px] overflow-y-auto custom-scrollbar flex flex-col" onClick={() => document.getElementById('term-input')?.focus()}>
                    {terminalOutput.map((out, idx) => (
                      <div key={idx} className={`mb-1 ${out.isCommand ? 'text-green-400 font-bold mt-2' : 'text-gray-300'}`}>
                        {out.text}
                      </div>
                    ))}
                    
                    <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 mt-2">
                      <span className="text-green-400 font-bold whitespace-nowrap">root@cadd-ims:~#</span>
                      <input 
                        id="term-input"
                        type="text" 
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-100 font-mono text-sm placeholder-gray-600 p-0 m-0"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                      />
                    </form>
                    <div ref={terminalEndRef} />
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
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
                  <IMSTasksPage embedded={true} />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* View Logs Modal */}
      <AnimatePresence>
        {viewingLogsFor && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-[#0A1A2F] px-6 py-4 flex justify-between items-center text-white shrink-0">
                <div>
                  <h3 className="font-bold text-lg">{viewingLogsFor.full_name}</h3>
                  <p className="text-xs text-blue-200">System Activity Logs</p>
                </div>
                <button onClick={() => setViewingLogsFor(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                {loginLogs.filter(l => l.user_id === viewingLogsFor.id).length === 0 ? (
                  <div className="text-center py-16">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No activity logs found</p>
                    <p className="text-gray-400 text-sm mt-1">This user hasn't generated any system logs yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loginLogs.filter(l => l.user_id === viewingLogsFor.id).map((log, idx) => (
                      <div key={log.id || idx} className="flex gap-4 items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0 border border-blue-100">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm text-gray-900">Login Session</p>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{format(new Date(log.login_time), 'MMM d, yyyy - HH:mm')}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-1.5 rounded inline-block">IP: {log.ip_address || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1" title={log.device_info || ''}>Device: {log.device_info || 'Unknown Device'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
