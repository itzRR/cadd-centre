"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Award, Search, Plus, QrCode, Check } from "lucide-react"
import { getCertificates, getBatches, getEnrollments, issueCertificate } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)

  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [certType, setCertType] = useState("course_completion")

  const router = useRouter()

  useEffect(() => {
    getCertificates().then(data => { setCertificates(data); setFiltered(data) }).finally(() => setIsLoading(false))
    getBatches(false).then(setBatches)
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

  // Students filtered by selected batch
  const batchStudents = selectedBatchId
    ? enrollments.filter(e => e.batch_id === selectedBatchId)
    : []

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(enrollmentId)
        ? prev.filter(id => id !== enrollmentId)
        : [...prev, enrollmentId]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === batchStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(batchStudents.map(e => e.id))
    }
  }

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId)
    setSelectedStudentIds([])
  }

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!selectedBatchId) { setError("Please select a batch"); return }
    if (selectedStudentIds.length === 0) { setError("Please select at least one student"); return }

    setIssuing(true)
    try {
      let currentCount = certificates.length
      for (const enrollmentId of selectedStudentIds) {
        const enroll = enrollments.find(en => en.id === enrollmentId)
        if (!enroll) continue
        currentCount++
        const certNum = `CADD-CERT-${new Date().getFullYear()}-${String(currentCount).padStart(5, "0")}`
        const qrData = `${window.location.origin}/verify/${certNum}`
        await issueCertificate({
          enrollment_id: enroll.id,
          user_id: enroll.user_id,
          course_id: enroll.course_id,
          certificate_number: certNum,
          type: certType,
          qr_code_data: qrData,
          pdf_url: `${window.location.origin}/verify/${certNum}?print=1`,
        })
      }
      // Reload full list with enriched student/course data
      const freshCerts = await getCertificates()
      setCertificates(freshCerts)
      setShowForm(false)
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIssuing(false)
    }
  }

  const resetForm = () => {
    setSelectedBatchId("")
    setSelectedStudentIds([])
    setCertType("course_completion")
    setError("")
  }

  const handleGenerateTranscript = () => {
    if (selectedStudentIds.length !== 1) {
      setError("Please select exactly one student to generate a transcript.")
      return
    }
    window.open(`/admin/certificates/transcript/${selectedStudentIds[0]}`, '_blank')
  }

  const handleGenerateCertificatePrint = () => {
    if (selectedStudentIds.length !== 1) {
      setError("Please select exactly one student to generate a print certificate.")
      return
    }
    window.open(`/admin/certificates/certificate/${selectedStudentIds[0]}`, '_blank')
  }

  const typeColor = (t: string) =>
    t === "professional_bim" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"

  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">Issue and verify CADD Centre Lanka certificates</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}>
          <Plus className="h-4 w-4 mr-2" /> Issue Certificate
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Issue New Certificate</CardTitle></CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={handleIssue} className="space-y-4">
              {/* Step 1: Select Batch */}
              <div className="space-y-2">
                <Label>1. Select Batch *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={selectedBatchId}
                  onChange={e => handleBatchChange(e.target.value)}
                  required
                >
                  <option value="">-- Select a batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.courses?.title ? `${b.courses.title} – ` : ''}{b.name} {!b.is_active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Students */}
              {selectedBatchId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>2. Select Students * ({selectedStudentIds.length} selected)</Label>
                    {batchStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllStudents}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        {selectedStudentIds.length === batchStudents.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  {batchStudents.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
                      No students enrolled in this batch.
                    </p>
                  ) : (
                    <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                      {batchStudents.map(e => {
                        const isSelected = selectedStudentIds.includes(e.id)
                        return (
                          <label
                            key={e.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                              isSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'bg-[#e31e24] border-[#e31e24]' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => toggleStudent(e.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {e.students?.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {e.students?.student_id || 'No ID'} · {e.courses?.title || 'N/A'}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              e.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              e.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {e.status}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Certificate Type */}
              {selectedStudentIds.length > 0 && (
                <div className="space-y-2">
                  <Label>3. Certificate Type *</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={certType}
                    onChange={e => setCertType(e.target.value)}
                  >
                    <option value="course_completion">Course Completion</option>
                    <option value="professional_bim">Professional BIM Certification</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="bg-[#e31e24] hover:bg-[#c2181d]" disabled={issuing || selectedStudentIds.length === 0}>
                  {issuing ? 'Issuing...' : `Issue ${selectedStudentIds.length > 1 ? `${selectedStudentIds.length} Certificates` : 'to DB'}`}
                </Button>
                <Button type="button" variant="outline" className="border-[#e31e24] text-[#e31e24] hover:bg-[#e31e24]/10" onClick={handleGenerateCertificatePrint}>Print Certificate</Button>
                <Button type="button" variant="outline" className="border-[#e31e24] text-[#e31e24] hover:bg-[#e31e24]/10" onClick={handleGenerateTranscript}>Print Transcript</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
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
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-red-700">{cert.certificate_number}</td>
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
