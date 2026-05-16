"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Phone, Mail, CheckCircle, MessageSquare, ChevronRight, Share } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import type { MarketingLead, Profile } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

interface LeadPipelineViewProps {
  leads: MarketingLead[]
  staff: Profile[]
  currentUser: any
  onRefresh: () => void
}

const STATUSES = ["New", "Contacted", "Follow-up", "Converted", "Lost"]
const COURSES = ["AutoCAD", "SolidWorks", "3ds Max", "Revit", "CATIA", "BIM (Full Course)", "Navisworks", "Photoshop", "Other"]
const SOURCES = ["Facebook", "Website", "Walk-in", "Referral", "WhatsApp", "Other"]

export default function LeadPipelineView({ leads, staff, currentUser, onRefresh }: LeadPipelineViewProps) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [search, setSearch] = useState("")
  
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<MarketingLead | null>(null)
  const [form, setForm] = useState({ name: "", email: "", contact: "", source: "Facebook", course_interested: "AutoCAD", status: "New", assigned_to: "" })

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmForm, setConfirmForm] = useState({ payment_amount: 0, notes: "" })

  const filteredLeads = leads.filter(l => 
    (filter === 'all' || l.assigned_to === currentUser?.id) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || (l.contact || '').includes(search))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (editingLead) {
        const { error } = await supabase.from("marketing_leads").update(payload).eq("id", editingLead.id)
        if (error) throw error
        toast.success("Lead updated")
      } else {
        const { error } = await supabase.from("marketing_leads").insert(payload)
        if (error) throw error
        toast.success("Lead added")
      }
      setShowModal(false)
      onRefresh()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog("Are you sure you want to delete this lead?")
    if (!confirmed) return
    try {
      await supabase.from("marketing_leads").delete().eq("id", id)
      toast.success("Lead deleted")
      onRefresh()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleSendToFinance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLead) return
    try {
      // Create entry in lead_confirmations with marketing_confirmed stage
      // Real-world flow: Marketing confirms → Finance verifies payment → Academic allocates batch
      const { error } = await supabase.from("lead_confirmations").insert({
        lead_id: editingLead.id,
        lead_name: editingLead.name,
        contact: editingLead.contact,
        email: editingLead.email,
        course_interested: editingLead.course_interested,
        payment_amount: confirmForm.payment_amount,
        notes: confirmForm.notes,
        stage: 'marketing_confirmed',
        marketing_confirmed_by: currentUser?.id,
        marketing_confirmed_at: new Date().toISOString(),
      })
      if (error) throw error

      // Update lead status
      await supabase.from("marketing_leads").update({ status: 'Converted' }).eq("id", editingLead.id)

      toast.success("Lead forwarded to Finance for confirmation")
      setShowConfirmModal(false)
      onRefresh()
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>All Leads</button>
          <button onClick={() => setFilter('mine')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'mine' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>My Leads</button>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="max-w-xs w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
          <button onClick={() => { setEditingLead(null); setForm({ name: "", email: "", contact: "", source: "Facebook", course_interested: "AutoCAD", status: "New", assigned_to: currentUser?.id || "" }); setShowModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* COMPACT KANBAN BOARD */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        {STATUSES.map(status => {
          const colLeads = filteredLeads.filter(l => l.status === status)
          return (
            <div key={status} className="flex-shrink-0 w-[320px] snap-center flex flex-col h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  {status} <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{colLeads.length}</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {colLeads.map(lead => (
                  <motion.div key={lead.id} layoutId={lead.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-sm truncate pr-8">{lead.name}</h4>
                      <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button onClick={() => { setEditingLead(lead); setForm(lead as any); setShowModal(true) }} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">{lead.course_interested} • {lead.source}</p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        <a href={`tel:${lead.contact}`} className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"><Phone className="w-3 h-3" /></a>
                        <a href={`mailto:${lead.email}`} className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail className="w-3 h-3" /></a>
                      </div>
                      
                      {status !== 'Converted' && status !== 'Lost' && (
                        <button onClick={() => { setEditingLead(lead); setShowConfirmModal(true) }} className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                          Confirm <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-medium">By: {staff.find(s => s.id === lead.assigned_to)?.full_name || 'Unassigned'}</p>
                      {lead.follow_ups && lead.follow_ups.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded-full">
                          <MessageSquare className="w-3 h-3" /> {lead.follow_ups.length}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {colLeads.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-sm text-gray-400">Drop here</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CONFIRM LEAD MODAL (SEND TO FINANCE) */}
      {showConfirmModal && editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2"><Share className="w-5 h-5" /> Forward to Finance</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-emerald-400 hover:text-emerald-600">×</button>
            </div>
            <form onSubmit={handleSendToFinance} className="p-6 space-y-4">
              <div className="bg-white border border-gray-100 p-4 rounded-xl mb-4 text-sm">
                <p><span className="text-gray-500">Lead:</span> <span className="font-bold">{editingLead.name}</span></p>
                <p><span className="text-gray-500">Course:</span> <span className="font-bold">{editingLead.course_interested}</span></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Payment Received (LKR)</label>
                <input type="number" required min={0} value={confirmForm.payment_amount} onChange={e => setConfirmForm({...confirmForm, payment_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-xl" />
                <p className="text-[10px] text-gray-500 mt-1">This will be verified by the Finance Department.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Finance / Academic</label>
                <textarea value={confirmForm.notes} onChange={e => setConfirmForm({...confirmForm, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-xl"></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700">Confirm & Forward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingLead ? 'Edit' : 'Add'} Lead</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input required value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Interested</label>
                  <select value={form.course_interested} onChange={e => setForm({...form, course_interested: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Unassigned --</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
