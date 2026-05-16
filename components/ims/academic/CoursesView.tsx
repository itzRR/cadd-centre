"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, BookOpen, Layers, ChevronDown, ChevronRight, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getCourses, createCourse, updateCourse, deleteCourse, getModulesByCourse, createModule, updateModule, deleteModule } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"

// Only academic_head and admins can manage courses/modules. academic_officer is READ ONLY.
const MANAGE_ROLES = ['admin', 'super_admin', 'academic_head']
import { confirmDialog } from "@/components/ui/global-confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface AcademicCourse {
  id: string; name: string; duration: string; fee: number
  created_at: string; _original: any
}

export default function CoursesView() {
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'modules'>('courses')
  const [courses, setCourses] = useState<AcademicCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<AcademicCourse | null>(null)

  // Module state
  const [selectedCourseForModules, setSelectedCourseForModules] = useState<string>('')
  const [modules, setModules] = useState<any[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<any>(null)
  
  const emptyForm = {
    title: "", slug: "", description: "", short_description: "",
    price: "", original_price: "",
    level: "Proficient Certificate", category: "BIM",
    total_hours: "80", tags: "",
    is_active: true, is_featured: false,
  }
  const [form, setForm] = useState(emptyForm)

  const emptyModuleForm = { title: "", description: "", duration_hours: "", order_index: "", topics: "" }
  const [moduleForm, setModuleForm] = useState(emptyModuleForm)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, user] = await Promise.all([getCourses(false), getCurrentUser()])
      if (user?.role && MANAGE_ROLES.includes(user.role)) setCanManage(true)
      const mapped = data.map((c: any) => ({
        id: c.id, name: c.title,
        duration: c.total_hours ? `${c.total_hours} hours` : "N/A",
        fee: c.price, created_at: c.created_at, _original: c
      }))
      setCourses(mapped)
    } catch (e: any) { toast.error("Failed to load courses: " + e.message) }
    finally { setLoading(false) }
  }

  const loadModules = async (courseId: string) => {
    if (!courseId) { setModules([]); return }
    setModulesLoading(true)
    try {
      const data = await getModulesByCourse(courseId)
      setModules(data)
    } catch (e: any) { toast.error("Failed to load modules: " + e.message) }
    finally { setModulesLoading(false) }
  }

  useEffect(() => {
    if (activeSubTab === 'modules' && selectedCourseForModules) {
      loadModules(selectedCourseForModules)
    }
  }, [activeSubTab, selectedCourseForModules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        slug: form.slug || autoSlug(form.title), title: form.title,
        description: form.description,
        short_description: form.short_description || undefined,
        price: parseFloat(form.price) || 0,
        original_price: form.original_price ? parseFloat(form.original_price) : undefined,
        level: form.level, category: form.category,
        total_hours: parseInt(form.total_hours) || 0,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        is_active: form.is_active, is_featured: form.is_featured,
      }
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload)
        toast.success("Course updated")
      } else {
        await createCourse(payload as any)
        toast.success("Course created")
      }
      setShowModal(false); loadData()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog("Are you sure you want to delete this course?")
    if (!confirmed) return
    try { await deleteCourse(id); toast.success("Course deleted"); loadData() }
    catch (e: any) { toast.error(e.message) }
  }

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseForModules) return toast.error("Select a course first")
    try {
      const payload = {
        course_id: selectedCourseForModules,
        title: moduleForm.title,
        description: moduleForm.description || undefined,
        duration_hours: parseInt(moduleForm.duration_hours) || 0,
        order_index: parseInt(moduleForm.order_index) || modules.length + 1,
        topics: moduleForm.topics.split(",").map(t => t.trim()).filter(Boolean),
      }
      if (editingModule) {
        await updateModule(editingModule.id, payload)
        toast.success("Module updated")
      } else {
        await createModule(payload)
        toast.success("Module created")
      }
      setShowModuleModal(false); setEditingModule(null)
      loadModules(selectedCourseForModules)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteModule = async (id: string) => {
    const confirmed = await confirmDialog("Delete this module?")
    if (!confirmed) return
    try { await deleteModule(id); toast.success("Module deleted"); loadModules(selectedCourseForModules) }
    catch (e: any) { toast.error(e.message) }
  }

  const columns: CDMColumn<AcademicCourse>[] = [
    { key: "name", label: "Course Name", className: "font-bold text-gray-900" },
    { key: "duration", label: "Duration" },
    { key: "fee", label: "Fee (LKR)", render: (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) },
    { key: "created_at", label: "Added On", render: (val) => new Date(val).toLocaleDateString() }
  ]

  const actions: CDMAction<AcademicCourse>[] = canManage ? [
    {
      label: "Edit", icon: Edit,
      onClick: (r) => { 
        setEditingCourse(r); const orig = r._original
        setForm({
          title: orig.title || "", slug: orig.slug || "",
          description: orig.description || "", short_description: orig.short_description || "",
          price: (orig.price || 0).toString(),
          original_price: orig.original_price ? orig.original_price.toString() : "",
          level: orig.level || "Proficient Certificate", category: orig.category || "BIM",
          total_hours: (orig.total_hours || 0).toString(),
          tags: Array.isArray(orig.tags) ? orig.tags.join(", ") : "",
          is_active: orig.is_active !== false, is_featured: !!orig.is_featured,
        }); setShowModal(true) 
      }
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (r) => handleDelete(r.id) }
  ] : []

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Courses | Modules */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveSubTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'courses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <BookOpen className="w-4 h-4" /> Courses
        </button>
        <button onClick={() => setActiveSubTab('modules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'modules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Layers className="w-4 h-4" /> Modules
        </button>
      </div>

      {/* ── COURSES TAB ── */}
      {activeSubTab === 'courses' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Courses</h2>
            {canManage && (
              <button onClick={() => { setEditingCourse(null); setForm(emptyForm); setShowModal(true) }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            )}
          </div>
          <CDMDataTable data={courses} columns={columns} actions={actions} loading={loading} searchPlaceholder="Search courses..." exportFileName="Courses" />
        </>
      )}

      {/* ── MODULES TAB ── */}
      {activeSubTab === 'modules' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Modules</h2>
              <select value={selectedCourseForModules} onChange={e => setSelectedCourseForModules(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500">
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedCourseForModules && canManage && (
              <button onClick={() => { setEditingModule(null); setModuleForm(emptyModuleForm); setShowModuleModal(true) }}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20">
                <Plus className="w-4 h-4" /> Add Module
              </button>
            )}
          </div>

          {!selectedCourseForModules ? (
            <div className="text-center py-16 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a course to view its modules</p>
            </div>
          ) : modulesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : modules.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No modules for this course</p>
              <p className="text-sm mt-1">Add your first module to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {mod.order_index || idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{mod.title}</h3>
                        {mod.description && <p className="text-sm text-gray-500 mt-1">{mod.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{mod.duration_hours || 0}h duration</span>
                          <span>•</span>
                          <span>{mod.topics?.length || 0} topics</span>
                        </div>
                        {mod.topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mod.topics.map((t: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-medium">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => {
                          setEditingModule(mod)
                          setModuleForm({
                            title: mod.title, description: mod.description || '',
                            duration_hours: (mod.duration_hours || 0).toString(),
                            order_index: (mod.order_index || idx + 1).toString(),
                            topics: (mod.topics || []).join(', ')
                          })
                          setShowModuleModal(true)
                        }} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteModule(mod.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE MODAL */}
          {showModuleModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">{editingModule ? 'Edit' : 'Add'} Module</h3>
                  <button onClick={() => { setShowModuleModal(false); setEditingModule(null) }} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleModuleSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input required value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} placeholder="e.g. Introduction to AutoCAD" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} rows={3} placeholder="Module description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (hours)</Label>
                      <Input type="number" min="0" value={moduleForm.duration_hours} onChange={e => setModuleForm({...moduleForm, duration_hours: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Index</Label>
                      <Input type="number" min="1" value={moduleForm.order_index} onChange={e => setModuleForm({...moduleForm, order_index: e.target.value})} placeholder={`${modules.length + 1}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Topics (comma separated)</Label>
                    <Input value={moduleForm.topics} onChange={e => setModuleForm({...moduleForm, topics: e.target.value})} placeholder="Drawing tools, Layers, Dimensions" />
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => { setShowModuleModal(false); setEditingModule(null) }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">{editingModule ? 'Save Changes' : 'Create Module'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* COURSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{editingCourse ? 'Edit' : 'Add'} Course</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="course-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input placeholder="e.g. BIM Master Certificate" value={form.title}
                    onChange={e => { set("title", e.target.value); set("slug", autoSlug(e.target.value)) }} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input placeholder="auto-generated" value={form.slug} onChange={e => set("slug", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Level *</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.level} onChange={e => set("level", e.target.value)}>
                      <option>Proficient Certificate</option><option>Master Certificate</option><option>Expert Certificate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.category} onChange={e => set("category", e.target.value)}>
                      <option>BIM</option><option>CAD</option><option>Project Management</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Hours *</Label>
                    <Input type="number" min="1" value={form.total_hours} onChange={e => set("total_hours", e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Price (Rs) *</Label><Input type="number" min="0" step="500" value={form.price} onChange={e => set("price", e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Original Price (Rs)</Label><Input type="number" min="0" step="500" value={form.original_price} onChange={e => set("original_price", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Short Description</Label><Input placeholder="One-line summary" value={form.short_description} onChange={e => set("short_description", e.target.value)} /></div>
                <div className="space-y-2"><Label>Description *</Label><Textarea placeholder="Full course description..." value={form.description} onChange={e => set("description", e.target.value)} rows={4} required /></div>
                <div className="space-y-2"><Label>Tags (comma separated)</Label><Input placeholder="BIM, Revit, Navisworks" value={form.tags} onChange={e => set("tags", e.target.value)} /></div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} /> Active</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} /> Featured</label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
              <button type="submit" form="course-form" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
