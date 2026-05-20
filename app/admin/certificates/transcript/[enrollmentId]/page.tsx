"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Printer, ShieldCheck, Image as ImageIcon, Settings, Type, Palette, Database } from "lucide-react"

export default function TranscriptPage() {
  const params = useParams()
  const enrollmentId = params.enrollmentId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Template Customization State
  const [settings, setSettings] = useState({
    headerLogo: "/cadd-logo.png",
    softwareName: "AutoCAD",
    tvecRegNo: "TVECRegNo.P01/0445",
    transcriptId: "ID:0556",
    gradingScale: "Grading : 35 - 49 marks - S - Ordinary Pass | 50 - 64 marks - C - Credit Pass | 65 - 74 marks - B - Merit Pass | 75 and above - A - Distinction Pass"
  })

  // Data Override State
  const [dataOverrides, setDataOverrides] = useState({
    studentName: "Loading...",
    studentId: "Loading...",
    courseTitle: "Loading...",
    courseDuration: "0",
    finalGrade: "A",
  })
  
  // Module Data State
  const [modulesData, setModulesData] = useState<any[]>([])

  useEffect(() => {
    async function fetchTranscript() {
      try {
        const { data: enrollment, error: enrError } = await supabase
          .from("enrollments")
          .select(`*, courses (*), batches (*)`)
          .eq("id", enrollmentId)
          .single()

        if (enrError) throw enrError

        // Fetch student data separately
        const { data: student, error: stdError } = await supabase
          .from("students")
          .select("*")
          .eq("id", enrollment.user_id)
          .single()

        if (stdError) throw stdError

        // FIX: The table name is 'modules', not 'course_modules'
        const { data: modules, error: modError } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", enrollment.course_id)
          .order("order_index", { ascending: true })

        if (modError) throw modError

        const { data: assessments, error: assError } = await supabase
          .from("assessments")
          .select("*")
          .eq("enrollment_id", enrollmentId)

        if (assError) throw assError

        // Initialize Overrides
        const totalDuration = modules.reduce((sum: number, mod: any) => sum + (mod.duration_hours || 0), 0)
        
        setDataOverrides(prev => ({
          ...prev,
          studentName: student?.full_name || "Unknown",
          studentId: student?.student_id || "Unknown",
          courseTitle: enrollment.courses?.title || "Unknown",
          courseDuration: totalDuration.toString(),
        }))

        // Initialize Modules
        const processedModules = modules.map((mod: any) => {
          const modAssessments = assessments.filter((a: any) => a.module_id === mod.id && a.marks_obtained !== null)
          const marksObtained = modAssessments.reduce((sum: number, a: any) => sum + (a.marks_obtained || 0), 0)
          const marksPossible = modAssessments.reduce((sum: number, a: any) => sum + (a.total_marks || 0), 0)
          
          let grade = "N/A"
          if (marksPossible > 0) {
            const pct = (marksObtained / marksPossible) * 100
            if (pct >= 85) grade = "Distinction"
            else if (pct >= 75) grade = "Merit"
            else if (pct >= 50) grade = "Pass"
            else grade = "Fail"
          }
          return { ...mod, marksObtained, marksPossible, grade, hasAssessments: modAssessments.length > 0 }
        })
        setModulesData(processedModules)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (enrollmentId) fetchTranscript()
  }, [enrollmentId])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof settings) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, [key]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>

  let totalMarks = 0
  let totalPossible = 0
  modulesData.forEach(m => {
    if (m.marksPossible > 0) {
      totalMarks += m.marksObtained
      totalPossible += m.marksPossible
    }
  })

  let finalGrade = "Pending"
  let finalPct = 0
  if (totalPossible > 0) {
    finalPct = (totalMarks / totalPossible) * 100
    if (finalPct >= 85) finalGrade = "Distinction"
    else if (finalPct >= 75) finalGrade = "Merit"
    else if (finalPct >= 50) finalGrade = "Pass"
    else finalGrade = "Fail"
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row print:block print:bg-white font-sans">
      
      {/* ── SETTINGS SIDEBAR (HIDDEN ON PRINT) ── */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto print:hidden shadow-lg z-10 shrink-0 h-screen sticky top-0 custom-scrollbar">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-600" /> Template Editor
        </h2>
        
        <div className="space-y-6">

          {/* Data Overrides */}
          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Edit Data</h3>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Student Name</label><input type="text" value={dataOverrides.studentName} onChange={e => setDataOverrides(p => ({ ...p, studentName: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Student ID</label><input type="text" value={dataOverrides.studentId} onChange={e => setDataOverrides(p => ({ ...p, studentId: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Program / Course</label><input type="text" value={dataOverrides.courseTitle} onChange={e => setDataOverrides(p => ({ ...p, courseTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Course Duration (Hours)</label><input type="text" value={dataOverrides.courseDuration} onChange={e => setDataOverrides(p => ({ ...p, courseDuration: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Final Grade</label><input type="text" value={dataOverrides.finalGrade} onChange={e => setDataOverrides(p => ({ ...p, finalGrade: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
          </div>

          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Text Content</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name of Software/s</label>
              <input type="text" value={settings.softwareName} onChange={e => setSettings(p => ({ ...p, softwareName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Grading Scale Text</label>
              <textarea value={settings.gradingScale} onChange={e => setSettings(p => ({ ...p, gradingScale: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm h-20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">TVEC Registration No</label>
              <input type="text" value={settings.tvecRegNo} onChange={e => setSettings(p => ({ ...p, tvecRegNo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Transcript ID (Bottom Right)</label>
              <input type="text" value={settings.transcriptId} onChange={e => setSettings(p => ({ ...p, transcriptId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-red-600 font-bold" />
            </div>
          </div>

          <div className="space-y-4 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Logos & Images</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Header Logo (Top Right)</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'headerLogo')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#e31e24] text-white rounded-xl font-bold shadow-lg hover:bg-[#c2181d] transition-all">
            <Printer className="w-5 h-5" /> Print Transcript
          </button>
        </div>
      </div>

      {/* ── PRINT AREA ── */}
      <div className="flex-1 overflow-y-auto py-10 px-4 print:p-0 print:overflow-visible print:bg-white flex justify-center min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4 landscape; margin: 0; }
            /* Hide sidebar and all non-print UI */
            nav, header, aside, .print\\:hidden { display: none !important; }
            /* Reset all wrapper backgrounds */
            html, body, #__next, #__next > div { background: white !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
            /* Only force color-adjust on the transcript itself */
            .cert-print-area { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
        <div className="cert-print-area w-[297mm] h-[210mm] bg-white shadow-2xl print:shadow-none relative overflow-hidden flex border border-black shrink-0 font-sans">
          
          {/* Left Red Stripe */}
          <div className="w-[18px] h-full bg-[#e31e24] shrink-0"></div>

          {/* Main Content Area */}
          <div className="flex-1 p-12 flex flex-col justify-between">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-[44px] font-black text-black leading-none mb-6 font-sans">Transcript</h1>
                <div className="space-y-1 font-bold text-black text-[16px]">
                  <div className="flex"><span className="w-28">Program</span><span className="mr-2">:</span><span>{dataOverrides.courseTitle}</span></div>
                  <div className="flex"><span className="w-28">StudentName</span><span className="mr-2">:</span><span>{dataOverrides.studentName}</span></div>
                  <div className="flex"><span className="w-28">StudentID</span><span className="mr-2">:</span><span>{dataOverrides.studentId}</span></div>
                </div>
              </div>
              <div className="pt-2 pr-4">
                {settings.headerLogo && <img src={settings.headerLogo} alt="Logo" className="h-20 object-contain" />}
              </div>
            </div>

            {/* Middle Section: Training Content */}
            <div className="flex-1 mt-10">
              <div className="bg-[#e31e24] text-white py-1 px-4 text-[15px] font-bold inline-block mb-6 uppercase tracking-wide">
                Training content
              </div>
              
              <div className="grid grid-cols-3 gap-x-12 gap-y-3 text-[14px] text-black font-semibold pl-4">
                {modulesData.length > 0 ? modulesData.map((mod: any, index: number) => (
                  <div key={mod.id} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span className="leading-tight">{mod.title}</span>
                  </div>
                )) : (
                  <div className="text-gray-500 italic col-span-3">No modules found for this course.</div>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="mt-8 pt-8 border-t-[3px] border-black pb-2">
              <div className="space-y-1.5 text-[15px] text-black font-bold mb-10">
                <div className="flex"><span className="w-56">Name of Software/s</span><span className="mr-2">:</span><span>{settings.softwareName}</span></div>
                <div className="flex"><span className="w-56">Course Duration (in hours)</span><span className="mr-2">:</span><span>{dataOverrides.courseDuration}</span></div>
                <div className="flex"><span className="w-56">Final Grade</span><span className="mr-2">:</span><span>{dataOverrides.finalGrade}</span></div>
              </div>

              <div className="w-full text-center">
                 <p className="text-[12px] font-bold text-black">{settings.gradingScale}</p>
              </div>

              <div className="flex justify-between items-end mt-4 px-2">
                <div className="text-[13px] font-bold text-black">
                  {settings.tvecRegNo}
                </div>
                <div className="text-[13px] font-bold text-gray-500 font-mono tracking-wider">
                  {settings.transcriptId}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
