"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  User, Mail, Calendar as CalendarIcon, Crown, Star, Shield, Clock,
  Edit, Save, X, Lock, Key, ImageIcon, Link as LinkIcon, CheckCircle,
  AlertCircle, FileText, Plus, Building, Briefcase, Trash2, Upload,
  GraduationCap, BookOpen, Layers, Monitor
} from "lucide-react"

import type { Profile, HrLeaveRequest } from "@/types"
import { updateProfileRole, createHrLeaveRequest } from "@/lib/ims-data"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"
import { supabase } from "@/lib/supabase"

// ── Google Drive link → thumbnail URL converter ────────────────────────────
const convertToThumbnail = (url: string): string => {
  if (!url?.trim()) return ""
  const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch) return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}=w1000`
  const driveOpenMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (driveOpenMatch && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}=w1000`
  return url
}

const isGoogleDriveLink = (url: string) => url.includes("drive.google.com") && !url.includes("thumbnail?id=")

export const Avatar = ({ photoURL, name, size = "lg", className = "" }: { photoURL?: string | null, name: string | null, size?: "sm"|"md"|"lg"|"xl", className?: string }) => {
  const [imgError, setImgError] = useState(false)
  const sizeMap = {
    sm: { outer: "w-8 h-8", text: "text-sm" },
    md: { outer: "w-10 h-10", text: "text-base" },
    lg: { outer: "w-32 h-32", text: "text-4xl" },
    xl: { outer: "w-40 h-40", text: "text-5xl" },
  }
  const s = sizeMap[size]
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  const resolvedUrl = photoURL ? convertToThumbnail(photoURL) : ""
  
  React.useEffect(() => { setImgError(false) }, [resolvedUrl])

  return (
    <div className={`${className || s.outer} rounded-2xl overflow-hidden flex-shrink-0 relative`}>
      {resolvedUrl && !imgError ? (
        <img src={resolvedUrl} alt={name || "Avatar"} className="w-full h-full object-cover" onError={() => setImgError(true)} referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#02559c] to-[#3b9ced] flex items-center justify-center">
          <span className={`${s.text} font-bold text-white`}>{initials}</span>
        </div>
      )}
    </div>
  )
}

