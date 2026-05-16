"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X, Calendar, RefreshCw, Clock, UserCircle } from "lucide-react"
import { getHrRoster, createHrRoster, deleteHrRoster, getAllProfiles } from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import type { HrRoster, Profile } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

const ROSTER_TYPES = ["Shift", "Duty", "On-call", "Other"] as const
const SHIFTS = ["Morning", "Afternoon", "Evening", "Night", "Full Day"]

const TYPE_COLORS: Record<string, string> = {
  Shift:      "bg-blue-100 text-blue-700 border-blue-200",
  Duty:       "bg-green-100 text-green-700 border-green-200",
  "On-call":  "bg-orange-100 text-orange-700 border-orange-200",
  Other:      "bg-gray-100 text-gray-600 border-gray-200",
}
const getShiftColor = (shift: string) => {
  if (shift.includes("08:00 AM - 05:00 PM")) return "text-blue-600"
  if (shift.includes("08:00 AM - 02:00 PM")) return "text-orange-600"
  if (shift.includes("01:00 PM - 07:00 PM")) return "text-purple-600"
  return "text-cyan-700"
}

export default function IMSRosterPage() {
  const [roster, setRoster] = useState<HrRoster[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"))
  const [currentUser, setCurrentUser] = useState<any>(null)

  const emptyForm = { date: format(new Date(), "yyyy-MM-dd"), type: "Shift" as const, shift: "", assigned_to: null as string | null, assigned_name: "", description: "" }
  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, u, cu] = await Promise.all([getHrRoster(), getAllProfiles(), getCurrentUser()])
      setRoster(r)
      setUsers(u.filter((u: Profile) => u.role !== "student"))
      setCurrentUser(cu)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.role === "hr_officer" || currentUser?.access_level >= 2

  const handleSubmit = async () => {
    if (!form.date) return toast.error("Date required")
    try {
      const assignedUser = users.find(u => u.id === form.assigned_to)
      const created = await createHrRoster({
        ...form,
        assigned_name: assignedUser?.full_name || form.assigned_name || null,
        created_by: currentUser?.id,
      })
      setRoster(prev => [created, ...prev])
      toast.success("Roster entry added")
      setShowModal(false); setForm(emptyForm)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    if (!canEdit) return toast.error("You don't have permission to delete roster entries")
    if (!(await confirmDialog("Remove this roster entry?"))) return
    try {
      await deleteHrRoster(id)
      setRoster(prev => prev.filter(r => r.id !== id))
      toast.success("Deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const filteredRoster = roster.filter(r => r.date.startsWith(filterMonth))
  const grouped = filteredRoster.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {} as Record<string, HrRoster[]>)
  const sortedDates = Object.keys(grouped).sort()

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6 text-gray-900 selection:bg-pink-500/20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Roster Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Staff duty, shift scheduling &amp; on-call assignments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors text-sm font-medium" onClick={loadData}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all text-sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Stats + Month Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3">
          <Calendar className="h-4 w-4 text-pink-500" />
          <label className="text-sm font-bold text-gray-600">Month</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-transparent text-gray-900 font-bold focus:outline-none" />
        </div>
        <div className="flex gap-3">
          {[
            { label: "Total Entries", value: filteredRoster.length, color: "text-gray-900" },
            { label: "Days Scheduled", value: sortedDates.length, color: "text-pink-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Groups */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
          <p>Loading roster...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No roster entries</p>
          <p className="text-sm mt-1">No shifts scheduled for {filterMonth}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => {
            const isToday = date === format(new Date(), "yyyy-MM-dd")
            return (
              <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white border rounded-2xl overflow-hidden ${isToday ? 'border-pink-300 shadow-sm' : 'border-gray-200'}`}>
                <div className={`px-6 py-3 flex items-center justify-between border-b ${isToday ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="font-bold text-gray-900">
                    {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                  </p>
                  {isToday && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" /> Today
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {grouped[date].map((entry, i) => (
                    <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(entry.assigned_name || entry.assignee?.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${TYPE_COLORS[entry.type] || TYPE_COLORS.Other}`}>
                              {entry.type}
                            </span>
                            {entry.shift && (
                              <span className={`text-xs font-bold ${getShiftColor(entry.shift)}`}>
                                <Clock className="h-3 w-3 inline mr-1" />{entry.shift}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.assigned_name || entry.assignee?.full_name || "Unassigned"}
                          </p>
                          {entry.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <button onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ADD MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1628] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Add Roster Entry</h2>
                  <p className="text-white/50 text-sm mt-1">Schedule a shift or duty assignment</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Date *</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                      className={inputCls}>
                      {ROSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Shift</label>
                  <div className="flex flex-wrap gap-2">
                    {["", "08:00 AM - 05:00 PM", "08:00 AM - 02:00 PM", "01:00 PM - 07:00 PM", "Custom..."].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, shift: s }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.shift === s || (s === "Custom..." && !["", "08:00 AM - 05:00 PM", "08:00 AM - 02:00 PM", "01:00 PM - 07:00 PM"].includes(form.shift)) ? 'bg-pink-50 border-pink-400 text-pink-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {s || "N/A"}
                      </button>
                    ))}
                  </div>
                  {!["", "08:00 AM - 05:00 PM", "08:00 AM - 02:00 PM", "01:00 PM - 07:00 PM"].includes(form.shift) && (
                    <input 
                      type="text" 
                      placeholder="e.g. 09:30 AM - 06:30 PM" 
                      value={form.shift === "Custom..." ? "" : form.shift} 
                      onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                      className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-pink-500" 
                      autoFocus
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Assigned To</label>
                  <select value={form.assigned_to || ""} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value || null }))}
                    className={inputCls}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Notes</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..."
                    className={inputCls} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold shadow-lg transition-all">
                    Add Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

