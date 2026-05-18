"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CheckCircle, Users, Clock, Mail, Lock, Key, ArrowRight, Activity
} from "lucide-react"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getLeadConfirmations, confirmItAccount } from "@/lib/ims-data"
import type { LeadConfirmation } from "@/types"

interface ItAccountConfirmationsProps {
  currentUser: any
  onRefresh?: () => void
}

export default function ItAccountConfirmations({ currentUser, onRefresh }: ItAccountConfirmationsProps) {
  const [confirmations, setConfirmations] = useState<LeadConfirmation[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch both pending and confirmed for the IT tab, but maybe focus on pending
      const data = await getLeadConfirmations(['it_pending', 'it_confirmed'])
      setConfirmations(data)
    } catch (e: any) {
      toast.error("Failed to load: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleConfirmAccount = async (row: LeadConfirmation) => {
    try {
      if (row.stage === 'it_confirmed') {
        toast.info("Account is already confirmed.")
        return
      }

      await confirmItAccount(row.id, currentUser?.id || null)
      toast.success(`Account for ${row.lead_name} confirmed and transferred to Academic.`)
      loadData()
      if (onRefresh) onRefresh()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const columns: CDMColumn<LeadConfirmation>[] = [
    {
      key: "lead_name", label: "Student Name",
      render: (val, row) => (
        <div>
          <p className="font-bold text-gray-900">{val}</p>
          <p className="text-xs text-gray-400">{row.email || row.contact || 'No contact'}</p>
        </div>
      )
    },
    {
      key: "student_id", label: "Student ID",
      render: (val) => <span className="font-mono font-bold text-gray-900">{val}</span>
    },
    {
      key: "academic_email", label: "Academic Credentials",
      render: (val, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-purple-700">
            <Mail className="w-3 h-3" /> <span className="font-mono">{val || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="w-3 h-3" /> <span className="font-mono">{row.academic_password || '—'}</span>
          </div>
        </div>
      )
    },
    {
      key: "stage", label: "Status",
      render: (val) => {
        if (val === 'it_pending') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
              <Clock className="w-3 h-3" /> Needs Creation
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
            <CheckCircle className="w-3 h-3" /> Transferred
          </span>
        )
      }
    },
  ]

  const actions: CDMAction<LeadConfirmation>[] = [
    { 
      label: "Confirm & Transfer", 
      icon: CheckCircle, 
      variant: "success", 
      onClick: (row) => handleConfirmAccount(row),
      // Only show for pending
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          Account Creation Requests
        </h2>
        <p className="text-sm text-gray-500">
          The Academic department has requested the creation of the following accounts. Please provision these in the active directory/workspace and confirm.
        </p>
      </div>

      <CDMDataTable 
        data={confirmations} 
        columns={columns} 
        actions={actions} 
        loading={loading}
        title="Pending IT Accounts" 
        icon={Users} 
        searchPlaceholder="Search by student name or ID..."
        exportFileName="IT_Account_Confirmations" 
        emptyMessage="No account creation requests pending" 
        emptyIcon={CheckCircle} 
      />
    </div>
  )
}
