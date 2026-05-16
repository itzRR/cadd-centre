"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, X, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getLecturersProfiles, toggleUserActive } from "@/lib/data"
import { createStaffUser, subscribeToLecturers } from "@/lib/ims-data"
import type { Profile } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

export default function LecturersView() {
  const [lecturers, setLecturers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<Profile | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  
  const emptyForm = { full_name: "", email: "", phone: "", specialization: "", qualification: "", department: "", avatar_url: "", status: "Active" as 'Active' | 'Inactive', password: "" }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToLecturers(setLecturers)
    return () => unsubscribe()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getLecturersProfiles()
      setLecturers(data)
    } catch (e: any) {
      toast.error("Failed to load lecturers: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name) return toast.error("Name is required")
    try {
      if (editingLecturer) {
        // We do not support full profile updates here right now, 
        // typically handled in Admin > Users
        toast.error("Updates must be performed in Admin > Users panel")
      } else {
        if (!form.email || !form.password) return toast.error("Email and password required for new lecturer")
        await createStaffUser({
          name: form.full_name,
          email: form.email,
          password: form.password,
          role: 'lecturer',
          department: 'Academic',
          position: form.specialization || 'Lecturer'
        })
        toast.success("Lecturer added")
      }
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, is_active: boolean) => {
    const confirmed = await confirmDialog(`Are you sure you want to ${is_active ? 'deactivate' : 'activate'} this lecturer?`)
    if (!confirmed) return

    try {
      await toggleUserActive(id, !is_active)
      toast.success(`Lecturer ${is_active ? 'deactivated' : 'activated'}`)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const columns: CDMColumn<Profile>[] = [
    { key: "full_name", label: "Name", className: "font-medium" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Contact" },
    { key: "specialization", label: "Specialization" },
    { 
      key: "is_active", 
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  const actions: CDMAction<Profile>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (r) => { toast.info("Please edit full profile in Admin Users panel") }
    },
    {
      label: "Toggle Active",
      icon: Trash2,
      variant: "danger",
      onClick: (r) => handleDelete(r.id, r.is_active)
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Lecturer Panel</h2>
        <button
          onClick={() => { setEditingLecturer(null); setForm(emptyForm); setShowModal(true) }}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
        >
          <Plus className="w-4 h-4" /> Add Lecturer
        </button>
      </div>

      <CDMDataTable
        data={lecturers}
        columns={columns}
        actions={actions}
        loading={loading}
        searchPlaceholder="Search lecturers..."
        exportFileName="Lecturers"
      />

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editingLecturer ? 'Edit' : 'Add New'} Lecturer</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Creates a lecturer account they can log in with</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} 
                    placeholder="Letters only"
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email *</label>
                  <input type="email" required={!editingLecturer} value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                    placeholder="lecturer@example.com"
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                    placeholder="077 123 4567"
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Specialization</label>
                  <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} 
                    placeholder="e.g. AutoCAD, Revit, 3ds Max"
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>

                {!editingLecturer && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                        placeholder="Min 8 characters" autoComplete="new-password"
                        className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-colors">
                    {creating ? "Creating..." : (editingLecturer ? 'Save Changes' : 'Create Lecturer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
