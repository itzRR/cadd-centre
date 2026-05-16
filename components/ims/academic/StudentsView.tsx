"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit, Trash2, Plus, UserPlus, AlertTriangle, Search, Filter, CheckCircle, Users } from "lucide-react"
import { motion } from "framer-motion"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getStudents, getEnrollments, getCourses, getBatches, enrollStudent, deleteEnrollment, updateEnrollmentStatus } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import AcademicLeadConfirmationsView from "@/components/ims/academic/LeadConfirmationsView"

// Only academic_head and admins can manage students. academic_officer is READ ONLY here.
const MANAGE_ROLES = ['admin', 'super_admin', 'academic_head']

export default function StudentsView() {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'lead-confirmations'>('students')
  const [students, setStudents] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState<any>(null)
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '', batch_id: '', amount: '0' })
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [batchFilter, setBatchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [allStudents, allEnrollments, allCourses, allBatches, user] = await Promise.all([
        getStudents(),
        getEnrollments(),
        getCourses(false),
        getBatches(false),
        getCurrentUser()
      ])
      setEnrollments(allEnrollments)
      setCourses(allCourses)
      setBatches(allBatches)
      setCurrentUser(user)

      if (user?.role && MANAGE_ROLES.includes(user.role)) {
        setCanManage(true)
      }

      const mapped = allStudents.map((student: any) => {
        const enrollment = allEnrollments.find((e: any) => e.students?.student_id === student.student_id || e.user_id === student.id)
        return {
          id: student.id,
          enrollment_id: enrollment?.id,
          student_id: student.student_id || 'N/A',
          student_name: student.full_name || 'Unknown',
          email: student.email,
          batch_code: enrollment?.batches?.name || 'No Batch',
          batch_id: enrollment?.batch_id || '',
          course_name: enrollment?.courses?.title || 'Not Enrolled',
          status: enrollment?.status || 'unregistered',
          payment_status: enrollment?.payment_status || '-',
          created_at: enrollment?.created_at || student.created_at,
          registered_year: new Date(student.created_at).getFullYear().toString(),
          _original: student,
          _enrollment: enrollment
        }
      })
      setStudents(mapped)
    } catch (e: any) {
      toast.error("Failed to load students: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollForm.student_id || !enrollForm.course_id) return toast.error("Select a student and course")
    setSaving(true)
    try {
      await enrollStudent(
        enrollForm.student_id,
        enrollForm.course_id,
        enrollForm.batch_id || null,
        parseFloat(enrollForm.amount) || 0
      )
      toast.success("Student enrolled successfully!")
      setShowEnrollModal(false)
      setEnrollForm({ student_id: '', course_id: '', batch_id: '', amount: '0' })
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll student")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm?.enrollment_id) return
    setSaving(true)
    try {
      await deleteEnrollment(showDeleteConfirm.enrollment_id)
      toast.success(`Removed ${showDeleteConfirm.student_name} from enrollment`)
      setShowDeleteConfirm(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!showEditModal?.enrollment_id) return
    setSaving(true)
    try {
      await updateEnrollmentStatus(showEditModal.enrollment_id, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      setShowEditModal(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredBatchesForForm = enrollForm.course_id
    ? batches.filter((b: any) => b.course_id === enrollForm.course_id)
    : batches

  // Apply filters to student list
  const filteredStudents = students.filter(s => {
    if (batchFilter && s.batch_id !== batchFilter) return false
    if (yearFilter && s.registered_year !== yearFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  })

  // Get unique years for filter
  const uniqueYears = [...new Set(students.map(s => s.registered_year))].sort().reverse()

  const columns: CDMColumn<any>[] = [
    { key: "student_id", label: "Student ID", className: "font-mono font-bold text-gray-900" },
    { key: "student_name", label: "Name", className: "font-bold text-gray-900" },
    { key: "course_name", label: "Enrolled Course" },
    { key: "batch_code", label: "Batch" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
          val === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
          val === 'completed' ? 'bg-blue-100 text-blue-700' :
          val === 'cancelled' ? 'bg-red-100 text-red-700' :
          val === 'pending' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: "created_at",
      label: "Enroll Date",
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    }
  ]

  const actions: CDMAction<any>[] = canManage ? [
    {
      label: "Edit Status",
      icon: Edit,
      onClick: (r) => r.enrollment_id ? setShowEditModal(r) : toast.info("Student not enrolled yet")
    },
    {
      label: "Remove",
      icon: Trash2,
      variant: "danger",
      onClick: (r) => r.enrollment_id ? setShowDeleteConfirm(r) : toast.info("Student not enrolled yet")
    }
  ] : []

  return (
    <div className="space-y-4 relative">
      {/* Sub-tabs: Students | Lead Confirmations */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveSubTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'students' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Students
        </button>
        <button
          onClick={() => setActiveSubTab('lead-confirmations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'lead-confirmations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Lead Confirmations
        </button>
      </div>

      {/* Lead Confirmations Sub-Tab */}
      {activeSubTab === 'lead-confirmations' && (
        <AcademicLeadConfirmationsView currentUser={currentUser} onRefresh={loadData} />
      )}

      {/* Students Sub-Tab */}
      {activeSubTab === 'students' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Enrolled Students</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Filter */}
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Batches</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              {/* Year Filter */}
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Years</option>
                {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="unregistered">Unregistered</option>
              </select>

              {(batchFilter || yearFilter || statusFilter) && (
                <button onClick={() => { setBatchFilter(''); setYearFilter(''); setStatusFilter(''); }}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  Clear Filters
                </button>
              )}

              {canManage && (
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Enroll Student
                </button>
              )}
            </div>
          </div>

          <CDMDataTable
            data={filteredStudents}
            columns={columns}
            actions={actions}
            loading={loading}
            searchPlaceholder="Search by ID, Name, or Batch..."
            exportFileName="Students"
          />

          {/* ENROLL STUDENT MODAL */}
          {showEnrollModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Enroll Student</h3>
                  <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <form onSubmit={handleEnroll} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                    <select
                      required
                      value={enrollForm.student_id}
                      onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Select Student --</option>
                      {students
                        .filter(s => !s.enrollment_id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.student_name} ({s.email})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Only showing students not yet enrolled in any course</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                      required
                      value={enrollForm.course_id}
                      onChange={e => setEnrollForm({ ...enrollForm, course_id: e.target.value, batch_id: '' })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.level})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Optional)</label>
                    <select
                      value={enrollForm.batch_id}
                      onChange={e => setEnrollForm({ ...enrollForm, batch_id: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- No Batch (assign later) --</option>
                      {filteredBatchesForForm.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={enrollForm.amount}
                      onChange={e => setEnrollForm({ ...enrollForm, amount: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                    <button type="button" onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
                      {saving ? 'Enrolling...' : 'Enroll Student'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT STATUS MODAL */}
          {showEditModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Update Enrollment Status</h3>
                  <p className="text-sm text-gray-500">{showEditModal.student_name}</p>
                </div>
                <div className="p-6 space-y-3">
                  {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={saving}
                      className={`w-full px-4 py-3 rounded-xl text-left font-medium text-sm transition-all border ${
                        showEditModal.status === status
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                      {showEditModal.status === status && <span className="text-xs ml-2 text-emerald-500">• Current</span>}
                    </button>
                  ))}
                  <button onClick={() => setShowEditModal(null)} className="w-full px-4 py-2.5 mt-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-medium">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Remove Enrollment?</h3>
                  <p className="text-sm text-gray-500">
                    This will remove <strong>{showDeleteConfirm.student_name}</strong> from <strong>{showDeleteConfirm.course_name}</strong>. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                    <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50">
                      {saving ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
