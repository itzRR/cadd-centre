"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserCheck, Search, UserPlus, X, Edit, Trash2, Eye } from "lucide-react"
import { getLecturers, createLecturer, updateLecturer, deleteLecturer, getBatches, getCourses, type Lecturer } from "@/lib/academic-store"
import { toast } from "sonner"

const emptyForm = { fullName: "", email: "", phone: "", specialization: "", employmentStatus: "active" as Lecturer["employmentStatus"], joiningDate: new Date().toISOString().slice(0, 10), availability: "" }

export default function LecturerPanel({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lecturer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const lecturers = getLecturers()
  const batches = getBatches()
  const courses = getCourses()

  const filtered = lecturers.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.fullName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.specialization || "").toLowerCase().includes(q)
    const matchStatus = !filterStatus || l.employmentStatus === filterStatus
    return matchSearch && matchStatus
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (l: Lecturer) => {
    setEditing(l)
    setForm({ fullName: l.fullName, email: l.email, phone: l.phone || "", specialization: l.specialization || "", employmentStatus: l.employmentStatus, joiningDate: l.joiningDate, availability: l.availability || "" })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) return toast.error("Full name is required")
    if (!form.email.trim()) return toast.error("Email is required")
    try {
      if (editing) {
        updateLecturer(editing.id, { ...form, phone: form.phone || null, specialization: form.specialization || null, availability: form.availability || null })
        toast.success("Lecturer updated")
      } else {
        createLecturer({ ...form, phone: form.phone || null, specialization: form.specialization || null, availability: form.availability || null })
        toast.success("Lecturer added")
      }
      setShowModal(false); onRefresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this lecturer?")) return
    deleteLecturer(id); toast.success("Lecturer deleted"); onRefresh()
  }

  const getLecturerBatches = (id: string) => batches.filter(b => b.lecturerId === id)
  const inputCls = "w-full bg-gray-50 text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lecturer Panel</h2>
          <p className="text-gray-500 text-sm mt-0.5">{lecturers.length} registered lecturers</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20">
          <UserPlus className="w-4 h-4" /> Add Lecturer
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, specialization…"
            className="w-full pl-9 pr-3 py-2.5 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="resigned">Resigned</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                {["Lecturer ID", "Full Name", "Email", "Phone", "Specialization", "Batches", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />No lecturers found
                </td></tr>
              ) : filtered.map(l => {
                const lBatches = getLecturerBatches(l.id)
                return (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-purple-700 font-semibold">{l.lecturerId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{l.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{l.email}</td>
                    <td className="px-4 py-3 text-gray-500">{l.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{l.specialization || "—"}</td>
                    <td className="px-4 py-3">
                      {lBatches.length > 0 ? <span className="text-xs font-medium text-purple-700">{lBatches.length} batch{lBatches.length > 1 ? "es" : ""}</span> : <span className="text-gray-400 text-xs">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.employmentStatus === 'active' ? 'bg-green-100 text-green-700' : l.employmentStatus === 'on_leave' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{l.employmentStatus.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(l.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expandedId && (() => {
          const l = lecturers.find(lc => lc.id === expandedId)
          if (!l) return null
          const lBatches = getLecturerBatches(l.id)
          return (
            <motion.div key={expandedId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Lecturer Profile — {l.fullName}</h3>
                <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-400 text-xs">Lecturer ID</p><p className="font-mono text-purple-700">{l.lecturerId}</p></div>
                <div><p className="text-gray-400 text-xs">Email</p><p>{l.email}</p></div>
                <div><p className="text-gray-400 text-xs">Phone</p><p>{l.phone || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Specialization</p><p>{l.specialization || "—"}</p></div>
                <div><p className="text-gray-400 text-xs">Joining Date</p><p>{l.joiningDate}</p></div>
                <div><p className="text-gray-400 text-xs">Status</p><p className="capitalize font-semibold">{l.employmentStatus.replace("_", " ")}</p></div>
                <div><p className="text-gray-400 text-xs">Availability</p><p>{l.availability || "—"}</p></div>
              </div>
              {lBatches.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Assigned Batches</p>
                  <div className="flex flex-wrap gap-2">{lBatches.map(b => (
                    <span key={b.id} className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">{b.name} ({b.studentIds.length} students)</span>
                  ))}</div>
                </div>
              )}
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Lecturer" : "Add Lecturer"}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{editing ? "Update lecturer details" : "Add a new lecturer"}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-gray-600 text-xs font-medium mb-1">Full Name *</label><input required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Email *</label><input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Specialization</label><input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} className={inputCls} placeholder="e.g. AutoCAD, Revit" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Employment Status</label>
                    <select value={form.employmentStatus} onChange={e => setForm(p => ({ ...p, employmentStatus: e.target.value as Lecturer["employmentStatus"] }))} className={inputCls}><option value="active">Active</option><option value="on_leave">On Leave</option><option value="resigned">Resigned</option></select>
                  </div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Joining Date</label><input type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Availability</label><input value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} className={inputCls} placeholder="e.g. Mon-Fri 9am-5pm" /></div>
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20">{editing ? "Update" : "Add Lecturer"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