export const PhotoEditor = ({ uid, currentPhotoURL, name, onClose, onUpdate }: { uid: string, currentPhotoURL?: string | null, name: string | null, onClose: () => void, onUpdate: (url: string) => void }) => {
  const [url, setUrl] = useState(currentPhotoURL || "")
  const [preview, setPreview] = useState(currentPhotoURL ? convertToThumbnail(currentPhotoURL) : "")
  const [previewError, setPreviewError] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setUrl(base64String)
      setPreview(base64String)
      setPreviewError(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setPreviewError(false)
    setPreview(val.trim() ? convertToThumbnail(val.trim()) : "")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const resolvedURL = url.trim() ? convertToThumbnail(url.trim()) : ""
      await updateProfileRole(uid, { avatar_url: resolvedURL })
      toast.success("Profile photo updated!")
      onUpdate(resolvedURL)
      onClose()
    } catch {
      toast.error("Failed to update photo")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await updateProfileRole(uid, { avatar_url: "" })
      toast.success("Profile photo removed")
      onUpdate("")
      onClose()
    } catch {
      toast.error("Failed to remove photo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-red-500" /> Update Profile Photo</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/10 shadow-lg">
              {preview && !previewError ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewError(true)} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#02559c] to-[#3b9ced] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{(name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4 mb-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Upload Image File</label>
            <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>Click to select file...</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Image URL or Google Drive share link</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
            </div>
            {isGoogleDriveLink(url) && <p className="text-xs text-red-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Drive link detected.</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {currentPhotoURL && <button onClick={handleRemove} disabled={saving} className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all">Remove</button>}
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-red-500 to-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium hover:from-red-600 hover:to-indigo-600 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Photo</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const DocumentEditor = ({ uid, existingDocs = [], onClose, onUpdate }: { uid: string, existingDocs: any[], onClose: () => void, onUpdate: (docs: any[]) => void }) => {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [preview, setPreview] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setUrl(base64String)
      setPreview(base64String)
      setPreviewError(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setPreviewError(false)
    setPreview(val.trim() ? convertToThumbnail(val.trim()) : "")
  }

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return toast.error("Please provide title and URL")
    setSaving(true)
    try {
      const newDoc = { id: Date.now().toString(), title: title.trim(), url: url.trim(), addedAt: new Date().toISOString() }
      const updatedDocs = [...existingDocs, newDoc]
      await updateProfileRole(uid, { documents: updatedDocs })
      toast.success("Document added successfully!")
      onUpdate(updatedDocs)
      onClose()
    } catch {
      toast.error("Failed to add document")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-[2rem] p-8 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Add Document
            </h3>
            <p className="text-gray-500 text-sm mt-1">Upload a certificate or important file link</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Document Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Degree Certificate" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Upload Image File</label>
            <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>Click to select file...</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Image URL / Drive Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" />
            </div>
          </div>
          
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 h-48 flex items-center justify-center relative group">
                {!previewError ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={() => setPreviewError(true)} />
                ) : (
                  <div className="flex flex-col items-center text-white/20 gap-3">
                    <FileText className="w-12 h-12" />
                    <span className="text-xs font-bold uppercase tracking-widest">No Preview Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !url.trim()} 
            className="flex-1 bg-gradient-to-r from-red-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> Add Document</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfileSection({ userData, onUpdateProfile }: { userData: Profile, onUpdateProfile?: (data: Partial<Profile>) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(userData.full_name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [showDocEditor, setShowDocEditor] = useState(false)
  const [localUser, setLocalUser] = useState<Profile>(userData)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', from_date: '', to_date: '', reason: '' })
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [myLeaves, setMyLeaves] = useState<HrLeaveRequest[]>([])
  const [loadingLeaves, setLoadingLeaves] = useState(false)
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  const fetchMyLeaves = useCallback(async () => {
    if (localUser.role === 'student') return
    setLoadingLeaves(true)
    try {
      const { data, error } = await supabase
        .from('hr_leave_requests')
        .select('*')
        .eq('user_id', localUser.id)
        .order('created_at', { ascending: false })
      if (!error && data) setMyLeaves(data)
    } catch {} finally { setLoadingLeaves(false) }
  }, [localUser.id, localUser.role])

  useEffect(() => { fetchMyLeaves() }, [fetchMyLeaves])

  React.useEffect(() => {
    const fetchFullProfile = async () => {
      // Try profiles first (staff)
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userData.id).single()
      if (profileData && !profileError) {
        setLocalUser(prev => ({ ...prev, ...profileData }))
        setEditedName(profileData.full_name || "")
        return
      }
      // Fallback to students table
      const { data: studentData, error: studentError } = await supabase.from('students').select('*').eq('id', userData.id).single()
      if (studentData && !studentError) {
        setLocalUser(prev => ({ ...prev, ...studentData, role: 'student' }))
        setEditedName(studentData.full_name || "")
      }
    }
    fetchFullProfile()
  }, [userData.id])

  // Fetch enrollments for student profiles
  useEffect(() => {
    if (localUser.role !== 'student') return
    const fetchEnrollments = async () => {
      setLoadingEnrollments(true)
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('*, courses(title, slug), batches:batch_id(name)')
          .eq('user_id', localUser.id)
          .order('created_at', { ascending: false })
        if (!error && data) setStudentEnrollments(data)
      } catch {} finally { setLoadingEnrollments(false) }
    }
    fetchEnrollments()
  }, [localUser.id, localUser.role])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editedName.trim()) return toast.error("Name cannot be empty")
    setIsLoading(true)
    try {
      if (localUser.role === 'student') {
        // Students → update students table directly
        await supabase.from('students').update({ full_name: editedName.trim() }).eq('id', localUser.id)
      } else {
        // Staff → update profiles table
        await updateProfileRole(localUser.id, { full_name: editedName.trim() })
      }
      toast.success("Profile updated successfully!")
      setIsEditing(false)
      setLocalUser(prev => ({ ...prev, full_name: editedName.trim() }))
      if (onUpdateProfile) onUpdateProfile({ full_name: editedName.trim() })
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!(await confirmDialog("Remove this document?"))) return
    try {
      const updatedDocs = (localUser.documents || []).filter(d => d.id !== docId)
      await updateProfileRole(localUser.id, { documents: updatedDocs })
      toast.success("Document removed")
      setLocalUser(prev => ({ ...prev, documents: updatedDocs }))
      if (onUpdateProfile) onUpdateProfile({ documents: updatedDocs })
    } catch {
      toast.error("Failed to remove document")
    }
  }

  const inputCls = "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-red-500/30 focus:border-red-500 rounded-xl h-12 pl-12 transition-all w-full"
  
  const ROLE_LABELS: Record<string, string> = {
    admin:            "Administrator",
    academic_manager: "Academic Manager",
    lecturer:          "Lecturer",
    student:          "Student",
    coordinator:      "Coordinator",
  }

  return (
    <>
      <AnimatePresence>
        {showPhotoEditor && <PhotoEditor uid={localUser.id} currentPhotoURL={localUser.avatar_url} name={localUser.full_name} onClose={() => setShowPhotoEditor(false)} onUpdate={(url) => { setLocalUser(p => ({ ...p, avatar_url: url })); if(onUpdateProfile) onUpdateProfile({ avatar_url: url }) }} />}
        {showDocEditor && <DocumentEditor uid={localUser.id} existingDocs={localUser.documents || []} onClose={() => setShowDocEditor(false)} onUpdate={(docs) => { setLocalUser(p => ({ ...p, documents: docs })); if(onUpdateProfile) onUpdateProfile({ documents: docs }) }} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Banner + Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="h-40 md:h-56 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 relative">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-20 md:-mt-24">
              
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div 
                  className="relative w-36 h-36 md:w-44 md:h-44 rounded-[2.5rem] border-[6px] border-white shadow-xl group cursor-pointer bg-white flex-shrink-0"
                  onClick={() => setShowPhotoEditor(true)}
                >
                  <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-100">
                    <Avatar photoURL={localUser.avatar_url} name={localUser.full_name} className="w-full h-full" />
                  </div>
                  <div className="absolute inset-0 rounded-[2rem] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                    <ImageIcon className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">Update</span>
                  </div>
                </div>
                
                <div className="mb-2 md:mb-4">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{localUser.full_name || "Anonymous"}</h2>
                  <p className="text-gray-500 font-medium text-sm md:text-base">{localUser.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-2 md:mb-4">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25">
                  <Shield className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {ROLE_LABELS[localUser.role] || localUser.role.replace('_', ' ')}
                  </span>
                </div>
                {localUser.department && (
                  <div className="bg-gray-100 text-gray-700 rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 border border-gray-200">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{localUser.department}</span>
                  </div>
                )}
                {localUser.role === 'student' && (localUser as any).student_id && (
                  <div className="bg-emerald-50 text-emerald-700 rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 border border-emerald-200">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">ID</span>
                    <span className="text-sm font-black font-mono tracking-wider">{(localUser as any).student_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Account Details */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
            
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Account Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><CalendarIcon className="w-4 h-4" /></div>
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Member Since</p><p className="text-sm font-bold text-gray-900">{localUser.created_at ? format(new Date(localUser.created_at), 'MMM d, yyyy') : 'Unknown'}</p></div>
                </div>
                
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Clock className="w-4 h-4" /></div>
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Active</p><p className="text-sm font-bold text-gray-900">{localUser.last_active ? format(new Date(localUser.last_active), 'MMM d, yyyy') : 'Recently'}</p></div>
                </div>
                
                {localUser.access_level !== undefined && (
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0"><Key className="w-4 h-4" /></div>
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Access Level</p><p className="text-sm font-bold text-gray-900">Level {localUser.access_level}</p></div>
                  </div>
                )}

                {(localUser as any).epf_number && (
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><Briefcase className="w-4 h-4" /></div>
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">EPF Number</p><p className="text-sm font-bold text-gray-900 font-mono">{(localUser as any).epf_number}</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* Office Assets (Staff Only) */}
            {localUser.role !== 'student' && (
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Office Assets
                </h3>
                
                {!localUser.office_assets || localUser.office_assets.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <Monitor className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No assets assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localUser.office_assets.map((asset, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1.5 hover:bg-white hover:border-gray-300 transition-colors">
                        <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          {asset.item}
                        </span>
                        {asset.serialNo && <span className="text-[11px] text-gray-500 font-medium pl-4">SN: <span className="font-mono text-gray-700">{asset.serialNo}</span></span>}
                        {asset.issuedDate && <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-4">Issued: {asset.issuedDate}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>

          {/* Right Column: Main Content */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-6">
            
            {/* Edit Profile Form */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                Profile Settings
              </h3>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 block">Full Name *</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                      <input id="full_name" className={inputCls} placeholder="Enter your full name"
                        value={editedName} onChange={e => setEditedName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 block">Email Address</label>
                    <div className="relative opacity-60">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input id="email" className={inputCls + " bg-gray-100 border-dashed"} value={localUser.email || ""} disabled />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit"
                    className="w-full sm:w-auto px-8 h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 gap-2 border-none transition-all active:scale-[0.98] flex items-center justify-center"
                    disabled={isLoading || editedName === localUser.full_name}>
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Student Specific Content */}
            {localUser.role === 'student' && (
              <>
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    Academic Contact Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest">Academic Email</p>
                        <p className="font-mono font-bold text-gray-900 text-sm truncate">{(localUser as any).academic_email || localUser.email || '—'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Default Password</p>
                        <p className="font-mono font-bold text-gray-900 text-sm truncate">{(localUser as any).academic_password || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    Enrolled Courses & Batches
                  </h3>

                  {loadingEnrollments ? (
                    <div className="text-center py-10 bg-gray-50 rounded-3xl">
                      <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading enrollments...</p>
                    </div>
                  ) : studentEnrollments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <BookOpen className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No enrollments found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentEnrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                              <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm md:text-base leading-tight">{enrollment.courses?.title || 'Unknown Course'}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {enrollment.batches?.name && (
                                  <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-gray-400" /> {enrollment.batches.name}
                                  </span>
                                )}
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                                  enrollment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  enrollment.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {enrollment.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="sm:text-right border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                            <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase inline-block mb-1 ${
                              enrollment.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {enrollment.payment_status}
                            </span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase block mt-1">Enrolled: {enrollment.created_at ? format(new Date(enrollment.created_at), 'MMM d, yyyy') : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Staff Specific Content */}
            {localUser.role !== 'student' && (
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    My Documents
                  </h3>
                  <button onClick={() => setShowDocEditor(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-xl text-sm font-bold transition-all">
                    <Plus className="w-4 h-4" /> Add Document
                  </button>
                </div>

                {!localUser.documents?.length ? (
                  <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                      <FileText className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No documents uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {localUser.documents.map((docItem) => {
                      const previewUrl = convertToThumbnail(docItem.url)
                      return (
                        <motion.div key={docItem.id} whileHover={{ y: -4 }} className="relative group bg-gray-50 rounded-[1.5rem] overflow-hidden border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                          <div className="h-32 bg-black/5 overflow-hidden relative">
                            <img src={previewUrl} alt={docItem.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as any).style.display='none' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                          </div>
                          <div className="p-4 relative bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm truncate leading-tight mb-1" title={docItem.title}>{docItem.title}</h4>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                  <CalendarIcon className="w-3 h-3" />
                                  {format(new Date(docItem.addedAt), 'MMM d, yyyy')}
                                </div>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <a href={docItem.url} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-200" title="Open Link">
                                  <LinkIcon className="w-3.5 h-3.5" />
                                </a>
                                <button onClick={() => handleDeleteDoc(docItem.id)} className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all border border-red-100" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </>
  )
}


