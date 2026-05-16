"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Printer, Image as ImageIcon, Settings, Type, Palette, Award, Database } from "lucide-react"

export default function CertificatePage() {
  const params = useParams()
  const enrollmentId = params.enrollmentId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Template Customization State
  const [settings, setSettings] = useState({
    primaryColor: "#e31e24",
    headerLogo: "/cadd-logo.png",
    watermarkLogo: "/cadd-logo.png",
    certificateTitle: "Certificate of Completion",
    subtitleText: "This is to certify that",
    bodyText: "has successfully completed the course requirements for",
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
    courseTitle: "Loading...",
    dateIssued: new Date().toLocaleDateString('en-GB'),
  })

  useEffect(() => {
    async function fetchCertificateData() {
      try {
        const { data: enrollment, error: enrError } = await supabase
          .from("enrollments")
          .select(`*, courses (*)`)
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

        setDataOverrides(prev => ({
          ...prev,
          studentName: student?.full_name || "Unknown Student",
          courseTitle: enrollment.courses?.title || "Unknown Course"
        }))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (enrollmentId) fetchCertificateData()
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row print:block font-sans">
      
      {/* ── SETTINGS SIDEBAR (HIDDEN ON PRINT) ── */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto print:hidden shadow-lg z-10 shrink-0 h-screen sticky top-0 custom-scrollbar">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-600" /> Certificate Editor
        </h2>
        
        <div className="space-y-6">
          
          {/* Data Overrides */}
          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Edit Data</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Student Name</label>
              <input type="text" value={dataOverrides.studentName} onChange={e => setDataOverrides(p => ({ ...p, studentName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Course Title</label>
              <input type="text" value={dataOverrides.courseTitle} onChange={e => setDataOverrides(p => ({ ...p, courseTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date Issued</label>
              <input type="text" value={dataOverrides.dateIssued} onChange={e => setDataOverrides(p => ({ ...p, dateIssued: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Certificate Title</label>
              <input type="text" value={settings.certificateTitle} onChange={e => setSettings(p => ({ ...p, certificateTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
              <input type="text" value={settings.subtitleText} onChange={e => setSettings(p => ({ ...p, subtitleText: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Body Text</label>
              <textarea value={settings.bodyText} onChange={e => setSettings(p => ({ ...p, bodyText: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm h-20" />
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
            <Printer className="w-5 h-5" /> Print Certificate
          </button>
        </div>
      </div>

      {/* ── PRINT AREA (LANDSCAPE CERTIFICATE) ── */}
      <div className="flex-1 overflow-y-auto py-10 px-4 print:p-0 print:overflow-visible flex items-center justify-center bg-gray-200 print:bg-white min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4 landscape; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
        
        <div className="w-[297mm] h-[210mm] bg-white shadow-2xl print:shadow-none relative overflow-hidden flex flex-col justify-center items-center border-[15px] p-12 shrink-0" style={{ borderColor: settings.primaryColor }}>
          
          {/* Inner Border */}
          <div className="absolute inset-4 border-[2px] border-gray-300 pointer-events-none" />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
            {settings.watermarkLogo && <img src={settings.watermarkLogo} alt="Watermark" className="w-[70%] h-auto grayscale" />}
          </div>

          <div className="relative z-10 w-full flex flex-col items-center text-center">
            
            {/* Header Logo */}
            {settings.headerLogo && (
              <img src={settings.headerLogo} alt="Logo" className="h-20 mb-6 object-contain" />
            )}

            {/* Title */}
            <h1 className="text-5xl font-black text-gray-900 tracking-tight uppercase mb-6" style={{ fontFamily: "serif", color: settings.primaryColor }}>
              {settings.certificateTitle}
            </h1>
            
            <p className="text-lg italic text-gray-600 mb-6" style={{ fontFamily: "serif" }}>
              {settings.subtitleText}
            </p>

            {/* Student Name */}
            <div className="w-3/4 border-b-2 border-gray-300 pb-2 mb-6">
              <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Great Vibes', cursive, serif" }}>
                {dataOverrides.studentName}
              </h2>
            </div>

            {/* Body */}
            <p className="text-lg text-gray-600 mb-4 max-w-2xl leading-relaxed">
              {settings.bodyText}
            </p>

            {/* Course Title */}
            <h3 className="text-2xl font-black text-gray-900 mb-12 uppercase tracking-wide">
              {dataOverrides.courseTitle}
            </h3>

            {/* Footer Signatures */}
            <div className="w-full flex justify-between items-end px-16 mt-8">
              
              <div className="flex flex-col items-center justify-end w-64">
                <div className="h-20 flex items-end justify-center mb-2">
                  {settings.signature1Image && <img src={settings.signature1Image} alt="Signature 1" className="max-h-full object-contain" />}
                </div>
                <div className="w-full border-t-2 border-gray-400 pt-2 text-center">
                  <p className="font-bold text-gray-900">{settings.signature1Name}</p>
                  <p className="text-sm text-gray-500 mt-1">{settings.signature1Title}</p>
                </div>
              </div>

              {/* Award Icon Center */}
              <div className="flex flex-col items-center pb-4">
                <Award className="w-16 h-16 opacity-20" style={{ color: settings.primaryColor }} />
                <p className="text-xs font-bold text-gray-400 mt-2 tracking-widest">{dataOverrides.dateIssued}</p>
              </div>
              
              <div className="flex flex-col items-center justify-end w-64">
                <div className="h-20 flex items-end justify-center mb-2">
                  {settings.signature2Image && <img src={settings.signature2Image} alt="Signature 2" className="max-h-full object-contain" />}
                </div>
                <div className="w-full border-t-2 border-gray-400 pt-2 text-center">
                  <p className="font-bold text-gray-900">{settings.signature2Name}</p>
                  <p className="text-sm text-gray-500 mt-1">{settings.signature2Title}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
