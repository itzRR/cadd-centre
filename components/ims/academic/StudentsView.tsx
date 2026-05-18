"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit, Trash2, Plus, UserPlus, AlertTriangle, Search, Filter, CheckCircle, Users, Award, User } from "lucide-react"
import { motion } from "framer-motion"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getStudents, getEnrollments, getCourses, getBatches, enrollStudent, deleteEnrollment, updateEnrollmentStatus, updateStudentProfile, updateEnrollmentBatch } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import AcademicLeadConfirmationsView from "@/components/ims/academic/LeadConfirmationsView"
import { disableStudent } from "@/lib/ims-data"
import { ShieldOff, ShieldCheck } from "lucide-react"

// Only academic_head and admins can manage students. academic_officer is READ ONLY here.
const MANAGE_ROLES = ['admin', 'super_admin', 'academic_head']

interface StudentsViewProps {
  leadConfirmationCount?: number;
}

export default function StudentsView({ leadConfirmationCount = 0 }: StudentsViewProps) {
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
  const [showProfileModal, setShowProfileModal] = useState<any>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({})
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '', batch_id: '', amount: '0' })
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [batchFilter, setBatchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [showDisablePrompt, setShowDisablePrompt] = useState<{ id: string, name: string } | null>(null)
  const [disableReason, setDisableReason] = useState("")
  const [showBatchModal, setShowBatchModal] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  const handleChangeBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showBatchModal) return
    setSaving(true)
    try {
      await updateEnrollmentBatch(showBatchModal.enrollment_id, enrollForm.batch_id || null)
      toast.success("Batch updated successfully")
      setShowBatchModal(null)
      setEnrollForm({ ...enrollForm, batch_id: '' })
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch")
    } finally {
      setSaving(false)
    }
  }

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updates = {
        full_name: profileForm.full_name,
        student_id: profileForm.student_id,
        phone: profileForm.phone,
        personal_email: profileForm.personal_email,
        academic_email: profileForm.academic_email,
        academic_password: profileForm.academic_password,
        nic: profileForm.nic,
        dob: profileForm.dob
      }
      
      await updateStudentProfile(showProfileModal._original.id, updates)
      
      toast.success("Profile updated successfully")
      setIsEditingProfile(false)
      
      const newOriginal = { ...showProfileModal._original, ...updates }
      setShowProfileModal({
        ...showProfileModal,
        _original: newOriginal,
        student_name: updates.full_name,
        student_id: updates.student_id
      })
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const openProfileModal = (r: any) => {
    setShowProfileModal(r)
    setIsEditingProfile(false)
    setProfileForm({
      full_name: r._original?.full_name || '',
      student_id: r._original?.student_id || '',
      phone: r._original?.phone || '',
      personal_email: r._original?.personal_email || r._original?.email || '',
      academic_email: r._original?.academic_email || '',
      academic_password: r._original?.academic_password || '',
      nic: r._original?.nic || '',
      dob: r._original?.dob || ''
    })
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

  const handleToggleDisableStudent = async (r: any) => {
    if (!canManage) return toast.error("Only admins can disable students")
    
    if (!r.disabled) {
      setShowDisablePrompt({ id: r.id, name: r.student_name })
      setDisableReason("")
      return
    } else {
      if (!window.confirm(`Are you sure you want to enable ${r.student_name}'s account?`)) return
    }

    setSaving(true)
    try {
      await disableStudent(r.id, false, "")
      setStudents(prev => prev.map(x => x.id === r.id ? { ...x, disabled: false, disabled_reason: null } : x))
      toast.success(`Account enabled successfully`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const submitDisableStudent = async () => {
    if (!showDisablePrompt) return
    const { id, name } = showDisablePrompt
    setSaving(true)
    try {
      await disableStudent(id, true, disableReason)
      setStudents(prev => prev.map(x => x.id === id ? { ...x, disabled: true, disabled_reason: disableReason || null } : x))
      toast.success(`Account for ${name} disabled successfully`)
      setShowDisablePrompt(null)
    } catch (e: any) {
      toast.error(e.message)
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
      render: (val, r) => {
        if (r.disabled) {
          return <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 flex items-center w-max gap-1"><ShieldOff className="w-3 h-3"/> Disabled</span>
        }
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            val === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
            val === 'completed' ? 'bg-red-100 text-red-700' :
            val === 'cancelled' ? 'bg-red-100 text-red-700' :
            val === 'pending' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {val}
          </span>
        )
      }
    },
    {
      key: "created_at",
      label: "Enroll Date",
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    }
  ]

  const actions: CDMAction<any>[] = canManage ? [
    {
      label: "View Profile",
      icon: User,
      onClick: (r) => openProfileModal(r)
    },
    {
      label: "Edit Status",
      icon: Edit,
      onClick: (r) => r.enrollment_id ? setShowEditModal(r) : toast.info("Student not enrolled yet")
    },
    {
      label: "Change Batch",
      icon: Users,
      onClick: (r) => {
        if (!r.enrollment_id) return toast.info("Student not enrolled yet")
        setShowBatchModal(r)
        setEnrollForm(prev => ({ ...prev, batch_id: r.batch_id || '' }))
      }
    },
    {
      label: "Disable Account",
      icon: ShieldOff,
      show: (r: any) => !r.disabled,
      onClick: (r: any) => handleToggleDisableStudent(r)
    },
    {
      label: "Enable Account",
      icon: ShieldCheck,
      show: (r: any) => !!r.disabled,
      onClick: (r: any) => handleToggleDisableStudent(r)
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
          {leadConfirmationCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {leadConfirmationCount}
            </span>
          )}
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

          {/* CHANGE BATCH MODAL */}
          {showBatchModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Change Batch - {showBatchModal.full_name}</h3>
                  <button type="button" onClick={() => setShowBatchModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <form onSubmit={handleChangeBatchSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Batch</label>
                    <select
                      value={enrollForm.batch_id || ''}
                      onChange={e => setEnrollForm({ ...enrollForm, batch_id: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- No Batch (Remove from current) --</option>
                      {batches
                        .filter((b: any) => (!showBatchModal.course_id || b.course_id === showBatchModal.course_id) && (b.is_active || b.id === showBatchModal.batch_id))
                        .map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.courses?.title ? `${b.courses.title} - ${b.name}` : b.name} {!b.is_active ? '(Inactive)' : ''}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setShowBatchModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                      {saving ? "Saving..." : "Update Batch"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

          {/* PROFILE MODAL */}
          {showProfileModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    Student Profile
                  </h3>
                  <div className="flex items-center gap-2">
                    {canManage && !isEditingProfile && (
                      <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition-all">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button onClick={() => setShowProfileModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {isEditingProfile ? (
                    <form id="edit-profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                          <input required value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Student ID</label>
                          <input required value={profileForm.student_id} onChange={e => setProfileForm({...profileForm, student_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                          <input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Personal Email</label>
                          <input type="email" value={profileForm.personal_email} onChange={e => setProfileForm({...profileForm, personal_email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Academic Email</label>
                          <input type="email" value={profileForm.academic_email} onChange={e => setProfileForm({...profileForm, academic_email: e.target.value})} className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Academic Password</label>
                          <input value={profileForm.academic_password} onChange={e => setProfileForm({...profileForm, academic_password: e.target.value})} className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">NIC</label>
                          <input value={profileForm.nic} onChange={e => setProfileForm({...profileForm, nic: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date of Birth</label>
                          <input type="date" value={profileForm.dob} onChange={e => setProfileForm({...profileForm, dob: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{showProfileModal._original?.full_name || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student ID</label>
                          <div className="font-mono font-medium text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{showProfileModal._original?.student_id || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{showProfileModal._original?.phone || 'N/A'}</div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Personal Email</label>
                          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{showProfileModal._original?.personal_email || showProfileModal._original?.email || 'N/A'}</div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Academic Email</label>
                          <div className="font-medium text-gray-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">{showProfileModal._original?.academic_email || 'N/A'}</div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Academic Password</label>
                          <div className="font-mono font-medium text-gray-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">{showProfileModal._original?.academic_password || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">NIC</label>
                          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{showProfileModal._original?.nic || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</label>
                          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{showProfileModal._original?.dob || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                  {isEditingProfile ? (
                    <>
                      <button onClick={() => setIsEditingProfile(false)} disabled={saving} className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50">Cancel</button>
                      <button form="edit-profile-form" type="submit" disabled={saving} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm shadow-red-500/30 transition-all disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setShowProfileModal(null)} className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm transition-all">Close</button>
                  )}
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

          {/* Disable Account Prompt Modal */}
          {showDisablePrompt && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <div className="bg-[#0b1120] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 text-red-500 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-xl">
                      <ShieldOff className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Disable Student</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    Are you sure you want to disable <strong>{showDisablePrompt.name}</strong>? They will lose access to all dashboards immediately.
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Reason (Optional)</label>
                    <textarea
                      value={disableReason}
                      onChange={e => setDisableReason(e.target.value)}
                      placeholder="e.g., Code of conduct violation, Payment issue..."
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 min-h-[100px] resize-none"
                    />
                    <p className="text-[10px] text-gray-500">The student will see this message when they try to log in.</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowDisablePrompt(null)} className="flex-1 py-2.5 bg-transparent border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-xl font-bold transition-colors">
                      Cancel
                    </button>
                    <button onClick={submitDisableStudent} disabled={saving} className="flex-1 py-2.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50">
                      {saving ? 'Disabling...' : 'Disable Student'}
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
