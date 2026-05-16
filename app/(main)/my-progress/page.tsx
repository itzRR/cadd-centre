"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Layers, ChevronLeft, CheckCircle, Clock, Circle, FolderKanban } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMyProgressOverviewAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const STATUS_META: Record<string, { icon: any; color: string; badge: string }> = {
  completed:   { icon: CheckCircle, color: "text-green-600",  badge: "bg-green-100 text-green-800" },
  in_progress: { icon: Clock,       color: "text-blue-600",   badge: "bg-blue-100 text-blue-800" },
  not_started: { icon: Circle,      color: "text-gray-400",   badge: "bg-gray-100 text-gray-600" },
}

export default function MyProgressPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const data = await getMyProgressOverviewAction()
      setEnrollments(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Progress</h1>
            <p className="text-sm text-gray-500">Module completion, assignments, practical projects and software skill tracking</p>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <Layers className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No courses enrolled</h2>
            <p className="text-gray-400 text-sm mb-6">Enroll in a CADD programme to track your academic progress</p>
            <Link href="/courses"><button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Browse Courses</button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses
              const modules = course?.modules ? [...course.modules].sort((a: any, b: any) => a.order_index - b.order_index) : []
              const progressRows = enrollment.progress_rows || []
              const academicRecords = enrollment.academic_records || []
              const completed = progressRows.filter((p: any) => p.status === 'completed').length
              const progressPct = modules.length ? Math.round((completed / modules.length) * 100) : 0

              return (
                <div key={enrollment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-gray-900">{course?.title}</h2>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {course?.level && <Badge className={course.level === "Expert Certificate" ? "bg-purple-100 text-purple-800" : course.level === "Master Certificate" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>{course.level}</Badge>}
                          <span className="text-xs text-gray-400">{course?.total_hours}h total</span>
                          <Badge className="bg-slate-100 text-slate-700">{progressPct}% complete</Badge>
                        </div>
                      </div>
                      <Badge className={enrollment.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>{enrollment.status}</Badge>
                    </div>
                    <div className="mt-4 bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPct}%` }} /></div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {modules.map((mod: any, i: number) => {
                      const progress = progressRows.find((p: any) => p.module_id === mod.id) || { status: 'not_started' }
                      const meta = STATUS_META[progress.status || 'not_started']
                      const Icon = meta.icon
                      const records = academicRecords.filter((r: any) => r.module_id === mod.id)
                      return (
                        <div key={mod.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{mod.title}</p>
                                  {mod.description && <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={meta.badge}>{progress.status?.replace('_', ' ')}</Badge>
                                  <span className="text-xs text-gray-400">{mod.duration_hours}h</span>
                                  <Icon className={`h-4 w-4 ${meta.color}`} />
                                </div>
                              </div>
                              {(progress.score != null || progress.practical_score != null || progress.theory_score != null) && (
                                <div className="mt-2 text-xs text-gray-600 flex gap-4 flex-wrap">
                                  {progress.score != null && <span>Overall: <strong>{progress.score}</strong></span>}
                                  {progress.practical_score != null && <span>Practical: <strong>{progress.practical_score}</strong></span>}
                                  {progress.theory_score != null && <span>Theory: <strong>{progress.theory_score}</strong></span>}
                                </div>
                              )}
                              {records.length > 0 && (
                                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                                  {records.map((record: any) => (
                                    <div key={record.id} className="border rounded-lg px-3 py-2 bg-slate-50">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-gray-800 truncate">{record.title}</p>
                                          <p className="text-[11px] text-gray-500">{record.type.replace('_', ' ')}</p>
                                        </div>
                                        <Badge className={STATUS_META[record.status || 'not_started']?.badge || 'bg-gray-100 text-gray-700'}>{record.status?.replace('_', ' ')}</Badge>
                                      </div>
                                      {(record.score != null || record.max_score != null) && <p className="text-[11px] text-gray-600 mt-1">Score: {record.score ?? '-'}{record.max_score != null ? ` / ${record.max_score}` : ''}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {mod.topics && mod.topics.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{mod.topics.map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{t}</span>)}</div>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {modules.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">No modules defined for this course yet</p>}
                  </div>

                  <div className="border-t bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-2"><FolderKanban className="h-4 w-4" /> Course-level academic records</div>
                    {academicRecords.filter((r: any) => !r.module_id).length === 0 ? <p className="text-xs text-gray-500">No course-level records yet.</p> : (
                      <div className="grid md:grid-cols-3 gap-2">
                        {academicRecords.filter((r: any) => !r.module_id).map((record: any) => <div key={record.id} className="border rounded-lg bg-white px-3 py-2"><p className="text-xs font-semibold">{record.title}</p><p className="text-[11px] text-gray-500">{record.type.replace('_', ' ')}</p></div>)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
