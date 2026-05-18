"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CheckCircle, Users, Clock, Mail, Lock, Key, ArrowRight, Activity, X, Trash2
} from "lucide-react"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getLeadConfirmations, confirmItAccount, deleteLeadConfirmation } from "@/lib/ims-data"
import type { LeadConfirmation } from "@/types"

interface ItAccountConfirmationsProps {
  currentUser: any
  onRefresh?: () => void
}

export default function ItAccountConfirmations({ currentUser, onRefresh }: ItAccountConfirmationsProps) {
  const [confirmations, setConfirmations] = useState<LeadConfirmation[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadConfirmation | null>(null)

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

  const handleDelete = async (row: LeadConfirmation) => {
    if (!window.confirm(`Are you sure you want to delete this confirmation record for ${row.lead_name}?`)) return;
    try {
      await deleteLeadConfirmation(row.id)
      toast.success("Record deleted successfully.")
      loadData()
      if (onRefresh) onRefresh()
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message)
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
      label: "View Details", 
      icon: Activity, 
      onClick: (row) => {
        setSelectedLead(row)
        setShowDetailsModal(true)
      }
    },
    { 
      label: "Confirm & Transfer", 
      icon: CheckCircle, 
      variant: "success", 
      show: (row) => row.stage === 'it_pending',
      onClick: (row) => handleConfirmAccount(row)
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: (row) => handleDelete(row)
    }
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

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Student Details
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</label>
                  <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{selectedLead.lead_name || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student ID</label>
                  <div className="font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{selectedLead.student_id || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact / Email</label>
                  <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{selectedLead.email || selectedLead.contact || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Course Enrolled</label>
                  <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{selectedLead.course_interested || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    {selectedLead.stage === 'it_pending' ? 'Pending IT Account Creation' : 
                     selectedLead.stage === 'it_confirmed' ? 'IT Account Created (Transferred to Academic)' : 
                     selectedLead.stage}
                  </div>
                </div>
                {selectedLead.marketing_confirmed_at && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Marketing Confirmed At</label>
                    <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      {new Date(selectedLead.marketing_confirmed_at).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedLead.finance_confirmed_at && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Finance Confirmed At</label>
                    <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      {new Date(selectedLead.finance_confirmed_at).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedLead.it_confirmed_at && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">IT Confirmed At</label>
                    <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      {new Date(selectedLead.it_confirmed_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowDetailsModal(false)} className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm transition-all">
                Close
              </button>
              {selectedLead.stage === 'it_pending' && (
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleConfirmAccount(selectedLead);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Transfer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
