"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CheckCircle, Users, X, Clock, CreditCard, ArrowRight,
  GraduationCap, CalendarDays, UserPlus, AlertCircle, Mail, Lock, Key
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import {
  getLeadConfirmations, confirmLeadAsStudent,
  generateStudentId, getNextStudentSequence,
  confirmLeadPayment
} from "@/lib/ims-data"
import { getBatches, getCourses } from "@/lib/data"
import type { LeadConfirmation } from "@/types"

interface AcademicLeadConfirmationsViewProps {
  currentUser: any
  onRefresh?: () => void
}

export default function AcademicLeadConfirmationsView({ currentUser, onRefresh }: AcademicLeadConfirmationsViewProps) {
  const [confirmations, setConfirmations] = useState<LeadConfirmation[]>([])
  const [loading, setLoading] = useState(true)

  // Allocation modal
  const [showModal, setShowModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadConfirmation | null>(null)
  const [allocating, setAllocating] = useState(false)

  // Step tracking: 1 = generate email, 2 = allocate batch
  const [step, setStep] = useState<1 | 2>(1)
  const [academicEmail, setAcademicEmail] = useState("")
  const [academicPassword, setAcademicPassword] = useState("")
  const [emailGenerated, setEmailGenerated] = useState(false)

  // Batch/Course data
  const [batches, setBatches] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [generatedStudentId, setGeneratedStudentId] = useState("")

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, bat, cou] = await Promise.all([
        getLeadConfirmations('finance_confirmed'),
        getBatches(false),
        getCourses(true),
      ])
      setConfirmations(data)
      setBatches(bat)
      setCourses(cou)
    } catch (e: any) {
      toast.error("Failed to load: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleOpenModal = async (row: LeadConfirmation) => {
    setSelectedLead(row)
    setSelectedBatchId("")
    setGeneratedStudentId("")
    setAcademicEmail("")
    setAcademicPassword("")
    setEmailGenerated(false)
    setStep(1)
    setShowModal(true)
  }

  // Step 1: When batch is selected, generate the FINAL student ID + academic credentials
  const handleBatchSelect = async (batchId: string) => {
    setSelectedBatchId(batchId)
    if (!batchId) {
      setGeneratedStudentId("")
      setAcademicEmail("")
      setAcademicPassword("")
      setEmailGenerated(false)
      return
    }
    try {
      const batch = batches.find((b: any) => b.id === batchId)
      const batchCode = batch?.name?.split(' - ').pop() || batch?.name || 'GEN'
      const seq = await getNextStudentSequence(batchCode)
      const studentId = generateStudentId(batchCode, seq)
      // Academic email and password are based on the FINAL student ID
      setGeneratedStudentId(studentId)
      setAcademicEmail(`${studentId.toLowerCase()}@caddcentre.lk`)
      setAcademicPassword(studentId)
      setEmailGenerated(true)
    } catch {
      setGeneratedStudentId("")
      setAcademicEmail("")
      setAcademicPassword("")
      setEmailGenerated(false)
    }
  }

  // Move to step 2 (confirm credentials)
  const handleProceedToConfirm = () => {
    if (!selectedBatchId || !emailGenerated) return toast.error("Please select a batch first")
    setStep(2)
  }


  const handleAllocateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return
    if (!emailGenerated) return toast.error("Please generate academic credentials first")
    if (!selectedBatchId) return toast.error("Please select a batch")

    setAllocating(true)
    try {
      const batch = batches.find((b: any) => b.id === selectedBatchId)
      const batchCode = batch?.name?.split(' - ').pop() || batch?.name || 'GEN'
      const seq = await getNextStudentSequence(batchCode)
      const studentId = generateStudentId(batchCode, seq)
      const finalEmail = `${studentId.toLowerCase()}@caddcentre.lk`
      const finalPassword = studentId

      const batchCourseId = batch?.course_id || batch?.courses?.id
      const courseByName = courses.find((c: any) =>
        c.title?.toLowerCase().includes(selectedLead.course_interested?.toLowerCase()) ||
        selectedLead.course_interested?.toLowerCase().includes(c.title?.toLowerCase())
      )
      const resolvedCourseId = batchCourseId || courseByName?.id || courses[0]?.id || null

      await confirmLeadPayment({
        paymentId: selectedLead.id,
        leadId: selectedLead.lead_id,
        studentName: selectedLead.lead_name,
        email: selectedLead.email,
        phone: selectedLead.contact,
        nic: null,
        dob: null,
        courseName: selectedLead.course_interested || '',
        courseId: resolvedCourseId,
        batchCode: batchCode,
        batchId: selectedBatchId,
        confirmedBy: currentUser?.id || null,
        academicEmail: finalEmail,
        academicPassword: finalPassword,
      })

      await confirmLeadAsStudent(
        selectedLead.id,
        currentUser?.id || null,
        selectedBatchId,
        studentId
      )

      toast.success(
        `${selectedLead.lead_name} enrolled as student ${studentId}!`,
        { description: `Academic Email: ${finalEmail}` }
      )

      setShowModal(false)
      setSelectedLead(null)
      setSelectedBatchId("")
      setGeneratedStudentId("")
      loadData()
      if (onRefresh) onRefresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAllocating(false)
    }
  }

  const getRelevantBatches = () => {
    if (!selectedLead) return batches
    const courseKeyword = selectedLead.course_interested?.toLowerCase() || ''
    const relevant = batches.filter((b: any) => {
      const batchName = (b.name || '').toLowerCase()
      const courseName = (b.courses?.title || '').toLowerCase()
      return batchName.includes(courseKeyword) || courseName.includes(courseKeyword)
    })
    return relevant.length > 0
      ? [...relevant, ...batches.filter((b: any) => !relevant.includes(b))]
      : batches
  }

  const columns: CDMColumn<LeadConfirmation>[] = [
    {
      key: "lead_name", label: "Student Name",
      render: (val, row) => (
        <div>
          <p className="font-bold text-gray-900">{val}</p>
          <p className="text-xs text-gray-400">{row.email || row.contact || 'No contact'}</p>
        </div>
      )
    },
    {
      key: "course_interested", label: "Course",
      render: (val) => <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">{val}</span>
    },
    {
      key: "payment_amount", label: "Paid Amount",
      render: (val) => <span className="font-bold text-emerald-700">LKR {Number(val || 0).toLocaleString()}</span>
    },
    {
      key: "finance_confirmed_at", label: "Finance Verified",
      render: (val) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </div>
      )
    },
    {
      key: "stage", label: "Status",
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
          <GraduationCap className="w-3 h-3" /> Ready to Enroll
        </span>
      )
    },
  ]

  const actions: CDMAction<LeadConfirmation>[] = [
    { label: "Enroll Student", icon: UserPlus, variant: "success", onClick: (row) => handleOpenModal(row) },
  ]

  return (
    <div className="space-y-4">
      {/* Pipeline Status Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            Student Batch Allocation
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Marketing Confirmed
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Finance Verified
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
            <Mail className="w-3 h-3" /> Generate Email
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 ring-2 ring-blue-300/50">
            <GraduationCap className="w-3 h-3" /> Batch Allocation
          </div>
        </div>
      </div>

      <CDMDataTable data={confirmations} columns={columns} actions={actions} loading={loading}
        title="Ready for Enrollment" icon={Users} searchPlaceholder="Search by name, course..."
        exportFileName="Lead_Enrollments" emptyMessage="No leads awaiting batch allocation" emptyIcon={CheckCircle} />

      {/* ENROLLMENT MODAL — 2-step flow */}
      <AnimatePresence>
        {showModal && selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-cyan-50 flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {step === 1 ? <><GraduationCap className="w-5 h-5 text-blue-600" /> Step 1: Select Batch</> : <><Mail className="w-5 h-5 text-purple-600" /> Step 2: Confirm Credentials & Enroll</>}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step === 1 ? 'Select a batch to generate the final student ID and academic credentials' : 'Review credentials and confirm enrollment'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={step === 2 ? handleAllocateStudent : (e) => { e.preventDefault(); handleProceedToConfirm() }} className="p-6 space-y-5">
                {/* Student Summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Student Name:</span>
                    <span className="font-bold text-gray-900">{selectedLead.lead_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Personal Email:</span>
                    <span className="font-medium text-gray-700">{selectedLead.email || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Course:</span>
                    <span className="font-bold text-blue-700">{selectedLead.course_interested}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Verified Payment:</span>
                    <span className="font-bold text-emerald-700">LKR {Number(selectedLead.payment_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Step 1: Select Batch + Credential Preview */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Batch *</label>
                      <select required value={selectedBatchId} onChange={e => handleBatchSelect(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                        <option value="">-- Select a Batch --</option>
                        {getRelevantBatches().map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name} {b.courses?.title ? `(${b.courses.title})` : ''}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Batches matching &quot;{selectedLead.course_interested}&quot; are shown first.</p>
                    </div>

                    {/* Credential Preview — appears after batch selection */}
                    {emailGenerated && generatedStudentId && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Final Student ID</p>
                            <p className="text-xl font-black text-blue-800 font-mono tracking-wider">{generatedStudentId}</p>
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-purple-800 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Academic Credentials (auto-generated)</p>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-purple-100">
                            <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-600 font-bold uppercase">Email</p>
                              <p className="font-mono font-bold text-purple-900">{academicEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-purple-100">
                            <Lock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-600 font-bold uppercase">Default Password</p>
                              <p className="font-mono font-bold text-purple-900">{academicPassword}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-2 flex gap-3 border-t border-gray-100">
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                      <button type="submit" disabled={!selectedBatchId || !emailGenerated}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <ArrowRight className="w-4 h-4" /> Proceed to Confirm
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirm & Enroll */}
                {step === 2 && (
                  <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-800">Confirm Enrollment Details</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between bg-white rounded-lg p-2.5 border border-emerald-100">
                          <span className="text-gray-500">Student ID:</span>
                          <span className="font-mono font-bold text-emerald-900">{generatedStudentId}</span>
                        </div>
                        <div className="flex justify-between bg-white rounded-lg p-2.5 border border-emerald-100">
                          <span className="text-gray-500">Academic Email:</span>
                          <span className="font-mono font-bold text-emerald-900">{academicEmail}</span>
                        </div>
                        <div className="flex justify-between bg-white rounded-lg p-2.5 border border-emerald-100">
                          <span className="text-gray-500">Default Password:</span>
                          <span className="font-mono font-bold text-emerald-900">{academicPassword}</span>
                        </div>
                        <div className="flex justify-between bg-white rounded-lg p-2.5 border border-emerald-100">
                          <span className="text-gray-500">Batch:</span>
                          <span className="font-bold text-gray-900">{batches.find(b => b.id === selectedBatchId)?.name || '—'}</span>
                        </div>
                      </div>
                    </motion.div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">This action will create a student profile, enrollment record, and store the academic credentials. This cannot be undone.</p>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-gray-100">
                      <button type="button" onClick={() => setStep(1)} className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">← Back</button>
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                      <button type="submit" disabled={allocating || !selectedBatchId || !emailGenerated}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {allocating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Confirm & Enroll</>}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
