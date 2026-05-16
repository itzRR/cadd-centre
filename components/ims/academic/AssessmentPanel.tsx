"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Plus, FileText, Award, ClipboardCheck, ChevronDown, ChevronRight, X, Calendar, Edit3 } from "lucide-react"
import { createAssessment, updateAssessment } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

interface AssessmentPanelProps {
  modules: any[]
  enrollments: any[] // enrollments for this batch
  assessments: any[]
  onRefresh: () => void
}

export default function AssessmentPanel({ modules, enrollments, assessments, onRefresh }: AssessmentPanelProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null) // module_id
  const [showGradeModal, setShowGradeModal] = useState<any>(null) // assessment group
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', type: 'module_test', total_marks: '100', conducted_at: '', notes: '' })
  const [grades, setGrades] = useState<Record<string, { marks: string; grade: string }>>({})

  const typeIcon = (type: string) => {
    if (type === 'practical') return <ClipboardCheck className="w-5 h-5 text-purple-600" />
    if (type === 'final_project') return <Award className="w-5 h-5 text-amber-600" />
    return <FileText className="w-5 h-5 text-blue-600" />
  }

  const typeLabel = (type: string) => {
    if (type === 'practical') return 'Practical'
    if (type === 'final_project') return 'Final Project'
    return 'Exam / Test'
  }

  const getStatusBadge = (studentCount: number, gradedCount: number) => {
    if (studentCount === 0) return <Badge className="bg-gray-100 text-gray-600 border-none">Draft</Badge>
    if (gradedCount === 0) return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Published</Badge>
    if (gradedCount < studentCount) return <Badge className="bg-amber-50 text-amber-600 border-amber-200">Partially Graded</Badge>
    return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">Fully Graded</Badge>
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
          notes: createForm.notes
        })
      )
      await Promise.all(promises)
      toast.success(`"${createForm.title}" published for ${enrollments.length} students`)
      setShowCreateModal(null)
      setCreateForm({ title: '', type: 'module_test', total_marks: '100', conducted_at: '', notes: '' })
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assessment')
    } finally {
      setCreating(false)
    }
  }

  const openGrading = (assessmentGroup: any) => {
    // Find all assessments with the same title + module for this batch
    const related = assessments.filter(a => a.title === assessmentGroup.title && a.module_id === assessmentGroup.module_id)
    
    // Create items for ALL enrolled students
    const items = enrollments.map(enr => {
      const existing = related.find(a => a.enrollment_id === enr.id)
      return {
        enrollment_id: enr.id,
        assessment_id: existing?.id || null,
        title: assessmentGroup.title,
        module_id: assessmentGroup.module_id,
        type: assessmentGroup.type,
        total_marks: assessmentGroup.total_marks,
        conducted_at: assessmentGroup.conducted_at,
        notes: assessmentGroup.notes
      }
    })

    setShowGradeModal({ title: assessmentGroup.title, module_id: assessmentGroup.module_id, total_marks: assessmentGroup.total_marks, items })
    
    const g: Record<string, { marks: string; grade: string }> = {}
    items.forEach(item => {
      const existing = related.find(a => a.enrollment_id === item.enrollment_id)
      g[item.enrollment_id] = { 
        marks: existing?.marks_obtained?.toString() || '', 
        grade: existing?.grade || ''
      }
    })
    setGrades(g)
  }

  const saveGrades = async () => {
    setCreating(true)
    try {
      const promises = showGradeModal.items.map((item: any) => {
        const { marks, grade } = grades[item.enrollment_id] || { marks: '', grade: '' }
        const parsedMarks = marks === '' ? null : parseFloat(marks)
        
        if (item.assessment_id) {
          // Update existing
          return updateAssessment(item.assessment_id, {
            marks_obtained: parsedMarks === null ? undefined : parsedMarks,
            grade: grade || undefined,
          })
        } else if (parsedMarks !== null || grade !== '') {
          // Create new for late-enrolled student
          return createAssessment({
            enrollment_id: item.enrollment_id,
            module_id: item.module_id,
            type: item.type,
            title: item.title,
            total_marks: item.total_marks,
            conducted_at: item.conducted_at,
            marks_obtained: parsedMarks === null ? undefined : parsedMarks,
            grade: grade || undefined,
            notes: item.notes
          })
        }
        return Promise.resolve()
      })
      await Promise.all(promises)
      toast.success('Grades saved securely!')
      setShowGradeModal(null)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleMarksChange = (enrollmentId: string, marksValue: string) => {
    const total = showGradeModal?.total_marks || 100
    const val = parseFloat(marksValue)
    let autoGrade = ''
    if (!isNaN(val) && val >= 0 && val <= total) {
      const pct = (val / total) * 100
      if (pct >= 85) autoGrade = 'Distinction'
      else if (pct >= 75) autoGrade = 'Merit'
      else if (pct >= 50) autoGrade = 'Pass'
      else autoGrade = 'Fail'
    }
    setGrades(prev => ({
      ...prev,
      [enrollmentId]: { marks: marksValue, grade: autoGrade }
    }))
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center shadow-sm">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-900 font-bold text-lg">No Modules Found</p>
          <p className="text-sm text-gray-500 mt-1">Please add modules from the Admin → Courses section first before managing assessments.</p>
        </div>
      ) : modules.map(mod => {
        const modAssessments = assessments.filter(a => a.module_id === mod.id)
        // Group assessments by title (one per student)
        const uniqueAssessments = Array.from(new Map(modAssessments.map(a => [a.title, a])).values())
        const isExpanded = expandedModule === mod.id

        return (
          <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:border-gray-200 transition-colors">
            {/* Module header */}
            <button
              onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-[#e31e24]/10 text-[#e31e24]' : 'bg-gray-100 text-gray-400'}`}>
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg leading-tight">{mod.title}</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{mod.duration_hours} Hours • {mod.topics?.length || 0} Topics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {uniqueAssessments.length > 0 && (
                  <Badge className="bg-[#e31e24]/10 text-[#e31e24] hover:bg-[#e31e24]/20 border-none font-bold">
                    {uniqueAssessments.length} Assessment{uniqueAssessments.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/30">
                {/* Topics */}
                {mod.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {mod.topics.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-lg font-semibold shadow-sm">{t}</span>
                    ))}
                  </div>
                )}

                {/* Assessments list */}
                <div className="space-y-3 mb-6">
                  {uniqueAssessments.length > 0 ? uniqueAssessments.map(a => {
                    const studentCount = enrollments.length // total enrolled students
                    const gradedCount = modAssessments.filter(x => x.title === a.title && x.marks_obtained != null).length
                    
                    return (
                      <div key={a.id} className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                            {typeIcon(a.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-gray-900 text-base">{a.title}</p>
                              {getStatusBadge(studentCount, gradedCount)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {a.conducted_at ? new Date(a.conducted_at).toLocaleDateString() : 'TBD'}</span>
                              <span>•</span>
                              <span>{typeLabel(a.type)}</span>
                              <span>•</span>
                              <span>{a.total_marks} Marks</span>
                            </div>
                            {a.notes && <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded-lg">"{a.notes}"</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => openGrading(a)}
                          className="px-4 py-2 bg-[#e31e24]/10 text-[#e31e24] text-sm font-bold rounded-xl hover:bg-[#e31e24] hover:text-white transition-all flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" /> Manage Grades
                        </button>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-sm font-medium text-gray-400">No assessments created for this module yet.</p>
                    </div>
                  )}
                </div>

                {/* Add assessment button */}
                <button
                  onClick={() => setShowCreateModal(mod.id)}
                  className="w-full py-4 border-2 border-dashed border-[#e31e24]/30 rounded-xl text-sm font-bold text-[#e31e24] hover:bg-[#e31e24]/5 hover:border-[#e31e24] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Create New Assessment
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* CREATE ASSESSMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900">New Assessment</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{modules.find(m => m.id === showCreateModal)?.title}</p>
              </div>
              <button onClick={() => setShowCreateModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Assessment Title</label>
                  <input
                    required
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all"
                    placeholder="e.g. Mid-Term Examination"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Assessment Type</label>
                    <select
                      value={createForm.type}
                      onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all bg-white"
                    >
                      <option value="module_test">Exam / Written Test</option>
                      <option value="practical">Practical Assignment</option>
                      <option value="final_project">Final Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total Marks (Weightage)</label>
                    <input
                      type="number"
                      required min="1"
                      value={createForm.total_marks}
                      onChange={e => setCreateForm({ ...createForm, total_marks: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Conducted Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.conducted_at.split('T')[0] || ''}
                    onChange={e => setCreateForm({ ...createForm, conducted_at: new Date(e.target.value).toISOString() })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description / Instructions (Optional)</label>
                  <textarea
                    rows={3}
                    value={createForm.notes}
                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full p-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all resize-none"
                    placeholder="Add any specific instructions or syllabus covered..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(null)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-[#e31e24] hover:bg-[#c2181d] rounded-xl transition-colors disabled:opacity-50 shadow-md">
                  {creating ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADE MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">Grading: {showGradeModal.title}</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Total Marks: {showGradeModal.total_marks}</p>
              </div>
              <button onClick={() => setShowGradeModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/3">Marks Obtained</th>
                      <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/4">Auto Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showGradeModal.items.map((item: any) => {
                      const st = enrollments.find(e => e.id === item.enrollment_id)?.students || { student_id: 'Unknown' }
                      const g = grades[item.enrollment_id] || { marks: '', grade: '' }
                      
                      return (
                        <tr key={item.enrollment_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-sm text-gray-900">{st.student_id}</td>
                          <td className="p-4">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min="0" max={item.total_marks} step="0.5"
                                value={g.marks}
                                onChange={(e) => handleMarksChange(item.enrollment_id, e.target.value)}
                                className="w-24 h-10 px-3 rounded-lg border border-gray-300 text-sm font-medium focus:outline-none focus:border-[#e31e24] focus:ring-1 focus:ring-[#e31e24] transition-all"
                                placeholder="--"
                              />
                              <span className="ml-2 text-xs font-bold text-gray-400">/ {item.total_marks}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {g.grade ? (
                              <Badge className={
                                g.grade === 'Distinction' ? 'bg-purple-100 text-purple-700 border-none' :
                                g.grade === 'Merit' ? 'bg-blue-100 text-blue-700 border-none' :
                                g.grade === 'Pass' ? 'bg-emerald-100 text-emerald-700 border-none' :
                                'bg-red-100 text-red-700 border-none'
                              }>
                                {g.grade}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Pending</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowGradeModal(null)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={saveGrades} disabled={creating} className="px-8 py-3 text-sm font-bold text-white bg-[#e31e24] hover:bg-[#c2181d] rounded-xl transition-colors shadow-md disabled:opacity-50">
                {creating ? 'Saving...' : 'Save All Grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
