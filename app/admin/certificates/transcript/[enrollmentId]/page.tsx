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
    primaryColor: "#e31e24",
    headerLogo: "/cadd-logo.png",
    watermarkLogo: "/cadd-logo.png",
    titleText: "Official Academic Transcript",
    subtitleText: "CADD Centre Lanka",
    signature1Name: "Academic Director",
    signature1Title: "CADD Centre Lanka",
    signature1Image: "",
    signature2Name: "Center Head",
    signature2Title: "CADD Centre Lanka",
    signature2Image: "",
  })

  // Data Override State
  const [dataOverrides, setDataOverrides] = useState({
    studentName: "Loading...",
    studentId: "Loading...",
    nic: "N/A",
    courseTitle: "Loading...",
    courseLevel: "Loading...",
    batchId: "N/A",
    status: "Completed",
    dateIssued: new Date().toLocaleDateString('en-GB'),
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
        setDataOverrides(prev => ({
          ...prev,
          studentName: student?.full_name || "Unknown",
          studentId: student?.student_id || "Unknown",
          nic: student?.nic || "N/A",
          courseTitle: enrollment.courses?.title || "Unknown",
          courseLevel: enrollment.courses?.level || "Unknown",
          batchId: enrollment.batches?.batch_code || enrollment.batches?.name || "N/A",
          status: enrollment.status?.toUpperCase() || "COMPLETED"
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row print:block font-sans">
      
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
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Student ID</label><input type="text" value={dataOverrides.studentId} onChange={e => setDataOverrides(p => ({ ...p, studentId: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">NIC</label><input type="text" value={dataOverrides.nic} onChange={e => setDataOverrides(p => ({ ...p, nic: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label><input type="text" value={dataOverrides.courseTitle} onChange={e => setDataOverrides(p => ({ ...p, courseTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Level</label><input type="text" value={dataOverrides.courseLevel} onChange={e => setDataOverrides(p => ({ ...p, courseLevel: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Batch</label><input type="text" value={dataOverrides.batchId} onChange={e => setDataOverrides(p => ({ ...p, batchId: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Date Issued</label><input type="text" value={dataOverrides.dateIssued} onChange={e => setDataOverrides(p => ({ ...p, dateIssued: e.target.value }))} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-blue-50 focus:bg-white" /></div>
          </div>

          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Styling</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" value={settings.primaryColor} onChange={e => setSettings(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                <input type="text" value={settings.primaryColor} onChange={e => setSettings(p => ({ ...p, primaryColor: e.target.value }))} className="flex-1 border rounded-lg px-3 text-sm uppercase font-mono" />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Text Content</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title Text</label>
              <input type="text" value={settings.titleText} onChange={e => setSettings(p => ({ ...p, titleText: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle Text</label>
              <input type="text" value={settings.subtitleText} onChange={e => setSettings(p => ({ ...p, subtitleText: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-4 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Logos & Images</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Header Logo</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'headerLogo')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Watermark Image</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'watermarkLogo')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>
          </div>

          <div className="space-y-4 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Signatures</h3>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase">Left Signature</p>
              <input type="text" value={settings.signature1Name} onChange={e => setSettings(p => ({ ...p, signature1Name: e.target.value }))} placeholder="Name" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="text" value={settings.signature1Title} onChange={e => setSettings(p => ({ ...p, signature1Title: e.target.value }))} placeholder="Title" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'signature1Image')} className="text-[10px] w-full" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase">Right Signature</p>
              <input type="text" value={settings.signature2Name} onChange={e => setSettings(p => ({ ...p, signature2Name: e.target.value }))} placeholder="Name" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="text" value={settings.signature2Title} onChange={e => setSettings(p => ({ ...p, signature2Title: e.target.value }))} placeholder="Title" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'signature2Image')} className="text-[10px] w-full" />
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
      <div className="flex-1 overflow-y-auto py-10 px-4 print:p-0 print:overflow-visible">
        <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none relative overflow-hidden">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
            {settings.watermarkLogo && <img src={settings.watermarkLogo} alt="Watermark" className="w-[120%] h-auto grayscale transform -rotate-12" />}
          </div>

          <div className="relative z-10 p-12">
            {/* Header */}
            <div className="flex justify-between items-start border-b-[3px] pb-8 mb-8" style={{ borderColor: settings.primaryColor }}>
              <div>
                {settings.headerLogo && <img src={settings.headerLogo} alt="Logo" className="h-16 mb-4 object-contain" />}
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{settings.titleText}</h1>
                <p className="font-medium" style={{ color: settings.primaryColor }}>{settings.subtitleText}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Date Issued</p>
                <p className="text-gray-900 font-bold mb-4">{dataOverrides.dateIssued}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">Verified Document</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Student Information</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium w-1/3">Full Name</td><td className="py-2 font-bold text-gray-900">{dataOverrides.studentName}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium">Student ID</td><td className="py-2 font-bold text-gray-900">{dataOverrides.studentId}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium">NIC / Passport</td><td className="py-2 font-bold text-gray-900">{dataOverrides.nic}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Program Information</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium w-1/3">Course</td><td className="py-2 font-bold text-gray-900">{dataOverrides.courseTitle}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium">Level</td><td className="py-2 font-bold text-gray-900">{dataOverrides.courseLevel}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium">Batch</td><td className="py-2 font-bold text-gray-900">{dataOverrides.batchId}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 font-medium">Status</td><td className="py-2 font-bold text-emerald-600 uppercase">{dataOverrides.status}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Academic Record */}
            <div className="mb-12">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Academic Record</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left font-bold text-gray-700 w-1/2 rounded-tl-lg">Module</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-700">Duration (Hrs)</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-700">Marks</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-700 rounded-tr-lg">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modulesData.map((mod: any, index: number) => (
                    <tr key={mod.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{mod.title}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{mod.duration_hours}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {mod.hasAssessments ? `${mod.marksObtained} / ${mod.marksPossible}` : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: settings.primaryColor }}>{mod.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Results summary */}
            <div className="flex justify-end mb-16">
              <div className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Final Summary</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Total Cumulative Marks:</span>
                  <span className="font-mono font-bold text-gray-900">{totalMarks} / {totalPossible}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">Overall Percentage:</span>
                  <span className="font-bold text-gray-900">{finalPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-gray-900 font-bold text-lg">Final Classification:</span>
                  <span className="font-black text-2xl uppercase" style={{ color: settings.primaryColor }}>{finalGrade}</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="grid grid-cols-2 gap-20 mt-24">
              <div className="flex flex-col items-center justify-end">
                {settings.signature1Image && <img src={settings.signature1Image} alt="Signature 1" className="h-16 mb-2 object-contain" />}
                <div className="w-full border-t border-gray-300 pt-2 text-center">
                  <p className="font-bold text-gray-900 text-sm">{settings.signature1Name}</p>
                  <p className="text-xs text-gray-500 mt-1">{settings.signature1Title}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-end">
                {settings.signature2Image && <img src={settings.signature2Image} alt="Signature 2" className="h-16 mb-2 object-contain" />}
                <div className="w-full border-t border-gray-300 pt-2 text-center">
                  <p className="font-bold text-gray-900 text-sm">{settings.signature2Name}</p>
                  <p className="text-xs text-gray-500 mt-1">{settings.signature2Title}</p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center text-[10px] text-gray-400 uppercase tracking-widest">
              <p>This is a system generated document and does not require a physical signature for verification.</p>
              <p className="mt-1">Verify at caddcentre.lk/verify</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
