"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { Clock, LogIn, LogOut, CheckCircle, FileText, Download, RefreshCw, User, Calendar, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getMyAttendance, getAllAttendance, getDepartmentAttendance, clockIn, clockOut, type StaffAttendanceSession } from "@/lib/ims-data"
import * as XLSX from "xlsx"

function durationStr(timeIn: string, timeOut?: string | null): string {
  if (!timeOut) return "Active"
  const mins = differenceInMinutes(parseISO(timeOut), parseISO(timeIn))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function timeStr(iso: string) {
  try { return format(parseISO(iso), "hh:mm a") } catch { return "-" }
}

export default function StaffAttendance({ isAdmin = false }: { isAdmin?: boolean }) {
  const [sessions, setSessions] = useState<StaffAttendanceSession[]>([])
  const [allSessions, setAllSessions] = useState<StaffAttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<StaffAttendanceSession | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [tab, setTab] = useState<"my" | "team">("my")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportText, setReportText] = useState("")
  const [clockingOut, setClocingOut] = useState(false)
  const [isDepartmentHead, setIsDepartmentHead] = useState(false)
  const [userDept, setUserDept] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Staff"
        setUserName(name)

        // Fetch profile to check department and role
        const { data: profile } = await supabase.from('profiles').select('department, position, role').eq('id', user.id).single()
        if (profile) {
          setUserDept(profile.department)
          const isHead = profile.position?.toLowerCase().includes('head') || profile.position?.toLowerCase().includes('manager')
          const isGlobalAdmin = ['admin', 'super_admin', 'branch_manager'].includes(profile.role)
          setIsDepartmentHead(isHead || isGlobalAdmin)
        }
      }
    }
    fetchUser()
  }, [])

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const mine = await getMyAttendance(userId)
      setSessions(mine)
      const active = mine.find(s => s.date === today && !s.time_out)
      setActiveSession(active || null)

      // Admin sees all, Dept head sees their department
      if (isAdmin) {
        const all = await getAllAttendance()
        setAllSessions(all)
      } else if (isDepartmentHead && userDept) {
        const deptAtt = await getDepartmentAttendance(userDept)
        setAllSessions(deptAtt)
      }
    } catch (e: any) { toast.error("Could not load attendance") }
    finally { setLoading(false) }
  }, [userId, isAdmin, isDepartmentHead, userDept, today])

  useEffect(() => { loadData() }, [loadData])

  const todaySessions = sessions.filter(s => s.date === today)
  const sessionIndex = todaySessions.length + 1

  const handleClockIn = async () => {
    if (!userId || !userName) return
    try {
      const session = await clockIn({ userId, userName, sessionIndex })
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      toast.success("Clocked in! Good morning 🌟")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleClockOut = async () => {
    if (!activeSession) return
    setClocingOut(true)
    setShowReportModal(true)
  }

  const submitClockOut = async () => {
    if (!activeSession) return
    if (!reportText.trim()) return toast.error("Please enter your daily report before clocking out.")
    try {
      const updated = await clockOut(activeSession.id, reportText.trim())
      setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s))
      setActiveSession(null)
      setShowReportModal(false)
      setReportText("")
      setClocingOut(false)
      toast.success(`Clocked out! Duration: ${durationStr(updated.time_in, updated.time_out)}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const exportMyAttendance = () => {
    const ws = XLSX.utils.json_to_sheet(sessions.map(s => ({
      Date: s.date,
      "Time In": timeStr(s.time_in),
      "Time Out": s.time_out ? timeStr(s.time_out) : "Active",
      Duration: durationStr(s.time_in, s.time_out),
      Status: s.status,
      "Daily Report": s.daily_report || "",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    XLSX.writeFile(wb, `attendance_${userName}_${format(new Date(), "yyyy-MM")}.xlsx`)
  }

  const presentDays = [...new Set(sessions.filter(s => s.time_out).map(s => s.date))].length
  const avgDuration = (() => {
    const completed = sessions.filter(s => s.time_out)
    if (!completed.length) return 0
    const total = completed.reduce((sum, s) => sum + differenceInMinutes(parseISO(s.time_out!), parseISO(s.time_in)), 0)
    return Math.round(total / completed.length)
  })()

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-blue-600 font-medium">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 flex items-center transition-colors shadow-sm">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </button>
          <button onClick={exportMyAttendance} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 flex items-center transition-colors shadow-sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Clock widget */}
      <div className={`rounded-2xl border p-6 ${activeSession
        ? "bg-emerald-50 border-emerald-200"
        : "bg-gray-100 border-gray-200"
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-5xl font-mono font-bold text-gray-800" suppressHydrationWarning>
              {format(new Date(), "hh:mm")}
              <span className="text-2xl text-gray-500 ml-1">{format(new Date(), "a")}</span>
            </p>
            <p className="text-sm mt-1">
              {activeSession ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ Clocked in at {timeStr(activeSession.time_in)}
                  {activeSession.session_index > 1 ? ` (Session ${activeSession.session_index})` : ""}
                </span>
              ) : <span className="text-gray-500">Not clocked in today</span>}
            </p>
          </div>
          <div className="flex gap-3">
            {!activeSession ? (
              <button onClick={handleClockIn} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                {todaySessions.length > 0 ? `Clock In (Session ${sessionIndex})` : "Clock In"}
              </button>
            ) : (
              <button onClick={handleClockOut} className="px-6 py-2.5 rounded-xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-all shadow-sm flex items-center">
                <LogOut className="h-4 w-4 mr-2" /> Clock Out
              </button>
            )}
          </div>
        </div>

        {todaySessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Today&apos;s Sessions</p>
            <div className="flex flex-wrap gap-2">
              {todaySessions.map(s => (
                <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  s.time_out ? "bg-white border-gray-200 text-gray-700" : "bg-emerald-100 border-emerald-300 text-emerald-800"
                }`}>
                  <span>Session {s.session_index}</span>
                  <span className="text-gray-500">{timeStr(s.time_in)} → {s.time_out ? timeStr(s.time_out) : "Active"}</span>
                  <Badge className={s.status === "late" ? "bg-orange-100 text-orange-700 border-none px-1.5 text-[10px]" : "bg-green-100 text-green-700 border-none px-1.5 text-[10px]"}>
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present Days",    value: presentDays,                                                       icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50 border-green-200" },
          { label: "Total Sessions",  value: sessions.filter(s => s.time_out).length,                           icon: Clock,       color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
          { label: "Avg Duration",    value: `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m`,           icon: Calendar,    color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { label: "This Month",      value: sessions.filter(s => s.date.startsWith(today.slice(0, 7))).length, icon: User,        color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{loading ? "…" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs - only if admin or department head */}
      {(isAdmin || isDepartmentHead) && (
        <div className="flex gap-1 border-b border-gray-200">
          {(["my", "team"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>
              {t === "my" ? "My Records" : `Team Records (${allSessions.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {(tab === "team" && (isAdmin || isDepartmentHead)
                ? ["Name", "Date", "Time In", "Time Out", "Duration", "Status", "Report"]
                : ["Date", "Time In", "Time Out", "Duration", "Status", "Report"]
              ).map(h => (
                <th key={h} className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></td></tr>
            ) : (tab === "team" && (isAdmin || isDepartmentHead) ? allSessions : sessions).length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No attendance records yet</td></tr>
            ) : (tab === "team" && (isAdmin || isDepartmentHead) ? allSessions : sessions).map(s => (
              <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.time_out ? "bg-emerald-50" : ""}`}>
                {tab === "team" && (isAdmin || isDepartmentHead) && <td className="py-3 px-4 font-semibold text-gray-900">{s.user_name}</td>}
                <td className="py-3 px-4 text-gray-600">{s.date}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{timeStr(s.time_in)}</td>
                <td className="py-3 px-4 text-gray-600">
                  {s.time_out ? timeStr(s.time_out) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none">Active</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-700 font-medium">{durationStr(s.time_in, s.time_out)}</td>
                <td className="py-3 px-4">
                  <Badge className={`border-none ${
                    s.status === "late" ? "bg-orange-100 text-orange-700" :
                    !s.time_out ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {!s.time_out ? "active" : s.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs max-w-[150px] truncate" title={s.daily_report || ""}>
                  {s.daily_report ? (
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{s.daily_report}</span>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clock Out modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">Daily Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">Write a short summary of what you did today before clocking out.</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={5}
                placeholder="Completed tasks, meetings, progress, blockers..."
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 flex items-center justify-center transition-all shadow-md" onClick={submitClockOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Submit &amp; Clock Out
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors" onClick={() => { setShowReportModal(false); setClocingOut(false) }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
