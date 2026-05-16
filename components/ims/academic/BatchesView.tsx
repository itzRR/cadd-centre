"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { CalendarDays, Plus, Users, ChevronRight, X, User, BookOpen, LayoutGrid, List, Search, Edit, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getBatches, createBatch, updateBatch, getEnrollments, allocateLecturer, getModulesByCourse, getAssessmentsByBatch } from "@/lib/data"
import { generateBatchCode } from "@/lib/ims-data"
import { supabase } from "@/lib/supabase"
import AssessmentPanel from "@/components/ims/academic/AssessmentPanel"

/* ─── Batch Attendance Panel ─── */
function BatchAttendancePanel({ batchId, enrollments }: { batchId: string, enrollments: any[] }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = React.useState(today)
  const [records, setRecords] = React.useState<Record<string, string>>({})  // enrollment_id → status
  const [saving, setSaving] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadAttendance()
  }, [date, batchId])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('attendance')
        .select('enrollment_id, status')
        .eq('batch_id', batchId)
        .eq('date', date)
      const map: Record<string, string> = {}
      ;(data || []).forEach((r: any) => { map[r.enrollment_id] = r.status })
      setRecords(map)
    } catch { }
    finally { setLoading(false) }
  }

  const markAttendance = async (enrollmentId: string, status: string) => {
    setSaving(enrollmentId)
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          enrollment_id: enrollmentId,
          batch_id: batchId,
          date,
          status,
        }, { onConflict: 'enrollment_id,date' })
      if (error) throw error
      setRecords(prev => ({ ...prev, [enrollmentId]: status }))
      toast.success(`Marked ${status}`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(null) }
  }

  const stats = {
    total: enrollments.length,
    present: Object.values(records).filter(s => s === 'present').length,
    absent: Object.values(records).filter(s => s === 'absent').length,
    late: Object.values(records).filter(s => s === 'late').length,
    unmarked: enrollments.length - Object.keys(records).length,
  }

  return (
    <div className="space-y-4">
      {/* Date Picker + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
          <span className="text-xs text-gray-500 font-medium">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg">{stats.present} Present</span>
          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg">{stats.absent} Absent</span>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">{stats.late} Late</span>
          {stats.unmarked > 0 && <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{stats.unmarked} Unmarked</span>}
        </div>
      </div>

      {/* Mark All buttons */}
      {enrollments.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => enrollments.forEach(e => markAttendance(e.id, 'present'))}
            className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-bold hover:bg-green-100 transition-colors">
            Mark All Present
          </button>
          <button onClick={() => enrollments.forEach(e => markAttendance(e.id, 'absent'))}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">
            Mark All Absent
          </button>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500">No students enrolled in this batch.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrollments.map(enrollment => {
            const status = records[enrollment.id]
            return (
              <div key={enrollment.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                    status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                    status === 'absent' ? 'bg-red-100 text-red-600 border-red-200' :
                    status === 'late' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                    {enrollment.students?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{enrollment.students?.full_name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{enrollment.students?.student_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => markAttendance(enrollment.id, 'present')} disabled={saving === enrollment.id}
                    className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                    title="Present">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => markAttendance(enrollment.id, 'late')} disabled={saving === enrollment.id}
                    className={`p-2 rounded-lg transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600'}`}
                    title="Late">
                    <Clock className="w-4 h-4" />
                  </button>
                  <button onClick={() => markAttendance(enrollment.id, 'absent')} disabled={saving === enrollment.id}
                    className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                    title="Absent">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export interface AcademicBatch {
  id: string; name: string; course_id: string; course_name: string
  start_date: string; end_date: string; student_ids: string[]
  batch_code?: string; lecturer_id?: string; lecturer_name?: string
  time_code?: string; type_code?: string; enrolled_count?: number
  created_at: string; _original: any
}

interface BatchesViewProps {
  courses: { id: string, name: string }[]
  lecturers: { id: string, full_name: string, specialization?: string | null }[]
}

export default function BatchesView({ courses, lecturers }: BatchesViewProps) {
  const [batches, setBatches] = useState<AcademicBatch[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState<AcademicBatch | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  
  const [selectedBatch, setSelectedBatch] = useState<AcademicBatch | null>(null)
  const [panelTab, setPanelTab] = useState<'overview' | 'students' | 'attendance' | 'exams'>('overview')
  const [panelModules, setPanelModules] = useState<any[]>([])
  const [panelAssessments, setPanelAssessments] = useState<any[]>([])
  const [panelLoading, setPanelLoading] = useState(false)

  const emptyForm = { name: "", course_id: "", start_date: "", end_date: "", lecturer_id: "", time_code: "M", type_code: "G" }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, enrs] = await Promise.all([getBatches(false), getEnrollments()])
      setEnrollments(enrs)
      const mapped = data.map((b: any) => {
        const lecturerAlloc = b.lecturer_allocations?.[0]
        return {
          id: b.id, name: b.name, course_id: b.course_id,
          course_name: b.courses?.title || 'Unknown Course',
          start_date: b.start_date, end_date: b.end_date, student_ids: [],
          batch_code: b.name.split(' - ').pop() || b.name,
          lecturer_id: lecturerAlloc?.lecturer_id,
          lecturer_name: lecturerAlloc?.profiles?.full_name || 'No Lecturer',
          enrolled_count: enrs.filter((e: any) => e.batch_id === b.id).length,
          time_code: b.schedule, type_code: b.mode,
          created_at: b.created_at, _original: b
        }
      })
      setBatches(mapped)
    } catch (e: any) { toast.error("Failed to load batches: " + e.message) }
    finally { setLoading(false) }
  }

  const loadPanelData = async (batch: AcademicBatch) => {
    setPanelLoading(true)
    try {
      const [mods, assess] = await Promise.all([getModulesByCourse(batch.course_id), getAssessmentsByBatch(batch.id)])
      setPanelModules(mods); setPanelAssessments(assess)
    } catch { toast.error("Failed to load module data") }
    finally { setPanelLoading(false) }
  }

  const selectBatch = (batch: AcademicBatch) => { setSelectedBatch(batch); setPanelTab('overview'); loadPanelData(batch) }

  const openEdit = (batch: AcademicBatch, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingBatch(batch)
    setForm({
      name: batch.name, course_id: batch.course_id,
      start_date: batch.start_date, end_date: batch.end_date || '',
      lecturer_id: batch.lecturer_id || '', time_code: 'M', type_code: 'G'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBatch && (!form.course_id || !form.start_date)) return toast.error("Course and Start Date are required")
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.id, {
          name: form.name,
          start_date: form.start_date, end_date: form.end_date || undefined,
        })
        if (form.lecturer_id && form.lecturer_id !== editingBatch.lecturer_id) {
          await allocateLecturer(editingBatch.id, form.lecturer_id)
        }
        toast.success("Batch updated")
      } else {
        const course = courses.find(c => c.id === form.course_id)
        if (!course) throw new Error("Invalid course")
        const startDateObj = new Date(form.start_date)
        const batchCode = generateBatchCode(course.name, startDateObj, form.time_code as any, form.type_code as any)
        const finalName = form.name.trim() || `${course.name} - ${batchCode}`
        const newBatch = await createBatch({
          course_id: form.course_id, name: finalName,
          start_date: form.start_date, end_date: form.end_date || undefined,
          schedule: form.time_code === 'M' ? 'Morning' : form.time_code === 'A' ? 'Afternoon' : 'Evening',
          mode: 'classroom', seats: 30
        } as any)
        if (form.lecturer_id) await allocateLecturer(newBatch.id, form.lecturer_id)
        toast.success(`Batch created: ${batchCode}`)
      }
      setShowModal(false); setEditingBatch(null); loadData()
    } catch (e: any) { toast.error(e.message) }
  }

  // Filter batches
  const filtered = batches.filter(b => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!b.name.toLowerCase().includes(q) && !b.course_name.toLowerCase().includes(q) && !(b.batch_code || '').toLowerCase().includes(q)) return false
    }
    if (courseFilter && b.course_id !== courseFilter) return false
    return true
  })

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Batches</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search batches..." className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white w-48 focus:outline-none focus:border-emerald-500" />
          </div>
          {/* Course Filter */}
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500">
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingBatch(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No batches found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'card' ? (
        /* ── CARD VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(batch => (
            <motion.div key={batch.id} whileHover={{ y: -4 }} onClick={() => selectBatch(batch)}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer group relative">
              <button onClick={(e) => openEdit(batch, e)} className="absolute top-3 right-3 p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><CalendarDays className="w-5 h-5" /></div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md uppercase tracking-wider">{batch.batch_code || 'NO CODE'}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{batch.name}</h3>
              <p className="text-xs text-gray-500 mb-1 truncate">{batch.course_name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span>{new Date(batch.start_date).toLocaleDateString()}</span>
                <span>→</span>
                <span>{batch.end_date ? new Date(batch.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <User className="w-3 h-3" /> <span className="truncate">{batch.lecturer_name}</span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Users className="w-3.5 h-3.5" /> {batch.enrolled_count || 0} students</div>
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">Manage <ChevronRight className="w-3 h-3" /></div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Batch</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Course</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Lecturer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Start</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">End</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Students</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(batch => (
                <tr key={batch.id} onClick={() => selectBatch(batch)} className="hover:bg-blue-50/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3"><p className="font-bold text-gray-900 truncate max-w-[200px]">{batch.name}</p><p className="text-[10px] text-gray-400 font-mono">{batch.batch_code}</p></td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell truncate max-w-[150px]">{batch.course_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell truncate max-w-[120px]">{batch.lecturer_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(batch.start_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{batch.end_date ? new Date(batch.end_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">{batch.enrolled_count || 0}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={(e) => openEdit(batch, e)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE/EDIT BATCH MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h3>
              <button onClick={() => { setShowModal(false); setEditingBatch(null) }} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name {!editingBatch && '(Optional — auto-generated if blank)'}</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={editingBatch ? '' : 'Will be auto-generated'} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course {!editingBatch && '*'}</label>
                <select required={!editingBatch} value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-gray-50">
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              {!editingBatch && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select value={form.time_code} onChange={e => setForm({...form, time_code: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                      <option value="M">Morning</option><option value="A">Afternoon</option><option value="E">Evening</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={form.type_code} onChange={e => setForm({...form, type_code: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                      <option value="G">Group</option><option value="I">Individual</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lecturer</label>
                <select value={form.lecturer_id} onChange={e => setForm({...form, lecturer_id: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-gray-50">
                  <option value="">-- Unassigned --</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setEditingBatch(null) }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700">{editingBatch ? 'Save Changes' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH SIDE PANEL */}
      <AnimatePresence>
        {selectedBatch && (
          <>
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40" onClick={() => setSelectedBatch(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedBatch.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">{selectedBatch.batch_code} • {selectedBatch.course_name}</p>
                </div>
                <button onClick={() => setSelectedBatch(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex border-b border-gray-100 bg-white px-2 overflow-x-auto">
                {['overview', 'students', 'attendance', 'exams'].map(tab => (
                  <button key={tab} onClick={() => setPanelTab(tab as any)}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${panelTab === tab ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {tab === 'exams' ? 'Exams & Assessments' : tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                {panelTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Start Date</p>
                        <p className="font-medium text-gray-900">{new Date(selectedBatch.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">End Date</p>
                        <p className="font-medium text-gray-900">{selectedBatch.end_date ? new Date(selectedBatch.end_date).toLocaleDateString() : 'Ongoing'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><User className="w-6 h-6" /></div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Assigned Lecturer</p>
                        <p className="font-medium text-gray-900">{selectedBatch.lecturer_name}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Users className="w-6 h-6" /></div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Enrolled Students</p>
                        <p className="font-medium text-gray-900">{selectedBatch.enrolled_count || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
                {panelTab === 'students' && (
                  <div className="space-y-3">
                    {enrollments.filter(e => e.batch_id === selectedBatch.id).map(e => (
                      <div key={e.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-cyan-700 font-bold border border-cyan-100">
                            {e.students?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{e.students?.full_name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500 font-mono">{e.students?.student_id || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">{e.status}</span>
                      </div>
                    ))}
                    {enrollments.filter(e => e.batch_id === selectedBatch.id).length === 0 && (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                        <p className="text-gray-500">No students enrolled in this batch yet.</p>
                      </div>
                    )}
                  </div>
                )}
                {panelTab === 'attendance' && (
                  <BatchAttendancePanel batchId={selectedBatch.id} enrollments={enrollments.filter(e => e.batch_id === selectedBatch.id)} />
                )}
                {panelTab === 'exams' && (
                  panelLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
                  ) : (
                    <AssessmentPanel
                      modules={panelModules}
                      enrollments={enrollments.filter(e => e.batch_id === selectedBatch.id)}
                      assessments={panelAssessments}
                      onRefresh={() => loadPanelData(selectedBatch)}
                    />
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
