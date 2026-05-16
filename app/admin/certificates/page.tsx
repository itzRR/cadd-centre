"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Award, Search, Plus, QrCode } from "lucide-react"
import { getCertificates, getEnrollments, issueCertificate } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState({ enrollment_id: "", type: "course_completion" })

  useEffect(() => {
    getCertificates().then(data => { setCertificates(data); setFiltered(data) }).finally(() => setIsLoading(false))
    getEnrollments().then(setEnrollments)
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(certificates.filter(c =>
      (c.certificate_number || "").toLowerCase().includes(q) ||
      (c.students?.full_name || "").toLowerCase().includes(q) ||
      (c.courses?.title || "").toLowerCase().includes(q)
    ))
  }, [search, certificates])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const enroll = enrollments.find(en => en.id === form.enrollment_id)
    if (!enroll) { setError("Select a valid enrollment"); return }
    try {
      const certNum = `CADD-CERT-${new Date().getFullYear()}-${String(certificates.length + 1).padStart(5, "0")}`
      const qrData = `${window.location.origin}/verify/${certNum}`
      const cert = await issueCertificate({
        enrollment_id: enroll.id,
        user_id: enroll.user_id,
        course_id: enroll.course_id,
        certificate_number: certNum,
        type: form.type,
        qr_code_data: qrData,
        pdf_url: `${window.location.origin}/verify/${certNum}?print=1`,
      })
      setCertificates(prev => [cert, ...prev])
      setShowForm(false)
      setForm({ enrollment_id: "", type: "course_completion" })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const typeColor = (t: string) =>
    t === "professional_bim" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">Issue and verify CADD Centre Lanka certificates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Issue Certificate
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Issue New Certificate</CardTitle></CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={handleIssue} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>Select Enrollment *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.enrollment_id}
                  onChange={e => setForm(f => ({ ...f, enrollment_id: e.target.value }))}
                  required
                >
                  <option value="">-- Select completed enrollment --</option>
                  {enrollments.filter(e => e.status === "completed").map(e => (
                    <option key={e.id} value={e.id}>
                      {e.students?.full_name} - {e.courses?.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Certificate Type *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="course_completion">Course Completion</option>
                  <option value="professional_bim">Professional BIM Certification</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Issue Certificate</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> All Certificates ({filtered.length})</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search by name, cert number or course..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Certificate #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Issued</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">QR / PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No certificates issued yet</td></tr>
                  ) : filtered.map(cert => (
                    <tr key={cert.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-700">{cert.certificate_number}</td>
                      <td className="py-3 px-4 font-medium">{cert.students?.full_name || "-"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{cert.students?.student_id || "-"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{cert.courses?.title || "-"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{cert.courses?.level || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge className={typeColor(cert.type)}>{cert.type.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(cert.issued_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" title={cert.qr_code_data}>
                            <QrCode className="h-3 w-3" />
                          </Button>
                          {cert.pdf_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={cert.pdf_url} target="_blank" rel="noreferrer">PDF</a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
