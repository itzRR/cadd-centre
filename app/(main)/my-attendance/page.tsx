"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarDays, ChevronLeft, CheckCircle, XCircle, Clock, MinusCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMyAttendanceAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const STATUS_META: Record<string, { icon: any; color: string; bg: string }> = {
  present: { icon: CheckCircle, color: "text-green-600",  bg: "bg-green-100 text-green-800" },
  absent:  { icon: XCircle,    color: "text-red-600",    bg: "bg-red-100 text-red-800" },
  late:    { icon: Clock,      color: "text-yellow-600", bg: "bg-yellow-100 text-yellow-800" },
  excused: { icon: MinusCircle,color: "text-blue-600",   bg: "bg-blue-100 text-blue-800" },
}

export default function MyAttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const data = await getMyAttendanceAction()
      setRecords(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  const total   = records.length
  const present = records.filter(r => r.status === "present").length
  const absent  = records.filter(r => r.status === "absent").length
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-sm text-gray-500">Track your daily attendance across all batches</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Sessions", value: total,   bg: "bg-white" },
            { label: "Present",        value: present, bg: "bg-green-50" },
            { label: "Attendance %",   value: `${pct}%`, bg: pct >= 75 ? "bg-green-50" : "bg-yellow-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100 shadow-sm`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Attendance percentage bar */}
        {total > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Attendance Rate</span>
              <span className={`text-sm font-bold ${pct >= 75 ? "text-green-600" : "text-yellow-600"}`}>{pct}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${pct >= 75 ? "bg-green-500" : "bg-yellow-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct < 75 && <p className="text-xs text-yellow-600 mt-2">⚠ Attendance below 75% - please speak to your coordinator</p>}
          </div>
        )}

        {/* Records table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" /> Attendance Records
            </h2>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Batch</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const meta = STATUS_META[r.status] || STATUS_META.absent
                    const Icon = meta.icon
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-5 font-medium">{r.date}</td>
                        <td className="py-3 px-5 text-gray-600">{r.batches?.name || "-"}</td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                            <Badge className={meta.bg}>{r.status}</Badge>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-gray-400 text-xs">{r.notes || "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
