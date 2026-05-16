"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Plus, FileText, Award, ClipboardCheck, ChevronDown, ChevronRight, X } from "lucide-react"
import { createAssessment, updateAssessment } from "@/lib/data"

interface AssessmentPanelProps {
  modules: any[]
  enrollments: any[] // enrollments for this batch
  assessments: any[]
  onRefresh: () => void
}

export default function AssessmentPanel({ modules, enrollments, assessments, onRefresh }: AssessmentPanelProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null) // module_id
  const [showGradeModal, setShowGradeModal] = useState<any>(null) // assessment
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', type: 'module_test', total_marks: '100', conducted_at: '' })
  const [grades, setGrades] = useState<Record<string, { marks: string; grade: string }>>({})

  const typeIcon = (type: string) => {
    if (type === 'practical') return <ClipboardCheck className="w-4 h-4 text-purple-500" />
    if (type === 'final_project') return <Award className="w-4 h-4 text-amber-500" />
    return <FileText className="w-4 h-4 text-blue-500" />
  }

  const typeLabel = (type: string) => {
    if (type === 'practical') return 'Practical'
    if (type === 'final_project') return 'Final Project'
    return 'Exam'
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showCreateModal || !createForm.title) return
    setCreating(true)
    try {
      // Create one assessment record per enrolled student
      const promises = enrollments.map(enr =>
        createAssessment({
          enrollment_id: enr.id,
          module_id: showCreateModal,
          type: createForm.type,
          title: createForm.title,
          total_marks: parseFloat(createForm.total_marks) || 100,
          conducted_at: createForm.conducted_at || new Date().toISOString(),
        })
      )
      await Promise.all(promises)
      toast.success(`"${createForm.title}" published for ${enrollments.length} students`)
      setShowCreateModal(null)
      setCreateForm({ title: '', type: 'module_test', total_marks: '100', conducted_at: '' })
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assessment')
    } finally {
      setCreating(false)
    }
  }

  const openGrading = (assessment: any) => {
    // Find all assessments with the same title + module for this batch
    const related = assessments.filter(a => a.title === assessment.title && a.module_id === assessment.module_id)
    setShowGradeModal({ title: assessment.title, module_id: assessment.module_id, items: related })
    const g: Record<string, { marks: string; grade: string }> = {}
    related.forEach(a => {
      g[a.id] = { marks: a.marks_obtained?.toString() || '', grade: a.grade || '' }
    })
    setGrades(g)
  }

  const saveGrades = async () => {
    setCreating(true)
    try {
      const promises = Object.entries(grades).map(([id, { marks, grade }]) =>
        updateAssessment(id, {
          marks_obtained: parseFloat(marks) || 0,
          grade: grade || undefined,
        })
      )
      await Promise.all(promises)
      toast.success('Grades saved!')
      setShowGradeModal(null)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  // Auto-calculate grade based on percentage
  const calcGrade = (marks: number, total: number): string => {
    const pct = (marks / total) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 40) return 'D'
    return 'F'
  }

  return (
    <div className="space-y-3">
      {modules.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500">No modules found for this course.</p>
          <p className="text-xs text-gray-400 mt-1">Add modules from the Admin → Courses section first.</p>
        </div>
      ) : modules.map(mod => {
        const modAssessments = assessments.filter(a => a.module_id === mod.id)
        // Group assessments by title (since there's one per student)
        const uniqueAssessments = Array.from(new Map(modAssessments.map(a => [a.title, a])).values())
        const isExpanded = expandedModule === mod.id

        return (
          <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Module header */}
            <button
              onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <div className="text-left">
                  <p className="font-bold text-gray-900">{mod.title}</p>
                  <p className="text-xs text-gray-400">{mod.duration_hours}h • {mod.topics?.length || 0} topics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uniqueAssessments.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">
                    {uniqueAssessments.length} assessment{uniqueAssessments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/50">
                {/* Topics */}
                {mod.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mod.topics.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-medium">{t}</span>
                    ))}
                  </div>
                )}

                {/* Assessments list */}
                {uniqueAssessments.length > 0 ? uniqueAssessments.map(a => {
                  const studentCount = modAssessments.filter(x => x.title === a.title).length
                  const gradedCount = modAssessments.filter(x => x.title === a.title && x.marks_obtained != null).length
                  return (
                    <div key={a.id} className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {typeIcon(a.type)}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                          <p className="text-[11px] text-gray-400">
                            {typeLabel(a.type)} • {a.total_marks} marks • {gradedCount}/{studentCount} graded
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openGrading(a)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Grade
                      </button>
                    </div>
                  )
                }) : (
                  <p className="text-xs text-gray-400 italic">No assessments yet for this module.</p>
                )}

                {/* Add assessment button */}
                <button
                  onClick={() => setShowCreateModal(mod.id)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Assignment / Exam
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* CREATE ASSESSMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Assessment</h3>
                <p className="text-xs text-gray-500">{modules.find(m => m.id === showCreateModal)?.title}</p>
              </div>
              <button onClick={() => setShowCreateModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Mid-Module Exam, Assignment 1"
                  className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={createForm.type}
                    onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-gray-50"
                  >
                    <option value="module_test">Exam / Test</option>
                    <option value="practical">Practical / Assignment</option>
                    <option value="final_project">Final Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.total_marks}
                    onChange={e => setCreateForm({ ...createForm, total_marks: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={createForm.conducted_at}
                  onChange={e => setCreateForm({ ...createForm, conducted_at: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl bg-gray-50"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>Note:</strong> This will create the assessment for all <strong>{enrollments.length}</strong> enrolled student{enrollments.length !== 1 ? 's' : ''} in this batch.
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {creating ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Grade: {showGradeModal.title}</h3>
                <p className="text-xs text-gray-500">{showGradeModal.items.length} students</p>
              </div>
              <button onClick={() => setShowGradeModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {showGradeModal.items.map((a: any) => {
                const enrollment = enrollments.find(e => e.id === a.enrollment_id)
                const studentName = enrollment?.students?.full_name || 'Unknown'
                const g = grades[a.id] || { marks: '', grade: '' }
                return (
                  <div key={a.id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className="w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-cyan-700 font-bold text-sm border border-cyan-100 shrink-0">
                      {studentName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{studentName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{enrollment?.students?.student_id || 'N/A'}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={a.total_marks}
                      placeholder="Marks"
                      value={g.marks}
                      onChange={e => {
                        const marks = e.target.value
                        const grade = marks ? calcGrade(parseFloat(marks), a.total_marks) : ''
                        setGrades(prev => ({ ...prev, [a.id]: { marks, grade } }))
                      }}
                      className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-400">/ {a.total_marks}</span>
                    <span className={`w-8 text-center font-bold text-xs ${
                      g.grade === 'F' ? 'text-red-600' :
                      g.grade.startsWith('A') ? 'text-emerald-600' :
                      g.grade.startsWith('B') ? 'text-blue-600' : 'text-amber-600'
                    }`}>{g.grade || '-'}</span>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowGradeModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
              <button onClick={saveGrades} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Saving...' : 'Save Grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
