"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { CheckCircle, DollarSign, X, AlertCircle, Clock, CreditCard, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CDMDataTable, { CDMColumn, CDMAction } from "@/components/ims/CDMDataTable"
import { getLeadConfirmations, confirmLeadPaymentFinance } from "@/lib/ims-data"
import type { LeadConfirmation } from "@/types"

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online", "Cheque"] as const

interface FinanceLeadConfirmationsViewProps {
  currentUser: any
  onRefresh?: () => void
}

export default function FinanceLeadConfirmationsView({ currentUser, onRefresh }: FinanceLeadConfirmationsViewProps) {
  const [confirmations, setConfirmations] = useState<LeadConfirmation[]>([])
  const [loading, setLoading] = useState(true)

  // Confirm modal
  const [showModal, setShowModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadConfirmation | null>(null)
  const [form, setForm] = useState({ amount: 0, method: "Cash" as string })
  const [confirming, setConfirming] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Get leads at marketing_confirmed stage (waiting for finance verification)
      const data = await getLeadConfirmations('marketing_confirmed')
      setConfirmations(data)
    } catch (e: any) {
      toast.error("Failed to load confirmations: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return
    if (form.amount <= 0) return toast.error("Please enter a valid payment amount")

    setConfirming(true)
    try {
      await confirmLeadPaymentFinance(
        selectedLead.id,
        currentUser?.id || null,
        form.amount,
        form.method
      )
      toast.success(`Payment verified for ${selectedLead.lead_name}. Forwarded to Academic.`)
      setShowModal(false)
      setSelectedLead(null)
      setForm({ amount: 0, method: "Cash" })
      loadData()
      if (onRefresh) onRefresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setConfirming(false)
    }
  }

  const columns: CDMColumn<LeadConfirmation>[] = [
    {
      key: "lead_name",
      label: "Student Name",
      render: (val, row) => (
        <div>
          <p className="font-bold text-gray-900">{val}</p>
          <p className="text-xs text-gray-400">{row.email || 'No email'}</p>
        </div>
      )
    },
    {
      key: "contact",
      label: "Contact",
      render: (val) => (
        <span className="text-gray-700 font-medium">{val || '—'}</span>
      )
    },
    {
      key: "course_interested",
      label: "Course",
      render: (val) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
          {val}
        </span>
      )
    },
    {
      key: "payment_amount",
      label: "Marketing Amount",
      render: (val) => (
        <span className="font-bold text-emerald-700">
          {val ? `LKR ${Number(val).toLocaleString()}` : '—'}
        </span>
      )
    },
    {
      key: "marketing_confirmed_at",
      label: "Confirmed Date",
      render: (val) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
          <Clock className="w-3 h-3" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </div>
      )
    },
    {
      key: "stage",
      label: "Status",
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Awaiting Verification
        </span>
      )
    },
  ]

  const actions: CDMAction<LeadConfirmation>[] = [
    {
      label: "Verify Payment",
      icon: CheckCircle,
      variant: "success",
      onClick: (row) => {
        setSelectedLead(row)
        setForm({ amount: row.payment_amount || 0, method: "Cash" })
        setShowModal(true)
      }
    },
  ]

  return (
    <div className="space-y-4">
      {/* Pipeline Status Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            Lead Payment Verification
          </h2>
        </div>
        
        {/* Real-world enrollment pipeline visualization */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Marketing Confirmed
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 ring-2 ring-amber-300/50">
            <CreditCard className="w-3 h-3" /> Finance Verification (You are here)
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold border border-gray-200">
            <Clock className="w-3 h-3" /> Academic Allocation
          </div>
        </div>
      </div>

      <CDMDataTable
        data={confirmations}
        columns={columns}
        actions={actions}
        loading={loading}
        title="Pending Payment Verifications"
        icon={DollarSign}
        searchPlaceholder="Search by name, contact, or course..."
        exportFileName="Lead_Payment_Verifications"
        emptyMessage="No leads awaiting payment verification"
        emptyIcon={CheckCircle}
      />

      {/* CONFIRM PAYMENT MODAL */}
      <AnimatePresence>
        {showModal && selectedLead && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Verify Payment
                  </h3>
                  <p className="text-xs text-emerald-600 mt-0.5">Confirm payment details for student enrollment</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-emerald-400 hover:text-emerald-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
                {/* Lead Summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Student:</span>
                    <span className="font-bold text-gray-900">{selectedLead.lead_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-medium text-gray-700">{selectedLead.contact || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Course:</span>
                    <span className="font-bold text-blue-700">{selectedLead.course_interested}</span>
                  </div>
                  {(selectedLead.payment_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-500">Marketing Quoted:</span>
                      <span className="font-bold text-emerald-700">LKR {(selectedLead.payment_amount ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Notes from Marketing</p>
                      <p className="text-sm text-gray-600 italic">"{selectedLead.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Verified Amount */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Verified Payment Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-lg font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Enter the actual payment received and verified by Finance.
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment Method *</label>
                  <select
                    value={form.method}
                    onChange={e => setForm({ ...form, method: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-emerald-500"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirming}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {confirming ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Verify & Forward to Academic
                      </>
                    )}
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
