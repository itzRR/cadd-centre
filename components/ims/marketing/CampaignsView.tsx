"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2 } from "lucide-react"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { supabase } from "@/lib/supabase"
import type { MarketingCampaign } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null)
  
  const emptyForm = { name: "", budget: 0, platform: "Facebook", start_date: "", end_date: "", leads_generated: 0, status: 'Active' as const }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setCampaigns(data || [])
    } catch (e: any) {
      toast.error("Failed to load campaigns: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCampaign) {
        const { error } = await supabase.from("marketing_campaigns").update(form).eq("id", editingCampaign.id)
        if (error) throw error
        toast.success("Campaign updated")
      } else {
        const { error } = await supabase.from("marketing_campaigns").insert(form)
        if (error) throw error
        toast.success("Campaign created")
      }
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog("Are you sure you want to delete this campaign?")
    if (!confirmed) return

    try {
      const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id)
      if (error) throw error
      toast.success("Campaign deleted")
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const columns: CDMColumn<MarketingCampaign>[] = [
    { key: "name", label: "Campaign Name", className: "font-bold text-gray-900" },
    { key: "platform", label: "Platform" },
    { 
      key: "budget", 
      label: "Budget", 
      render: (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val)
    },
    { 
      key: "status", 
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${val === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
          {val || 'Active'}
        </span>
      )
    },
    { key: "leads_generated", label: "Leads" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" }
  ]

  const actions: CDMAction<MarketingCampaign>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (r) => { setEditingCampaign(r); setForm(r as any); setShowModal(true) }
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (r) => handleDelete(r.id)
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Campaigns</h2>
        <button
          onClick={() => { setEditingCampaign(null); setForm(emptyForm); setShowModal(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" /> Add Campaign
        </button>
      </div>

      <CDMDataTable
        data={campaigns}
        columns={columns}
        actions={actions}
        loading={loading}
        searchPlaceholder="Search campaigns..."
        exportFileName="Campaigns"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingCampaign ? 'Edit' : 'Add'} Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Email">Email</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (LKR)</label>
                  <input type="number" required value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leads Generated</label>
                  <input type="number" value={form.leads_generated} onChange={e => setForm({...form, leads_generated: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl">
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
