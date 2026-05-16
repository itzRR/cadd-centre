"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarDays, Search, Plus, X, Edit, Trash2, Eye, LayoutGrid, List, Users, UserCheck, BookOpen, Filter, CheckCircle, Clock, Archive } from "lucide-react"
import { getBatches, createBatch, updateBatch, deleteBatch, getCourses, getLecturers, getStudents, type Batch } from "@/lib/academic-store"
import { toast } from "sonner"
import BatchDetail from "./BatchDetail"

const emptyForm = { name: "", startDate: "", endDate: "", courseId: "", lecturerId: "" }

export default function BatchList({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [filterCourse, setFilterCourse] = useState("")
  const [filterLecturer, setFilterLecturer] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [studentModalBatchId, setStudentModalBatchId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  const batches = getBatches()
  const courses = getCourses()
  const lecturers = getLecturers()
  const allStudents = getStudents()

  // If a batch is selected, show detail view
  if (selectedBatchId) {
    return <BatchDetail batchId={selectedBatchId} onBack={() => setSelectedBatchId(null)} onRefresh={onRefresh} />
  }

  const filtered = batches.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.name.toLowerCase().includes(q)
    const matchCourse = !filterCourse || b.courseId === filterCourse
    const matchLecturer = !filterLecturer || b.lecturerId === filterLecturer
    const matchStatus = !filterStatus || b.status === filterStatus
    return matchSearch && matchCourse && matchLecturer && matchStatus
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (b: Batch) => {
    setEditing(b)
    setForm({ name: b.name, startDate: b.startDate, endDate: b.endDate || "", courseId: b.courseId || "", lecturerId: b.lecturerId || "" })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error("Batch name is required")
    if (!form.startDate) return toast.error("Start date is required")
    try {
      if (editing) {
        updateBatch(editing.id, { name: form.name, startDate: form.startDate, endDate: form.endDate || null, courseId: form.courseId || null, lecturerId: form.lecturerId || null })
        toast.success("Batch updated")
      } else {
        createBatch({ name: form.name, startDate: form.startDate, endDate: form.endDate || null, courseId: form.courseId || null, lecturerId: form.lecturerId || null })
        toast.success("Batch created")
      }
      setShowModal(false); onRefresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this batch?")) return
    deleteBatch(id); toast.success("Batch deleted"); onRefresh()
  }

  const openStudentAssign = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId)
    setStudentModalBatchId(batchId)
    setSelectedStudentIds(batch?.studentIds || [])
    setShowStudentModal(true)
  }

  const saveStudentAssignment = () => {
    if (!studentModalBatchId) return
    updateBatch(studentModalBatchId, { studentIds: selectedStudentIds })
    setShowStudentModal(false)
    toast.success("Students updated")
    onRefresh()
  }

  const getCourseName = (id: string | null) => id ? courses.find(c => c.id === id)?.name || "—" : "—"
  const getLecturerName = (id: string | null) => id ? lecturers.find(l => l.id === id)?.fullName || "—" : "—"
  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", upcoming: "bg-yellow-100 text-yellow-700" }
  const statusIcons: Record<string, React.ElementType> = { active: CheckCircle, completed: Archive, upcoming: Clock }

  const inputCls = "w-full bg-gray-50 text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Batch Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">{batches.length} total batches</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            <button onClick={() => setViewMode("card")} className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}><List className="w-4 h-4" /></button>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> New Batch
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches…"
            className="w-full pl-9 pr-3 py-2.5 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 text-sm" />
        </div>
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm min-w-[130px]">
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterLecturer} onChange={e => setFilterLecturer(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm min-w-[130px]">
          <option value="">All Lecturers</option>
          {lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm min-w-[120px]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => {
            const StatusIcon = statusIcons[b.status] || Clock
            return (
              <motion.div key={b.id} whileHover={{ y: -2 }} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-gray-900 font-bold truncate">{b.name}</h3>
                    <p className="text-emerald-600 text-xs font-medium mt-0.5">{getCourseName(b.courseId)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${statusColors[b.status]}`}>
                    <StatusIcon className="w-3 h-3" />{b.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-700">{b.studentIds.length}</span> students</div>
                  <div className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{getLecturerName(b.lecturerId)}</span></div>
                  <div className="text-xs"><span className="text-gray-400">Start:</span> {b.startDate}</div>
                  <div className="text-xs"><span className="text-gray-400">End:</span> {b.endDate || "—"}</div>
                </div>
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                  <button onClick={() => setSelectedBatchId(b.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"><Eye className="w-3 h-3" />View</button>
                  <button onClick={() => openEdit(b)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"><Edit className="w-3 h-3" />Edit</button>
                  <button onClick={() => openStudentAssign(b.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"><Users className="w-3 h-3" />Students</button>
                  <button onClick={() => handleDelete(b.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"><Trash2 className="w-3 h-3" />Delete</button>
                </div>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />No batches found
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  {["Batch Name", "Course", "Lecturer", "Students", "Start", "End", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400">No batches found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600">{getCourseName(b.courseId)}</td>
                    <td className="px-4 py-3 text-gray-600">{getLecturerName(b.lecturerId)}</td>
                    <td className="px-4 py-3 text-center font-medium text-emerald-700">{b.studentIds.length}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.startDate}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.endDate || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[b.status]}`}>{b.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedBatchId(b.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Batch Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Batch" : "New Batch"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="block text-gray-600 text-xs font-medium mb-1">Batch Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. AutoCAD Batch A" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Start Date *</label><input type="date" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">End Date</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} /></div>
                </div>
                <div><label className="block text-gray-600 text-xs font-medium mb-1">Course</label>
                  <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} className={inputCls}><option value="">Select Course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                <div><label className="block text-gray-600 text-xs font-medium mb-1">Lecturer</label>
                  <select value={form.lecturerId} onChange={e => setForm(p => ({ ...p, lecturerId: e.target.value }))} className={inputCls}><option value="">Select Lecturer</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select>
                </div>
                {!editing && (
                  <button type="button" onClick={() => { handleSubmit({ preventDefault: () => {} } as any); }} className="hidden" />
                )}
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20">{editing ? "Update" : "Create"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Assignment Modal */}
      <AnimatePresence>
        {showStudentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Assign Students</h2>
                <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <p className="text-gray-500 text-xs mb-3">Select students to assign to this batch ({selectedStudentIds.length} selected)</p>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {allStudents.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No students registered yet</p>
                ) : allStudents.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id)
                  return (
                    <button key={s.id} type="button" onClick={() => setSelectedStudentIds(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${isSelected ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{s.fullName}</p>
                        <p className="text-[10px] text-gray-400">{s.studentId} · {s.email}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3 pt-4 mt-3 border-t border-gray-100">
                <button onClick={() => setShowStudentModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                <button onClick={saveStudentAssignment} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm">Save ({selectedStudentIds.length})</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
