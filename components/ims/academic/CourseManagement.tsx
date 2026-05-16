"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Search, Plus, X, Edit, Trash2, Layers, ArrowUp, ArrowDown, ChevronLeft } from "lucide-react"
import { getCourses, createCourse, updateCourse, deleteCourseFromStore, getModulesByCourse, createModule, updateModule, deleteModule, getBatches, getLecturers, type Course, type CourseModule } from "@/lib/academic-store"
import { toast } from "sonner"

const emptyForm = { name: "", code: "", duration: "", category: "", level: "", status: "active" as Course["status"] }

export default function CourseManagement({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null)
  const [moduleForm, setModuleForm] = useState({ name: "", description: "" })

  const courses = getCourses()
  const batches = getBatches()
  const lecturers = getLecturers()

  const selectedCourse = selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null
  const selectedModules = selectedCourseId ? getModulesByCourse(selectedCourseId) : []

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.code || "").toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c: Course) => {
    setEditing(c)
    setForm({ name: c.name, code: c.code || "", duration: c.duration || "", category: c.category || "", level: c.level || "", status: c.status })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error("Course name is required")
    try {
      if (editing) {
        updateCourse(editing.id, { ...form, code: form.code || null, duration: form.duration || null, category: form.category || null, level: form.level || null })
        toast.success("Course updated")
      } else {
        createCourse({ ...form, code: form.code || null, duration: form.duration || null, category: form.category || null, level: form.level || null })
        toast.success("Course added")
      }
      setShowModal(false); onRefresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this course and all its modules?")) return
    deleteCourseFromStore(id)
    if (selectedCourseId === id) setSelectedCourseId(null)
    toast.success("Course deleted"); onRefresh()
  }

  const handleModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleForm.name.trim() || !selectedCourseId) return toast.error("Module name required")
    try {
      if (editingModule) {
        updateModule(editingModule.id, { name: moduleForm.name, description: moduleForm.description || null })
      } else {
        createModule({ courseId: selectedCourseId, name: moduleForm.name, description: moduleForm.description || null, orderIndex: selectedModules.length })
      }
      setShowModuleModal(false); setEditingModule(null); setModuleForm({ name: "", description: "" })
      toast.success(editingModule ? "Module updated" : "Module added"); onRefresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const moveModule = (mod: CourseModule, direction: "up" | "down") => {
    const idx = selectedModules.findIndex(m => m.id === mod.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= selectedModules.length) return
    updateModule(mod.id, { orderIndex: selectedModules[swapIdx].orderIndex })
    updateModule(selectedModules[swapIdx].id, { orderIndex: mod.orderIndex })
    onRefresh()
  }

  const getCourseBatches = (courseId: string) => batches.filter(b => b.courseId === courseId)
  const inputCls = "w-full bg-gray-50 text-gray-900 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"

  // ── Course Detail View ──
  if (selectedCourse) {
    const courseBatches = getCourseBatches(selectedCourse.id)
    const courseLecturers = lecturers.filter(l => courseBatches.some(b => b.lecturerId === l.id))

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedCourseId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedCourse.name}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {selectedCourse.code && <span>Code: <strong className="text-gray-700">{selectedCourse.code}</strong></span>}
                {selectedCourse.duration && <span>Duration: <strong className="text-gray-700">{selectedCourse.duration}</strong></span>}
                {selectedCourse.category && <span>Category: <strong className="text-gray-700">{selectedCourse.category}</strong></span>}
                {selectedCourse.level && <span>Level: <strong className="text-gray-700">{selectedCourse.level}</strong></span>}
                <span>Status: <strong className={selectedCourse.status === "active" ? "text-green-700" : "text-gray-500"}>{selectedCourse.status}</strong></span>
              </div>
            </div>
            <button onClick={() => openEdit(selectedCourse)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 text-gray-700 font-medium">Edit Course</button>
          </div>

          {/* Assigned Batches & Lecturers */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Assigned Batches ({courseBatches.length})</p>
              {courseBatches.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">{courseBatches.map(b => <span key={b.id} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg font-medium">{b.name}</span>)}</div>
              ) : <p className="text-gray-400 text-xs">None assigned</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Lecturers ({courseLecturers.length})</p>
              {courseLecturers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">{courseLecturers.map(l => <span key={l.id} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">{l.fullName}</span>)}</div>
              ) : <p className="text-gray-400 text-xs">None assigned</p>}
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-sm">Modules ({selectedModules.length})</h3>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => { setEditingModule(null); setModuleForm({ name: "", description: "" }); setShowModuleModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-semibold">
              <Plus className="w-3 h-3" /> Add Module
            </motion.button>
          </div>
          <div className="p-4">
            {selectedModules.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No modules yet. Add modules to structure this course.</p>
            ) : (
              <div className="space-y-2">
                {selectedModules.map((mod, i) => (
                  <div key={mod.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-orange-200 transition-all">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{mod.name}</p>
                      {mod.description && <p className="text-xs text-gray-400 truncate">{mod.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveModule(mod, "up")} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveModule(mod, "down")} disabled={i === selectedModules.length - 1} className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditingModule(mod); setModuleForm({ name: mod.name, description: mod.description || "" }); setShowModuleModal(true) }} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-orange-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { deleteModule(mod.id); toast.success("Module deleted"); onRefresh() }} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Module Modal */}
        <AnimatePresence>
          {showModuleModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{editingModule ? "Edit Module" : "Add Module"}</h2>
                  <button onClick={() => setShowModuleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleModuleSubmit} className="space-y-3">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Module Name *</label><input required value={moduleForm.name} onChange={e => setModuleForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Description</label><textarea value={moduleForm.description} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))} className={inputCls + " h-20 resize-none"} /></div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm">{editingModule ? "Update" : "Add"}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course Edit Modal (reused) */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Course" : "Add Course"}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Course Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Code</label><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className={inputCls} placeholder="e.g. CAD101" /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Duration</label><input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className={inputCls} placeholder="e.g. 3 months" /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Category</label><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls} placeholder="e.g. CAD, BIM" /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1">Level</label><input value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className={inputCls} placeholder="e.g. Beginner" /></div>
                  </div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Course["status"] }))} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm">{editing ? "Update" : "Add Course"}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Course List View ──
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">{courses.length} courses</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/20">
          <Plus className="w-4 h-4" /> Add Course
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
            className="w-full pl-9 pr-3 py-2.5 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => {
          const cBatches = getCourseBatches(c.id)
          const cModules = getModulesByCourse(c.id)
          return (
            <motion.div key={c.id} whileHover={{ y: -2 }} className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedCourseId(c.id)}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-900 font-bold">{c.name}</h3>
                  {c.code && <p className="text-xs text-orange-600 font-mono mt-0.5">{c.code}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-gray-500">
                {c.duration && <div><p className="text-[10px] text-gray-400 uppercase">Duration</p><p className="text-gray-700">{c.duration}</p></div>}
                {c.category && <div><p className="text-[10px] text-gray-400 uppercase">Category</p><p className="text-gray-700">{c.category}</p></div>}
                {c.level && <div><p className="text-[10px] text-gray-400 uppercase">Level</p><p className="text-gray-700">{c.level}</p></div>}
                <div><p className="text-[10px] text-gray-400 uppercase">Status</p><span className={`text-xs font-semibold ${c.status === "active" ? "text-green-600" : "text-gray-500"}`}>{c.status}</span></div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span>{cBatches.length} batches</span>
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{cModules.length} modules</span>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />No courses found
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Course" : "Add Course"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="block text-gray-600 text-xs font-medium mb-1">Course Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Code</label><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className={inputCls} placeholder="e.g. CAD101" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Duration</label><input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className={inputCls} placeholder="e.g. 3 months" /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Category</label><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Level</label><input value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className={inputCls} /></div>
                </div>
                <div><label className="block text-gray-600 text-xs font-medium mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Course["status"] }))} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm">{editing ? "Update" : "Add Course"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
