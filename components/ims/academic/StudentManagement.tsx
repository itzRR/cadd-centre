"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Search, UserPlus, X, Edit, Trash2, Eye, ChevronDown } from "lucide-react"
import { getStudents, createStudent, updateStudent, deleteStudent, getBatches, getCourses, type Student } from "@/lib/academic-store"
import { toast } from "sonner"

const emptyForm = { fullName: "", email: "", phone: "", address: "", gender: "", guardianName: "", guardianPhone: "", educationBackground: "", registrationDate: new Date().toISOString().slice(0, 10), status: "active" as Student["status"] }

export default function StudentManagement({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [filterBatch, setFilterBatch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const students = getStudents()
  const batches = getBatches()
  const courses = getCourses()

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone || "").includes(q)
    const matchBatch = !filterBatch || batches.some(b => b.id === filterBatch && b.studentIds.includes(s.id))
    const matchStatus = !filterStatus || s.status === filterStatus
    return matchSearch && matchBatch && matchStatus
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (s: Student) => {
    setEditing(s)
    setForm({ fullName: s.fullName, email: s.email, phone: s.phone || "", address: s.address || "", gender: s.gender || "", guardianName: s.guardianName || "", guardianPhone: s.guardianPhone || "", educationBackground: s.educationBackground || "", registrationDate: s.registrationDate, status: s.status })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) return toast.error("Full name is required")
    if (!form.email.trim()) return toast.error("Email is required")
    try {
      if (editing) {
        updateStudent(editing.id, { ...form, phone: form.phone || null, address: form.address || null, gender: form.gender || null, guardianName: form.guardianName || null, guardianPhone: form.guardianPhone || null, educationBackground: form.educationBackground || null })
        toast.success("Student updated")
      } else {
        createStudent({ ...form, phone: form.phone || null, address: form.address || null, gender: form.gender || null, guardianName: form.guardianName || null, guardianPhone: form.guardianPhone || null, educationBackground: form.educationBackground || null })
        toast.success("Student registered")
      }
      setShowModal(false); onRefresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this student? This cannot be undone.")) return
    deleteStudent(id); toast.success("Student deleted"); onRefresh()
  }

  const getStudentBatches = (studentId: string) => batches.filter(b => b.studentIds.includes(studentId))
  const inputCls = "w-full bg-gray-50 text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">{students.length} registered students</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20">
          <UserPlus className="w-4 h-4" /> Register Student
        </motion.button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, email, phone…"
            className="w-full pl-9 pr-3 py-2.5 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 text-sm" />
        </div>
        <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm min-w-[140px]">
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm min-w-[120px]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                {["Student ID", "Full Name", "Email", "Phone", "Batch(es)", "Status", "Registered", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No students found
                </td></tr>
              ) : filtered.map(s => {
                const sBatches = getStudentBatches(s.id)
                return (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-emerald-700 font-semibold">{s.studentId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {sBatches.length > 0 ? (
                        <div className="flex flex-wrap gap-1">{sBatches.map(b => <span key={b.id} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">{b.name}</span>)}</div>
                      ) : <span className="text-gray-400 text-xs">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'graduated' ? 'bg-blue-100 text-blue-700' : s.status === 'withdrawn' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.registrationDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Student Detail */}
      <AnimatePresence>
        {expandedId && (() => {
          const s = students.find(st => st.id === expandedId)
          if (!s) return null
          const sBatches = getStudentBatches(s.id)
          return (
            <motion.div key={expandedId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Student Profile — {s.fullName}</h3>
                <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-400 text-xs">Student ID</p><p className="font-mono text-emerald-700">{s.studentId}</p></div>
                <div><p className="text-gray-400 text-xs">Email</p><p>{s.email}</p></div>
                <div><p className="text-gray-400 text-xs">Phone</p><p>{s.phone || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Gender</p><p>{s.gender || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Address</p><p>{s.address || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Education</p><p>{s.educationBackground || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Guardian</p><p>{s.guardianName || "—"} {s.guardianPhone ? `(${s.guardianPhone})` : ""}</p></div>
                <div><p className="text-gray-400 text-xs">Status</p><p className="capitalize font-semibold">{s.status}</p></div>
              </div>
              {sBatches.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Assigned Batches</p>
                  <div className="flex flex-wrap gap-2">{sBatches.map(b => <span key={b.id} className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium">{b.name}</span>)}</div>
                </div>
              )}
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Student" : "Register Student"}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{editing ? "Update student information" : "Add a new student to the system"}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-gray-600 text-xs font-medium mb-1">Full Name *</label><input required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputCls} placeholder="John Doe" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Email *</label><input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="john@example.com" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="077 123 4567" /></div>
                  <div className="col-span-2"><label className="block text-gray-600 text-xs font-medium mb-1">Address</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="123 Main St, Colombo" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                  </div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Education</label><input value={form.educationBackground} onChange={e => setForm(p => ({ ...p, educationBackground: e.target.value }))} className={inputCls} placeholder="e.g. A/L, Diploma" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Guardian Name</label><input value={form.guardianName} onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Guardian Phone</label><input value={form.guardianPhone} onChange={e => setForm(p => ({ ...p, guardianPhone: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Registration Date</label><input type="date" value={form.registrationDate} onChange={e => setForm(p => ({ ...p, registrationDate: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Student["status"] }))} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option><option value="withdrawn">Withdrawn</option></select>
                  </div>
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20">{editing ? "Update" : "Register"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
