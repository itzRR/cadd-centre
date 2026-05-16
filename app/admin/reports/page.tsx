"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Users, BookOpen, Award, CalendarDays, TrendingUp } from "lucide-react"
import { getCertificates, getDashboardStats, getEnrollments } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"

function csvEscape(value: unknown) {
  const s = String(value ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getEnrollments(), getCertificates()])
      .then(([s, e, c]) => {
        setStats(s)
        setEnrollments(e)
        setCertificates(c)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const courseReport = useMemo(
    () =>
      Object.values(
        enrollments.reduce((acc: any, e: any) => {
          const title = e.courses?.title || "Unknown"
          if (!acc[title]) {
            acc[title] = { title, total: 0, completed: 0, active: 0, cancelled: 0, revenue: 0 }
          }
          acc[title].total++
          if (e.status === "completed") acc[title].completed++
          else if (e.status === "cancelled") acc[title].cancelled++
          else acc[title].active++
          acc[title].revenue += e.amount_paid || 0
          return acc
        }, {})
      ) as any[],
    [enrollments]
  )

  const attendanceReport = useMemo(
    () =>
      Object.values(
        enrollments.reduce((acc: any, e: any) => {
          const key = e.batches?.name || "Unassigned"
          if (!acc[key]) {
            acc[key] = { batch: key, course: e.courses?.title || "-", total: 0, confirmed: 0, completed: 0 }
          }
          acc[key].total++
          if (e.status === "confirmed") acc[key].confirmed++
          if (e.status === "completed") acc[key].completed++
          return acc
        }, {})
      ) as any[],
    [enrollments]
  )

  const certificationReport = useMemo(
    () =>
      Object.values(
        certificates.reduce((acc: any, cert: any) => {
          const key = cert.courses?.title || "Unknown"
          if (!acc[key]) {
            acc[key] = { course: key, level: cert.courses?.level || "-", total: 0, professional_bim: 0, course_completion: 0 }
          }
          acc[key].total++
          if (cert.type === "professional_bim") acc[key].professional_bim++
          else acc[key].course_completion++
          return acc
        }, {})
      ) as any[],
    [certificates]
  )

  const exportCSV = () => {
    const lines = [
      ["Report", "Primary", "Secondary", "Metric", "Value"],
      ...courseReport.flatMap((r: any) => [
        ["course_performance", r.title, "", "total_enrollments", r.total],
        ["course_performance", r.title, "", "completed", r.completed],
        ["course_performance", r.title, "", "active", r.active],
        ["course_performance", r.title, "", "cancelled", r.cancelled],
        ["course_performance", r.title, "", "revenue", r.revenue],
      ]),
      ...attendanceReport.flatMap((r: any) => [
        ["attendance", r.batch, r.course, "total_students", r.total],
        ["attendance", r.batch, r.course, "confirmed", r.confirmed],
        ["attendance", r.batch, r.course, "completed", r.completed],
      ]),
      ...certificationReport.flatMap((r: any) => [
        ["certification", r.course, r.level, "total_certificates", r.total],
        ["certification", r.course, r.level, "course_completion", r.course_completion],
        ["certification", r.course, r.level, "professional_bim", r.professional_bim],
      ]),
    ]

    const csv = lines.map((row) => row.map(csvEscape).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "asms-reports.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Student enrollment, course performance, attendance and certification reporting</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Enrollments", value: stats.totalEnrollments, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Certificates", value: stats.certificatesIssued, icon: Award, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
            { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((s) => (
            <Card key={s.label} className={s.bg}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-600">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Student Enrollment Report</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Student ID</th>
                    <th className="text-left py-3 px-4">Course</th>
                    <th className="text-left py-3 px-4">Batch</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e: any) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-3 px-4">{e.students?.full_name || "-"}</td>
                      <td className="py-3 px-4 text-xs text-blue-700">{e.students?.student_id || "-"}</td>
                      <td className="py-3 px-4">{e.courses?.title || "-"}</td>
                      <td className="py-3 px-4">{e.batches?.name || "-"}</td>
                      <td className="py-3 px-4">{formatCurrency(e.amount_paid || 0)}</td>
                      <td className="py-3 px-4"><Badge className="bg-blue-100 text-blue-800">{e.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Course-wise Performance Report</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-right py-3 px-4">Completed</th>
                  <th className="text-right py-3 px-4">Active</th>
                  <th className="text-right py-3 px-4">Cancelled</th>
                  <th className="text-right py-3 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {courseReport.map((row: any) => (
                  <tr key={row.title} className="border-b">
                    <td className="py-3 px-4 font-medium">{row.title}</td>
                    <td className="py-3 px-4 text-right">{row.total}</td>
                    <td className="py-3 px-4 text-right">{row.completed}</td>
                    <td className="py-3 px-4 text-right">{row.active}</td>
                    <td className="py-3 px-4 text-right">{row.cancelled}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Attendance Report</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Batch</th>
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-right py-3 px-4">Students</th>
                  <th className="text-right py-3 px-4">Confirmed</th>
                  <th className="text-right py-3 px-4">Completed</th>
                </tr>
              </thead>
              <tbody>
                {attendanceReport.map((row: any) => (
                  <tr key={row.batch} className="border-b">
                    <td className="py-3 px-4 font-medium">{row.batch}</td>
                    <td className="py-3 px-4">{row.course}</td>
                    <td className="py-3 px-4 text-right">{row.total}</td>
                    <td className="py-3 px-4 text-right">{row.confirmed}</td>
                    <td className="py-3 px-4 text-right">{row.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Certification Report</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-left py-3 px-4">Level</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-right py-3 px-4">Course Completion</th>
                  <th className="text-right py-3 px-4">Professional BIM</th>
                </tr>
              </thead>
              <tbody>
                {certificationReport.map((row: any) => (
                  <tr key={row.course} className="border-b">
                    <td className="py-3 px-4 font-medium">{row.course}</td>
                    <td className="py-3 px-4">{row.level}</td>
                    <td className="py-3 px-4 text-right">{row.total}</td>
                    <td className="py-3 px-4 text-right">{row.course_completion}</td>
                    <td className="py-3 px-4 text-right">{row.professional_bim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
