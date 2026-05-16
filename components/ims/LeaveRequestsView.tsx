"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Plus, X, Save, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { createHrLeaveRequest } from "@/lib/ims-data"
import type { HrLeaveRequest, Profile } from "@/types"

export default function LeaveRequestsView() {
  const [localUser, setLocalUser] = useState<Profile | null>(null)
  const [myLeaves, setMyLeaves] = useState<HrLeaveRequest[]>([])
  const [loadingLeaves, setLoadingLeaves] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', from_date: '', to_date: '', reason: '' })
  const [submittingLeave, setSubmittingLeave] = useState(false)

  const fetchMyLeaves = useCallback(async (user: Profile) => {
    if (user.role === 'student') return
    setLoadingLeaves(true)
    try {
      const { data, error } = await supabase
        .from('hr_leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setMyLeaves(data)
        
        // Notify user of newly approved/rejected leaves once
        try {
          const seenStr = localStorage.getItem('seenLeaveNotifications') || '[]'
          const seenList = JSON.parse(seenStr)
          let newlySeen = false
          
          data.forEach(leave => {
            if ((leave.status === 'Approved' || leave.status === 'Rejected') && !seenList.includes(leave.id)) {
              if (leave.status === 'Approved') {
                toast.success(`Leave Approved: Your request for ${leave.from_date} to ${leave.to_date} was approved!`, { duration: 8000 })
              } else {
                toast.error(`Leave Rejected: Your request for ${leave.from_date} to ${leave.to_date} was rejected.`, { duration: 8000 })
              }
              seenList.push(leave.id)
              newlySeen = true
            }
          })
          
          if (newlySeen) {
            localStorage.setItem('seenLeaveNotifications', JSON.stringify(seenList))
          }
        } catch (e) {}
      }
    } catch {} finally { setLoadingLeaves(false) }
  }, [])

  useEffect(() => {
    getCurrentUser().then(async user => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setLocalUser(data as Profile)
          fetchMyLeaves(data as Profile)
        }
      }
    })
  }, [fetchMyLeaves])

  if (!localUser || localUser.role === 'student') return null

  return (
    <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
          Leave Requests
        </h3>
        <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-sm font-bold transition-all border border-orange-200">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-5">Submit a leave request directly. Your department head will review it.</p>

      {/* My Leave History */}
      {loadingLeaves ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : myLeaves.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">From</th>
                <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">To</th>
                <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{leave.type}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.from_date}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.to_date}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{leave.reason || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      leave.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {leave.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> :
                       leave.status === 'Rejected' ? <AlertCircle className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm">No leave requests yet.</div>
      )}

      {/* Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">Request Leave</h3>
                <button onClick={() => setShowLeaveModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!leaveForm.from_date || !leaveForm.to_date) return toast.error('Dates required')
                setSubmittingLeave(true)
                try {
                  await createHrLeaveRequest({
                    user_id: localUser.id,
                    employee_name: localUser.full_name || '',
                    type: leaveForm.type as any,
                    from_date: leaveForm.from_date,
                    to_date: leaveForm.to_date,
                    reason: leaveForm.reason,
                    status: 'Pending',
                    reviewed_by: null,
                  })
                  toast.success('Leave request submitted!')
                  setShowLeaveModal(false)
                  setLeaveForm({ type: 'Annual', from_date: '', to_date: '', reason: '' })
                  fetchMyLeaves(localUser)
                } catch (err: any) { toast.error(err.message) }
                finally { setSubmittingLeave(false) }
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Leave Type</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-orange-500">
                    {['Annual', 'Sick', 'Emergency', 'Maternity/Paternity', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">From</label>
                    <input type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(p => ({ ...p, from_date: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-orange-500" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">To</label>
                    <input type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(p => ({ ...p, to_date: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-orange-500" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Reason</label>
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Brief reason..." rows={3} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none" />
                </div>
                <button type="submit" disabled={submittingLeave} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  {submittingLeave ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Submit Request</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
