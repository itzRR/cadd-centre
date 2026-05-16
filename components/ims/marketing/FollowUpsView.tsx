"use client"

import React, { useState, useMemo } from "react"
import { toast } from "sonner"
import { CheckCircle, Clock, CheckSquare } from "lucide-react"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { supabase } from "@/lib/supabase"
import type { MarketingLead } from "@/types"

interface FollowUpsViewProps {
  leads: MarketingLead[]
  onRefresh: () => void
}

export default function FollowUpsView({ leads, onRefresh }: FollowUpsViewProps) {
  const [loading, setLoading] = useState(false)

  // Flatten follow-ups for table view
  const allFollowUps = useMemo(() => {
    const list: any[] = []
    leads.forEach(lead => {
      if (lead.follow_ups) {
        lead.follow_ups.forEach((f, idx) => {
          list.push({
            ...f,
            lead_id: lead.id,
            follow_up_index: idx,
            lead_name: lead.name,
            lead_contact: lead.contact,
            lead_course: lead.course_interested
          })
        })
      }
    })
    return list.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
  }, [leads])

  const handleToggleComplete = async (leadId: string, index: number, currentStatus: boolean) => {
    setLoading(true)
    try {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) throw new Error("Lead not found")
      
      const updatedFollowUps = [...(lead.follow_ups || [])]
      if (updatedFollowUps[index]) {
        updatedFollowUps[index] = { ...updatedFollowUps[index], done: !currentStatus }
      }

      const { error } = await supabase.from("marketing_leads")
        .update({ follow_ups: updatedFollowUps })
        .eq("id", leadId)

      if (error) throw error
      toast.success(!currentStatus ? "Marked as completed" : "Marked as pending")
      onRefresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const columns: CDMColumn<any>[] = [
    { key: "lead_name", label: "Lead Name", className: "font-bold text-gray-900" },
    { key: "lead_contact", label: "Contact" },
    { key: "lead_course", label: "Course" },
    { key: "due_date", label: "Due Date" },
    { key: "note", label: "Notes", className: "max-w-xs truncate" },
    { 
      key: "done", 
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 w-max ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {val ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {val ? 'Completed' : 'Pending'}
        </span>
      )
    }
  ]

  const actions: CDMAction<any>[] = [
    {
      label: "Toggle Status",
      icon: CheckSquare,
      onClick: (r) => handleToggleComplete(r.lead_id, r.follow_up_index, r.done)
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">All Follow-ups</h2>
      </div>

      <CDMDataTable
        data={allFollowUps}
        columns={columns}
        actions={actions}
        loading={loading}
        searchPlaceholder="Search follow-ups by lead name or notes..."
        exportFileName="Follow_Ups"
      />
    </div>
  )
}
