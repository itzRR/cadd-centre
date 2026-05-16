"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, ChevronLeft, FileText } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMyAssessmentsAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
}

const TYPE_COLORS: Record<string, string> = {
  module_test:   "bg-blue-100 text-blue-800",
  practical:     "bg-orange-100 text-orange-800",
  final_project: "bg-purple-100 text-purple-800",
}

export default function MyResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const data = await getMyAssessmentsAction()
      setAssessments(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  const totalScored = assessments.filter(a => a.marks_obtained != null).length
  const avgScore = totalScored > 0
    ? Math.round(assessments.filter(a => a.marks_obtained != null).reduce((s, a) => s + (a.marks_obtained / a.total_marks) * 100, 0) / totalScored)
    : null

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
            <p className="text-sm text-gray-500">Module tests, practicals and final project evaluations</p>
          </div>
        </div>

        {avgScore != null && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Assessments</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalScored}</p>
              <p className="text-xs text-gray-500 mt-0.5">Scored</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100 shadow-sm">
              <p className="text-2xl font-bold text-green-700">{avgScore}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Average Score</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" /> Assessment Records
            </h2>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No assessments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Assessment</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Module</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Score</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Grade</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-5 font-medium">{a.title}</td>
                      <td className="py-3 px-5 text-gray-600 text-xs">{a.enrollments?.courses?.title || "-"}</td>
                      <td className="py-3 px-5 text-gray-600">{a.modules?.title || "-"}</td>
                      <td className="py-3 px-5">
                        <Badge className={TYPE_COLORS[a.type] || "bg-gray-100 text-gray-700"}>
                          {a.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 font-semibold">
                        {a.marks_obtained != null
                          ? <span>{a.marks_obtained}<span className="text-gray-400 font-normal">/{a.total_marks}</span></span>
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-5">
                        {a.grade
                          ? <Badge className={GRADE_COLORS[a.grade] || "bg-gray-100 text-gray-700"}>{a.grade}</Badge>
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-5 text-gray-400 text-xs">
                        {a.conducted_at ? new Date(a.conducted_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
