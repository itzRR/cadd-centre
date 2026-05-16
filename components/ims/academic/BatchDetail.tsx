"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, CalendarDays, Users, CheckCircle, Award, BookOpen, UserCheck, Plus, X, Trash2, Edit, Clock, BarChart3, AlertTriangle } from "lucide-react"
import { getBatchById, getStudentsByBatch, getCourseById, getLecturerById, getAttendanceByBatch, getAttendanceByDate, markAttendance, getAssessmentsByBatch, createAssessment, deleteAssessment, getSubmissionsByAssessment, upsertSubmission, updateBatch, getStudents, type Batch, type Assessment } from "@/lib/academic-store"
import { toast } from "sonner"

type SubTab = "overview" | "students" | "attendance" | "exams"

export default function BatchDetail({ batchId, onBack, onRefresh }: { batchId: string; onBack: () => void; onRefresh: () => void }) {
  const [subTab, setSubTab] = useState<SubTab>("overview")
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10))
  const [attMarks, setAttMarks] = useState<Record<string, "present" | "absent" | "late">>({})
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [assessForm, setAssessForm] = useState({ name: "", type: "exam" as Assessment["type"], dueDate: "", maxMarks: 100, markingScheme: "" })
  const [gradingAssessment, setGradingAssessment] = useState<string | null>(null)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [showStudentPicker, setShowStudentPicker] = useState(false)
  const [pickerSelected, setPickerSelected] = useState<string[]>([])

  const batch = getBatchById(batchId)
  if (!batch) return <div className="text-center py-16 text-gray-400">Batch not found</div>

  const batchStudents = getStudentsByBatch(batchId)
  const course = batch.courseId ? getCourseById(batch.courseId) : null
  const lecturer = batch.lecturerId ? getLecturerById(batch.lecturerId) : null
  const attendance = getAttendanceByBatch(batchId)
  const assessments = getAssessmentsByBatch(batchId)
  const allStudents = getStudents()

  const tabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "students", label: "Students", icon: Users },
    { id: "attendance", label: "Attendance", icon: CheckCircle },
    { id: "exams", label: "Exams & Assessments", icon: Award },
  ]

  // Attendance helpers
  const todayAttendance = getAttendanceByDate(batchId, attDate)
  const loadAttForDate = () => {
    const marks: Record<string, "present" | "absent" | "late"> = {}
    batchStudents.forEach(s => {
      const rec = todayAttendance.find(a => a.studentId === s.id)
      marks[s.id] = rec?.status || "absent"
    })
    setAttMarks(marks)
  }

  const saveAttendance = () => {
    const records = batchStudents.map(s => ({ batchId, studentId: s.id, date: attDate, status: attMarks[s.id] || "absent" as const }))
    markAttendance(records)
    toast.success("Attendance saved"); onRefresh()
  }

  // Attendance stats
  const totalAtt = attendance.length
  const presentCount = attendance.filter(a => a.status === "present").length
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0

  // Student per-student attendance
  const studentAttStats = batchStudents.map(s => {
    const sAtt = attendance.filter(a => a.studentId === s.id)
    const sPresent = sAtt.filter(a => a.status === "present").length
    return { ...s, totalSessions: sAtt.length, present: sPresent, rate: sAtt.length > 0 ? Math.round((sPresent / sAtt.length) * 100) : 0 }
  })

  // Assessment submit
  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assessForm.name.trim()) return toast.error("Name required")
    createAssessment({ batchId, name: assessForm.name, type: assessForm.type, dueDate: assessForm.dueDate || null, maxMarks: assessForm.maxMarks, markingScheme: assessForm.markingScheme || null, status: "published" })
    setShowAssessmentModal(false); setAssessForm({ name: "", type: "exam", dueDate: "", maxMarks: 100, markingScheme: "" })
    toast.success("Assessment created"); onRefresh()
  }

  const saveGrades = (assessmentId: string) => {
    Object.entries(grades).forEach(([studentId, marks]) => {
      const m = parseFloat(marks)
      if (!isNaN(m)) upsertSubmission({ assessmentId, studentId, marksObtained: m, submissionStatus: "graded" })
    })
    setGradingAssessment(null); setGrades({})
    toast.success("Grades saved"); onRefresh()
  }

  const openStudentPicker = () => { setPickerSelected([...batch.studentIds]); setShowStudentPicker(true) }
  const saveStudentPicker = () => {
    updateBatch(batchId, { studentIds: pickerSelected })
    setShowStudentPicker(false); toast.success("Students updated"); onRefresh()
  }

  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", upcoming: "bg-yellow-100 text-yellow-700" }
  const inputCls = "w-full bg-gray-50 text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back to Batches</button>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{batch.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                  {course && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.name}</span>}
                  {lecturer && <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />{lecturer.fullName}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{batchStudents.length} students</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusColors[batch.status]}`}>{batch.status}</span>
            <span className="text-xs text-gray-400">{batch.startDate} → {batch.endDate || "Ongoing"}</span>
          </div>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); if (t.id === "attendance") loadAttForDate() }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${subTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {subTab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Students", value: batchStudents.length, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Attendance Rate", value: `${attRate}%`, color: attRate >= 75 ? "text-green-700" : "text-red-600", bg: attRate >= 75 ? "bg-green-50" : "bg-red-50" },
            { label: "Assessments", value: assessments.length, color: "text-purple-700", bg: "bg-purple-50" },
            { label: "Status", value: batch.status, color: "text-blue-700", bg: "bg-blue-50" },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold">{c.label}</p>
              <p className={`text-2xl font-black ${c.color} capitalize`}>{c.value}</p>
            </div>
          ))}
          {!batch.lecturerId && <div className="col-span-2 md:col-span-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800"><AlertTriangle className="w-4 h-4" />No lecturer assigned</div>}
          {batchStudents.length === 0 && <div className="col-span-2 md:col-span-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800"><AlertTriangle className="w-4 h-4" />No students in this batch</div>}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {subTab === "students" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{batchStudents.length} students assigned</p>
            <motion.button whileHover={{ scale: 1.03 }} onClick={openStudentPicker} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl text-xs font-semibold"><Plus className="w-3 h-3" />Add / Remove Students</motion.button>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{["Student ID", "Name", "Email", "Status", "Attendance"].map(h => <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {batchStudents.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">No students</td></tr> : studentAttStats.map(s => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-emerald-700">{s.studentId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold text-sm ${s.rate >= 75 ? "text-green-600" : s.rate >= 50 ? "text-yellow-600" : "text-red-500"}`}>{s.rate}%</span><span className="text-[10px] text-gray-400 ml-1">({s.present}/{s.totalSessions})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Student Picker Modal */}
          <AnimatePresence>
            {showStudentPicker && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold text-gray-900">Select Students</h2><button onClick={() => setShowStudentPicker(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button></div>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {allStudents.map(s => {
                      const sel = pickerSelected.includes(s.id)
                      return <button key={s.id} onClick={() => setPickerSelected(p => sel ? p.filter(id => id !== s.id) : [...p, s.id])} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${sel ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${sel ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}>{sel && <CheckCircle className="w-3.5 h-3.5 text-white" />}</div>
                        <div><p className="font-medium text-gray-900 text-sm">{s.fullName}</p><p className="text-[10px] text-gray-400">{s.studentId}</p></div>
                      </button>
                    })}
                  </div>
                  <div className="flex gap-3 pt-4 mt-3 border-t border-gray-100">
                    <button onClick={() => setShowStudentPicker(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium">Cancel</button>
                    <button onClick={saveStudentPicker} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm">Save ({pickerSelected.length})</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {subTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={attDate} onChange={e => { setAttDate(e.target.value); setTimeout(loadAttForDate, 50) }} className="bg-white text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <button onClick={loadAttForDate} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 border border-gray-200">Load</button>
            <button onClick={saveAttendance} className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20">Save Attendance</button>
          </div>
          {batchStudents.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No students to mark</p> : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="space-y-0">
                {batchStudents.map(s => {
                  const status = attMarks[s.id] || "absent"
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-b-0">
                      <div><p className="font-medium text-gray-900 text-sm">{s.fullName}</p><p className="text-[10px] text-gray-400">{s.studentId}</p></div>
                      <div className="flex gap-1.5">
                        {(["present", "late", "absent"] as const).map(st => (
                          <button key={st} onClick={() => setAttMarks(p => ({ ...p, [s.id]: st }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${status === st ? (st === "present" ? "bg-green-500 text-white" : st === "late" ? "bg-yellow-500 text-white" : "bg-red-500 text-white") : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Attendance History */}
          {attendance.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-bold text-gray-900 text-sm">Attendance History</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>{["Student", "Date", "Status"].map(h => <th key={h} className="text-left px-4 py-2 text-gray-500 text-xs uppercase">{h}</th>)}</tr></thead>
                  <tbody>
                    {attendance.slice(0, 50).map(a => {
                      const st = batchStudents.find(s => s.id === a.studentId)
                      return <tr key={a.id} className="border-t border-gray-100"><td className="px-4 py-2 text-gray-700">{st?.fullName || "—"}</td><td className="px-4 py-2 text-gray-500 text-xs">{a.date}</td><td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === "present" ? "bg-green-100 text-green-700" : a.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{a.status}</span></td></tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXAMS TAB ── */}
      {subTab === "exams" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Assessments ({assessments.length})</h3>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowAssessmentModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-xs font-semibold"><Plus className="w-3 h-3" />New Assessment</motion.button>
          </div>
          {assessments.length === 0 ? <p className="text-gray-400 text-sm text-center py-12">No assessments yet</p> : assessments.map(a => {
            const subs = getSubmissionsByAssessment(a.id)
            const graded = subs.filter(s => s.submissionStatus === "graded")
            const avg = graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + (s.marksObtained || 0), 0) / graded.length) : 0
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div><h4 className="font-bold text-gray-900">{a.name}</h4><p className="text-xs text-gray-400">{a.type} · Max {a.maxMarks} marks{a.dueDate ? ` · Due: ${a.dueDate}` : ""}</p></div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setGradingAssessment(a.id); const g: Record<string, string> = {}; subs.forEach(s => { if (s.marksObtained !== null) g[s.studentId] = String(s.marksObtained) }); setGrades(g) }} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100">Grade</button>
                    <button onClick={() => { deleteAssessment(a.id); toast.success("Deleted"); onRefresh() }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Graded: {graded.length}/{batchStudents.length}</span>
                  {graded.length > 0 && <span>Avg: <strong className="text-purple-700">{avg}/{a.maxMarks}</strong></span>}
                </div>
                {/* Grading Panel */}
                {gradingAssessment === a.id && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Enter marks for each student:</p>
                    {batchStudents.map(s => (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 flex-1 min-w-[120px]">{s.fullName}</span>
                        <input type="number" min={0} max={a.maxMarks} value={grades[s.id] || ""} onChange={e => setGrades(p => ({ ...p, [s.id]: e.target.value }))} placeholder={`/ ${a.maxMarks}`} className="w-24 bg-gray-50 text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setGradingAssessment(null)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs">Cancel</button>
                      <button onClick={() => saveGrades(a.id)} className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-xs font-semibold">Save Grades</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {/* Assessment Modal */}
          <AnimatePresence>
            {showAssessmentModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-gray-900">New Assessment</h2><button onClick={() => setShowAssessmentModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button></div>
                  <form onSubmit={handleAssessmentSubmit} className="space-y-3">
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Name *</label><input required value={assessForm.name} onChange={e => setAssessForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Mid-term Exam" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-gray-600 text-xs font-medium mb-1">Type</label>
                        <select value={assessForm.type} onChange={e => setAssessForm(p => ({ ...p, type: e.target.value as Assessment["type"] }))} className={inputCls}><option value="exam">Exam</option><option value="assignment">Assignment</option><option value="quiz">Quiz</option><option value="project">Project</option><option value="practical">Practical</option></select>
                      </div>
                      <div><label className="block text-gray-600 text-xs font-medium mb-1">Max Marks</label><input type="number" value={assessForm.maxMarks} onChange={e => setAssessForm(p => ({ ...p, maxMarks: Number(e.target.value) }))} className={inputCls} /></div>
                    </div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Due Date</label><input type="date" value={assessForm.dueDate} onChange={e => setAssessForm(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} /></div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAssessmentModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium">Cancel</button>
                      <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-sm">Create</button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
