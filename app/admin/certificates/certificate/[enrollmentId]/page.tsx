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
    websiteText: "www.caddcentre.lk",
    leftBannerImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop", // placeholder architectural img
    cclLogo: "/cadd-logo.png",
    caddFooterLogo: "/cadd-logo.png",
    signatureImage: "",
    signatureName: "Ajith Ameresekera",
    signatureTitle: "Managing Director",
    signatureDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    franchiseText: "Master Franchise Holder for Sri Lanka",
    tvecRegNo: "TVECRegNo.P01/0445",
    certificateId: "ID:0556",
  })

  // Data Override State
  const [dataOverrides, setDataOverrides] = useState({
    certificateTitle: "CERTIFICATE IN AUTOCAD 2D AND 3D",
    inField: "AutoCAD",
    studentName: "Loading...",
    atField: "CADD Centre Lanka (Pvt) Ltd, Colombo, Sri Lanka",
    duringField: "Loading...",
    studentId: "Loading..."
  })

  useEffect(() => {
    async function fetchCertificateData() {
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

        let startDate = "Unknown"
        let endDate = "Unknown"
        if (enrollment.batches?.start_date) {
            startDate = new Date(enrollment.batches.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        }
        if (enrollment.batches?.end_date) {
            endDate = new Date(enrollment.batches.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        }

        setDataOverrides(prev => ({
          ...prev,
          certificateTitle: `CERTIFICATE IN ${enrollment.courses?.title?.toUpperCase() || "UNKNOWN"}`,
          inField: enrollment.courses?.title || "Unknown Course",
          studentName: student?.full_name || "Unknown Student",
          studentId: student?.student_id || "Unknown",
          duringField: `${startDate} To ${endDate}`
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row print:block print:bg-white font-sans">
      
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input type="text" value={dataOverrides.certificateTitle} onChange={e => setDataOverrides(p => ({ ...p, certificateTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">IN (Course Name)</label>
              <input type="text" value={dataOverrides.inField} onChange={e => setDataOverrides(p => ({ ...p, inField: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">AWARDED TO (Student Name)</label>
              <input type="text" value={dataOverrides.studentName} onChange={e => setDataOverrides(p => ({ ...p, studentName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">AT (Location)</label>
              <input type="text" value={dataOverrides.atField} onChange={e => setDataOverrides(p => ({ ...p, atField: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">DURING (Dates)</label>
              <input type="text" value={dataOverrides.duringField} onChange={e => setDataOverrides(p => ({ ...p, duringField: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">STUDENT ID</label>
              <input type="text" value={dataOverrides.studentId} onChange={e => setDataOverrides(p => ({ ...p, studentId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50 focus:bg-white" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-3 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Text Content</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Website (Top Left)</label>
              <input type="text" value={settings.websiteText} onChange={e => setSettings(p => ({ ...p, websiteText: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">TVEC Registration No</label>
              <input type="text" value={settings.tvecRegNo} onChange={e => setSettings(p => ({ ...p, tvecRegNo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Certificate ID (Bottom Right)</label>
              <input type="text" value={settings.certificateId} onChange={e => setSettings(p => ({ ...p, certificateId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-red-600 font-bold" />
            </div>
          </div>

          <div className="space-y-4 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Images</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Left Sidebar Banner</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'leftBannerImage')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Left Bottom Logo (CCL)</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'cclLogo')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Center Footer Logo (CADD)</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'caddFooterLogo')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>
          </div>

          <div className="space-y-4 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Signature Block</h3>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
              <input type="text" value={settings.signatureName} onChange={e => setSettings(p => ({ ...p, signatureName: e.target.value }))} placeholder="Name" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="text" value={settings.signatureTitle} onChange={e => setSettings(p => ({ ...p, signatureTitle: e.target.value }))} placeholder="Title" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="text" value={settings.signatureDate} onChange={e => setSettings(p => ({ ...p, signatureDate: e.target.value }))} placeholder="Date" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <input type="text" value={settings.franchiseText} onChange={e => setSettings(p => ({ ...p, franchiseText: e.target.value }))} placeholder="Franchise Info" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Signature Image</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'signatureImage')} className="text-xs w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
              </div>
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
          @import url('https://fonts.googleapis.com/css2?family=Jura:wght@700&family=Teko:wght@500;600&display=swap');
          @media print {
            @page { size: A4 landscape; margin: 0; }
            /* Hide sidebar and all non-print UI */
            nav, header, aside, .print\\:hidden { display: none !important; }
            /* Reset all wrapper backgrounds */
            html, body, #__next, #__next > div { background: white !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
            /* Only force color-adjust on the certificate itself */
            .cert-print-area { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .starburst-seal {
            clip-path: polygon(50% 0%, 61% 7%, 74% 2%, 81% 15%, 95% 15%, 95% 29%, 100% 41%, 92% 52%, 98% 66%, 86% 75%, 88% 90%, 75% 92%, 69% 100%, 55% 95%, 42% 100%, 33% 91%, 19% 95%, 17% 81%, 3% 79%, 7% 65%, 0% 53%, 9% 41%, 3% 28%, 15% 21%, 17% 7%, 30% 9%, 39% 0%);
          }
        `}} />
        
        <div className="cert-print-area w-[297mm] h-[210mm] bg-white print:shadow-none shadow-2xl relative overflow-hidden flex shrink-0">
          
          {/* Left Panel */}
          <div className="w-[32%] flex flex-col h-full border-r border-black relative">
            {/* Top Red Bar */}
            <div className="bg-[#e31e24] text-white text-center py-6 h-32 flex flex-col justify-start z-10 relative">
              <span className="text-xl font-sans mt-2 tracking-wide">{settings.websiteText}</span>
            </div>
            
            {/* Center Image Area */}
            <div className="flex-1 relative bg-cover bg-center -mt-8 -mb-16 z-0" style={{ backgroundImage: `url(${settings.leftBannerImage})` }}>
               {/* Optional blue top border overlay as seen in screenshot */}
               <div className="absolute top-0 inset-x-0 h-4 bg-blue-600/80 backdrop-blur-sm"></div>
            </div>

            {/* Bottom Red Gradient Bar */}
            <div className="h-64 bg-gradient-to-b from-[#e31e24] to-[#f44336] text-white p-6 z-10 flex items-start justify-center text-center">
              <span className="text-[26px] leading-tight font-sans mt-8 mx-4 drop-shadow-md">
                {dataOverrides.certificateTitle.toLowerCase().replace('certificate in', 'Certificate in').replace('autocad', 'AutoCAD')}
              </span>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col relative px-12 py-16 justify-between bg-white">
            
            {/* Certificate Title */}
            <div className="mt-4">
              <h1 className="text-[38px] leading-none mb-12 tracking-widest text-gray-900 uppercase" style={{ fontFamily: "'Jura', sans-serif" }}>
                 {dataOverrides.certificateTitle}
              </h1>
              
              {/* Form Fields */}
              <div className="space-y-6 w-[95%] font-sans text-gray-800 text-[20px] uppercase font-semibold">
                
                <div className="flex items-end">
                   <span className="w-48 tracking-widest">IN:</span>
                   <div className="flex-1 border-b-[1.5px] border-black pb-1 text-center font-bold text-black">{dataOverrides.inField}</div>
                </div>

                <div className="flex items-end">
                   <span className="w-48 tracking-widest">AWARDED TO:</span>
                   <div className="flex-1 border-b-[1.5px] border-black pb-1 text-center font-bold text-black">{dataOverrides.studentName}</div>
                </div>

                <div className="flex items-end">
                   <span className="w-48 tracking-widest">AT:</span>
                   <div className="flex-1 border-b-[1.5px] border-black pb-1 text-center font-bold text-black text-[17px] leading-tight">{dataOverrides.atField}</div>
                </div>

                <div className="flex items-end">
                   <span className="w-48 tracking-widest">DURING:</span>
                   <div className="flex-1 border-b-[1.5px] border-black pb-1 text-center font-bold text-black text-[18px]">{dataOverrides.duringField}</div>
                </div>

                <div className="flex items-end">
                   <span className="w-48 tracking-widest">STUDENT ID:</span>
                   <div className="flex-1 border-b-[1.5px] border-black pb-1 text-center font-bold text-black">{dataOverrides.studentId}</div>
                </div>
              </div>
            </div>

            {/* Footer Area */}
            <div className="flex justify-between items-end mt-16 w-full -mb-6">
               
               {/* Bottom Left Logo */}
               <div className="flex flex-col items-center justify-end w-48">
                 {settings.cclLogo ? <img src={settings.cclLogo} alt="CCL Logo" className="h-32 mb-2 object-contain" /> : <div className="h-32 mb-2 w-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Logo</div>}
                 <p className="font-bold text-black text-[14px] text-center">{dataOverrides.atField.split(',')[0]}</p>
               </div>

               {/* Center Signature & CADD Logo */}
               <div className="flex flex-col items-center justify-end flex-1 px-8 mb-4">
                 <div className="w-full flex items-end justify-center relative h-20 border-b border-gray-400 mb-2 max-w-[280px]">
                   <span className="absolute left-0 bottom-1 font-bold text-black text-[13px]">{settings.signatureName}</span>
                   {settings.signatureImage && <img src={settings.signatureImage} alt="Sig" className="absolute right-0 bottom-2 h-16 max-w-32 object-contain mix-blend-multiply" />}
                 </div>
                 <div className="w-full flex justify-between max-w-[280px]">
                   <span className="text-[12px] text-black">{settings.signatureTitle}</span>
                   <span className="text-[12px] text-black text-center pr-4">Signature<br/>{settings.signatureDate}</span>
                 </div>
                 
                 <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-[320px]">
                   {settings.caddFooterLogo && <img src={settings.caddFooterLogo} alt="CADD" className="h-10 object-contain" />}
                   <p className="text-[11px] font-bold text-gray-700 leading-tight flex-1">{settings.franchiseText}</p>
                 </div>
               </div>

               {/* Bottom Right Seal & TVEC */}
               <div className="flex flex-col items-center justify-end w-48 mb-6">
                 <div className="w-[120px] h-[120px] bg-[#e31e24] starburst-seal mb-6 shadow-sm"></div>
                 <p className="font-bold text-black text-[13px] tracking-wide">{settings.tvecRegNo}</p>
               </div>
            </div>

            {/* Custom ID Absolute Bottom Right */}
            <div className="absolute bottom-3 right-4 text-gray-500 font-sans text-[13px] tracking-wider z-50">
              {settings.certificateId}
            </div>

            {/* Optional inner subtle border if needed by screenshot */}
            <div className="absolute inset-x-0 bottom-0 border-b-4 border-white pointer-events-none z-40"></div>

          </div>
        </div>
      </div>
    </div>
  )
}
