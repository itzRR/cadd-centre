"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"
import CDMDataTable, { type CDMColumn, type CDMAction } from "@/components/ims/CDMDataTable"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, Area, AreaChart
} from "recharts"

import {
  Users, DollarSign, Star, CalendarDays, Plus,
  Edit, Trash2, X, Search, CheckCircle,
  Download, Clock, Menu, LogOut, Briefcase, FileText, XCircle, Power, User, Calendar,
  Phone, CreditCard, UserCheck, RefreshCw, ShieldPlus,
  Building2, GraduationCap, Megaphone, Terminal, ExternalLink
} from "lucide-react"
import { QuickGuide, type GuideStep } from "@/components/ui/quick-guide"
import { hasPermission } from "@/lib/permissions"

import {
  getIMSStaff, updateProfileRole, createStaffUser, getMyAttendance,
  getHrLeaveRequests, createHrLeaveRequest, updateHrLeaveRequest, deleteHrLeaveRequest,
  getHrSalaryPayouts, createHrSalaryPayout, deleteHrSalaryPayout,
  getHrPerformanceReviews, createHrPerformanceReview, deleteHrPerformanceReview,
  subscribeToHrLeaveRequests,
} from "@/lib/ims-data"
import type { StaffAttendanceSession } from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import { sanitizeName, isValidName, isValidEmail } from "@/lib/validation"
import { FieldError } from "@/components/ui/field-error"
import type { Profile, HrLeaveRequest, HrSalaryPayout, HrPerformanceReview, HrRoster, UserRole, Permission } from "@/types"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"
import LeaveRequestsView from "@/components/ims/LeaveRequestsView"
import IMSTasksPage from "../tasks/page"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

const DEPARTMENTS = ["Academic", "Marketing", "Finance", "HR", "IT", "Operations"]
const LEAVE_TYPES = ["Annual", "Sick", "Emergency", "Maternity/Paternity", "Other"]
const ROLES = ["admin", "super_admin", "branch_manager", "marketing_staff", "academic_staff", "finance_officer", "hr_officer", "staff"]
const CONTRACT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"]
const EMPLOYEE_STATUSES = ["Active", "Inactive", "On Leave", "Terminated"]

export default function HRDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [employees, setEmployees] = useState<Profile[]>([])
  const [leaves, setLeaves] = useState<HrLeaveRequest[]>([])
  const [payouts, setPayouts] = useState<HrSalaryPayout[]>([])
  const [reviews, setReviews] = useState<HrPerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [search, setSearch] = useState("")

  const isHead = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.role === "hr_officer" || currentUser?.access_level >= 2 || currentUser?.permissions?.includes("ims_users")

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const [editingEmp, setEditingEmp] = useState<Profile | null>(null)

  const emptyLeave = { user_id: "", employee_name: "", type: "Annual" as const, from_date: "", to_date: "", reason: "", status: "Pending" as const, reviewed_by: null }
  const [leaveForm, setLeaveForm] = useState(emptyLeave)

  const emptyPayout = { user_id: "", employee_name: "", month: format(new Date(), "yyyy-MM"), amount: 0, paid_on: format(new Date(), "yyyy-MM-dd"), notes: "", created_by: null }
  const [payoutForm, setPayoutForm] = useState(emptyPayout)

  const emptyReview = { employee_id: "", employee_name: "", quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`, score: 80, notes: "", reviewed_by: null }
  const [reviewForm, setReviewForm] = useState(emptyReview)

  const emptyUserForm = { 
    email: "", password: "", name: "", role: "staff" as UserRole, position: "", department: "HR", access_level: 1,
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
    permissions: [] as Permission[],
    phone: "", nic: "", epf_number: "", join_date: "",
    contract_type: "Full-time", monthly_salary: "" as string,
    employee_status: "Active",
  }
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [creatingUser, setCreatingUser] = useState(false)

  const [tempShiftTime, setTempShiftTime] = useState("")
  const [tempAssetItem, setTempAssetItem] = useState("")
  const [tempAssetSerial, setTempAssetSerial] = useState("")
  const [userFormTouched, setUserFormTouched] = useState<Record<string, boolean>>({})
  const [userAttendance, setUserAttendance] = useState<StaffAttendanceSession[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [e, l, p, r, u] = await Promise.all([
        getIMSStaff(), getHrLeaveRequests(), getHrSalaryPayouts(), getHrPerformanceReviews(), getCurrentUser()
      ])
      setEmployees(e); setLeaves(l); setPayouts(p); setReviews(r); setCurrentUser(u)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Real-time leave request subscription
  useEffect(() => {
    const unsub = subscribeToHrLeaveRequests(setLeaves)
    return unsub
  }, [])
  
  useEffect(() => {
    const handleSwitchTab = (e: any) => setActiveTab(e.detail)
    window.addEventListener('switch-tab', handleSwitchTab)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) setActiveTab(tab)
    }
    return () => window.removeEventListener('switch-tab', handleSwitchTab)
  }, [])

  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const hrGuideSteps: GuideStep[] = [
    { title: "Staff Directory", description: "View all staff members with their department, role, and status. Add new staff, edit details, assign shifts, and manage office assets.", icon: Users, gradient: "from-purple-500 to-pink-500", tip: "Hover over a staff row to see Edit and Enable/Disable actions." },
    { title: "Leave Requests", description: "Staff can submit leave requests (Annual, Sick, Emergency, etc.). Department heads can approve or reject them.", icon: CalendarDays, gradient: "from-orange-500 to-pink-500", tip: "Pending leave count is shown as a badge in the sidebar." },
    { title: "Payroll Management", description: "Log salary payouts for each employee, generate PDF payslips, and export the full payroll to Excel.", icon: DollarSign, gradient: "from-blue-500 to-indigo-500" },
    { title: "Performance Reviews", description: "Record quarterly performance scores (0-100) with notes. Track employee performance over time.", icon: Star, gradient: "from-yellow-500 to-orange-500" },
    { title: "Staff Resources", description: "When adding/editing staff, you can assign shift schedules, office assets (laptops, etc.), and granular permissions.", icon: Briefcase, gradient: "from-emerald-500 to-cyan-500", tip: "Use 'Granular Permissions' to control exactly what each staff member can access." },
  ]

  // ── Leave CRUD ──
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveForm.employee_name.trim() || !leaveForm.from_date || !leaveForm.to_date) return toast.error("All required fields needed")
    try {
      const created = await createHrLeaveRequest({ ...leaveForm })
      setLeaves(prev => [created, ...prev])
      toast.success("Leave request submitted")
      setShowLeaveModal(false); setLeaveForm(emptyLeave)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleLeaveStatusChange = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const updated = await updateHrLeaveRequest(id, { status, reviewed_by: currentUser?.id })
      setLeaves(prev => prev.map(l => l.id === id ? updated : l))
      toast.success(`Leave ${status.toLowerCase()}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteLeave = async (id: string) => {
    if (!(await confirmDialog("Delete this leave request?"))) return
    try { await deleteHrLeaveRequest(id); setLeaves(prev => prev.filter(l => l.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Salary CRUD ──
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutForm.employee_name.trim() || payoutForm.amount <= 0) return toast.error("Name and amount required")
    try {
      const created = await createHrSalaryPayout({ ...payoutForm, created_by: currentUser?.id })
      setPayouts(prev => [created, ...prev])
      toast.success("Salary payout recorded")
      setShowPayoutModal(false); setPayoutForm(emptyPayout)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeletePayout = async (id: string) => {
    if (!(await confirmDialog("Delete this payout?"))) return
    try { await deleteHrSalaryPayout(id); setPayouts(prev => prev.filter(p => p.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Performance CRUD ──
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewForm.employee_name.trim()) return toast.error("Employee name required")
    try {
      const created = await createHrPerformanceReview({ ...reviewForm, reviewed_by: currentUser?.id })
      setReviews(prev => [created, ...prev])
      toast.success("Review saved")
      setShowReviewModal(false); setReviewForm(emptyReview)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteReview = async (id: string) => {
    if (!(await confirmDialog("Delete this review?"))) return
    try { await deleteHrPerformanceReview(id); setReviews(prev => prev.filter(r => r.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Employee Management ──
  const handleToggleDisable = async (emp: Profile) => {
    try {
      await updateProfileRole(emp.id, { disabled: !emp.disabled })
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, disabled: !e.disabled } : e))
      toast.success(emp.disabled ? "Account enabled" : "Account disabled")
    } catch (e: any) { toast.error(e.message) }
  }

  // User form validation errors
  const userFormErrors: Record<string, string> = {}
  if (userFormTouched.name && !userForm.name.trim()) {
    userFormErrors.name = "Name is required"
  } else if (userFormTouched.name && userForm.name.trim() && !isValidName(userForm.name)) {
    userFormErrors.name = "Name can only contain letters, spaces, and hyphens"
  }
  if (!editingEmp && userFormTouched.email && !userForm.email.trim()) {
    userFormErrors.email = "Email is required"
  } else if (!editingEmp && userFormTouched.email && userForm.email.trim() && !isValidEmail(userForm.email)) {
    userFormErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (!editingEmp && userFormTouched.password && userForm.password && userForm.password.length < 6) {
    userFormErrors.password = "Password must be at least 6 characters"
  }

  const handleUserFormBlur = (field: string) => setUserFormTouched(prev => ({ ...prev, [field]: true }))

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserFormTouched({ name: true, email: true, password: true })
    if (!userForm.name.trim() || !isValidName(userForm.name)) return toast.error("Please enter a valid name (letters only)")
    if (!editingEmp && (!userForm.email.trim() || !isValidEmail(userForm.email))) return toast.error("Please enter a valid email address")
    if (!editingEmp && userForm.password.length < 6) return toast.error("Password must be at least 6 chars")
    
    setCreatingUser(true)
    try {
      if (editingEmp) {
        const updated = await updateProfileRole(editingEmp.id, {
          role: userForm.role, position: userForm.position, department: userForm.department,
          access_level: userForm.access_level, work_schedule: userForm.work_schedule,
          office_assets: userForm.office_assets, full_name: userForm.name,
          permissions: userForm.permissions, phone: userForm.phone,
          nic: userForm.nic, join_date: userForm.join_date || undefined,
          epf_number: userForm.epf_number || undefined,
          contract_type: userForm.contract_type, employee_status: userForm.employee_status,
          monthly_salary: userForm.monthly_salary ? parseFloat(userForm.monthly_salary) : undefined,
        })
        setEmployees(prev => prev.map(p => p.id === editingEmp.id ? { ...p, ...updated } : p))
        toast.success("HR details updated successfully")
      } else {
        await createStaffUser({
          email: userForm.email, password: userForm.password, name: userForm.name,
          role: userForm.role, position: userForm.position, department: userForm.department,
          access_level: userForm.access_level, work_schedule: userForm.work_schedule,
          office_assets: userForm.office_assets, permissions: userForm.permissions,
          phone: userForm.phone || undefined, nic: userForm.nic || undefined,
          join_date: userForm.join_date || undefined, contract_type: userForm.contract_type || 'Full-time',
          epf_number: userForm.epf_number || undefined,
          monthly_salary: userForm.monthly_salary ? parseFloat(userForm.monthly_salary) : undefined,
          employee_status: userForm.employee_status || 'Active',
        })
        toast.success("Staff member added successfully")
        await loadData()
      }
      setShowUserModal(false); setUserForm(emptyUserForm); setEditingEmp(null); setUserFormTouched({})
    } catch (e: any) { toast.error(e.message) }
    finally { setCreatingUser(false) }
  }

  const exportPayroll = () => {
    const ws = XLSX.utils.json_to_sheet(payouts.map(p => ({
      Employee: p.employee_name, Month: p.month, Amount: p.amount, PaidOn: p.paid_on, Notes: p.notes,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payroll")
    XLSX.writeFile(wb, `payroll_${format(new Date(), "yyyy-MM")}.xlsx`)
  }

  const generatePayslipPDF = (payout: HrSalaryPayout) => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("CADD Centre Lanka - Salary Payslip", 14, 20)
    doc.setFontSize(12)
    doc.text(`Employee: ${payout.employee_name}`, 14, 35)
    doc.text(`Month: ${payout.month}`, 14, 43)
    doc.text(`Amount: LKR ${payout.amount.toLocaleString()}`, 14, 51)
    doc.text(`Paid On: ${payout.paid_on || "-"}`, 14, 59)
    if (payout.notes) doc.text(`Notes: ${payout.notes}`, 14, 67)
    doc.save(`payslip_${payout.employee_name}_${payout.month}.pdf`)
  }

  const filteredEmployees = employees.filter(e =>
    !search || (e.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  )


  const navSections = [
    {
      label: '🏢 HR Management',
      items: [
        { id: 'overview',      label: 'Overview',        icon: Building2,   badge: 0 },
        { id: 'directory',     label: 'Staff Directory', icon: Users,       badge: 0 },
        { id: 'leaves',        label: 'Leave Requests',  icon: CalendarDays,badge: leaves.filter(l=>l.status==='Pending').length },
        { id: 'salary',        label: 'Payroll',         icon: DollarSign,  badge: 0 },
        { id: 'performance',   label: 'Performance',     icon: Star,        badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'tasks',         label: 'Tasks',           icon: FileText,    badge: 0 },
        { id: 'leave-requests', label: 'My Leaves', icon: CalendarDays, badge: 0 },
        { id: 'attendance',    label: 'My Attendance',   icon: Clock,       badge: 0 },
        { id: 'profile',       label: 'My Profile',      icon: User,        badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',      label: 'Calendar',        icon: Calendar,    badge: 0 },
      ]
    },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-gray-900" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">CADD Centre - HR</h2>
            <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-purple-700">HR Dashboard</h1>
            <p className="text-gray-500 text-sm hidden md:block">CADD Centre - {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QuickGuide
            guideKey="hr_dashboard"
            dashboardName="HR"
            accentGradient="from-purple-500 to-pink-500"
            steps={hrGuideSteps}
          />
          {['admin', 'super_admin', 'branch_manager'].includes(currentUser?.role) && <button onClick={() => router.push('/admin/ims')} className="text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">Back to Admin</button>}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors font-medium text-sm md:text-base">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <motion.aside initial={{ x: -100 }} animate={{ x: 0 }}
          className={`bg-white border-r border-gray-200 h-screen z-50 w-60 flex flex-col flex-shrink-0 ${mobileMenuOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex sticky top-0'}`}>
          {mobileMenuOpen && <div className="flex justify-end p-3 md:hidden"><button onClick={() => setMobileMenuOpen(false)} className="text-gray-900"><X size={20} /></button></div>}

          <div className="px-4 pt-5 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0 overflow-hidden">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0).toUpperCase() || 'H'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-purple-700 text-xs font-semibold">Human Resources</p>
                <p className="text-gray-400 text-[10px] mt-0.5">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-gray-100 rounded-lg p-2 text-center border border-gray-200">
                <p className="font-bold text-sm text-green-600">{employees.filter(e => !e.disabled).length}</p>
                <p className="text-gray-500 text-[10px]">Active</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-2 text-center border border-gray-200">
                <p className="font-bold text-sm text-yellow-600">{leaves.filter(l => l.status === 'Pending').length}</p>
                <p className="text-gray-500 text-[10px]">Leave Req</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-gray-900 shadow-lg shadow-purple-500/20'
                          : item.badge > 0
                            ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="hr-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-gray-900' : item.badge > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">{item.badge}</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </motion.aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-gray-50">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Staff', value: employees.length, color: 'from-purple-500 to-pink-500', icon: Users },
                  { label: 'Active', value: employees.filter(e => !e.disabled).length, color: 'from-emerald-500 to-cyan-500', icon: CheckCircle },
                  { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'Pending').length, color: 'from-amber-500 to-orange-500', icon: CalendarDays },
                  { label: 'Avg Performance', value: reviews.length ? `${Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length)}%` : 'N/A', color: 'from-blue-500 to-indigo-500', icon: Star },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave Requests by Type */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-purple-500 rounded-full" /> Leave Requests by Type
                  </h3>
                  {(() => {
                    const leaveData = LEAVE_TYPES.map(t => ({ name: t, value: leaves.filter(l => l.type === t).length })).filter(d => d.value > 0)
                    const COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#6b7280']
                    return leaveData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={leaveData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                          <Bar dataKey="value" fill="url(#hrGrad)" radius={[8, 8, 0, 0]} />
                          <defs>
                            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">No leave data yet</div>
                    )
                  })()}
                </div>

                {/* Staff by Department */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-pink-500 rounded-full" /> Staff by Department
                  </h3>
                  {(() => {
                    const deptData = DEPARTMENTS.map(d => ({ name: d, value: employees.filter(e => e.department === d).length })).filter(d => d.value > 0)
                    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f97316', '#06b6d4']
                    return deptData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">No department data yet</div>
                    )
                  })()}
                </div>
              </div>

              {/* Payroll Trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full" /> Payroll Trend
                </h3>
                {(() => {
                  const monthData: Record<string, number> = {}
                  payouts.forEach(p => {
                    if (!monthData[p.month]) monthData[p.month] = 0
                    monthData[p.month] += p.amount
                  })
                  const data = Object.entries(monthData).slice(-6).map(([month, total]) => ({ month, total }))
                  return data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                        <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} name="Total Payroll" />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">No payroll data yet</div>
                  )
                })()}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Staff Directory', icon: Users, onClick: () => setActiveTab('directory'), color: 'from-purple-500 to-pink-500' },
                  { label: 'Leave Requests', icon: CalendarDays, onClick: () => setActiveTab('leaves'), color: 'from-amber-500 to-orange-500' },
                  { label: 'Payroll', icon: DollarSign, onClick: () => setActiveTab('salary'), color: 'from-blue-500 to-indigo-500' },
                  { label: 'Performance', icon: Star, onClick: () => setActiveTab('performance'), color: 'from-yellow-500 to-orange-500' },
                ].map((action, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg transition-all`}>
                    <action.icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ── DIRECTORY ── */}
          {activeTab === 'directory' && (
            <CDMDataTable
              data={employees}
              columns={[
                {
                  key: 'full_name', label: 'Staff Member', sortable: true,
                  render: (val: string, row: any) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shadow-inner overflow-hidden flex-shrink-0">
                        {row.avatar_url ? (
                          <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (val || row.email || '?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[15px] truncate">{val || row.email}</p>
                        <p className="text-gray-400 text-xs truncate">{row.position || 'Staff member'}</p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'department', label: 'Department', sortable: true,
                  render: (val: string) => (
                    <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider border border-purple-200">
                      {val || 'General'}
                    </span>
                  )
                },
                {
                  key: 'role', label: 'Role', sortable: true,
                  render: (val: string, row: any) => (
                    <div>
                      <p className="text-gray-700 font-medium">{val.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-400 truncate">{row.email}</p>
                    </div>
                  )
                },
                {
                  key: 'disabled', label: 'Status',
                  render: (val: boolean) => (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${val ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                      {val ? 'Disabled' : 'Active'}
                    </div>
                  )
                },
              ] as CDMColumn[]}
              actions={isHead ? [
                {
                  label: 'Edit', icon: Edit, variant: 'default' as const,
                  onClick: (emp: any) => {
                    setEditingEmp(emp); 
                    setUserForm({
                      email: emp.email, password: "", name: emp.full_name || "",
                      role: emp.role as UserRole, position: emp.position || "", department: emp.department || "HR", access_level: emp.access_level || 1,
                      work_schedule: emp.work_schedule || [], office_assets: emp.office_assets || [], permissions: emp.permissions || [],
                      phone: emp.phone || "", nic: emp.nic || "", epf_number: (emp as any).epf_number || "", join_date: emp.join_date || "",
                      contract_type: emp.contract_type || "Full-time",
                      monthly_salary: emp.monthly_salary != null ? String(emp.monthly_salary) : "",
                      employee_status: emp.employee_status || "Active",
                    });
                    setShowUserModal(true);
                    setLoadingAttendance(true);
                    getMyAttendance(emp.id, 60).then(d => setUserAttendance(d)).catch(() => setUserAttendance([])).finally(() => setLoadingAttendance(false));
                  }
                },
                {
                  label: 'Toggle', icon: Power, variant: 'warning' as const,
                  onClick: (emp: any) => handleToggleDisable(emp)
                },
              ] as CDMAction[] : []}
              title="Staff Directory"
              icon={Users}
              searchPlaceholder="Search staff..."
              exportFileName="Staff_Directory"
              emptyMessage="No staff members found"
              headerActions={isHead ? (
                <motion.button whileHover={{ scale: 1.05 }}
                  onClick={() => { setEditingEmp(null); setUserForm(emptyUserForm); setShowUserModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold text-sm">
                  <Plus className="w-4 h-4" /> Add Staff
                </motion.button>
              ) : undefined}
              rowClassName={(row: any) => row.disabled ? 'opacity-50' : ''}
            />
          )}

          {/* ── LEAVES ── */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Request Leave
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaves.map(l => (
                  <div key={l.id} className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 space-y-3 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {l.status}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{l.employee_name}</h3>
                      <span className="text-purple-700 text-xs px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200 inline-block mt-1">{l.type} Leave</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      {l.from_date} to {l.to_date}
                    </div>
                    <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded-lg italic">"{l.reason}"</p>
                    {isHead && (
                      <div className="flex gap-2 pt-2">
                        {l.status === 'Pending' && (
                          <>
                            <button onClick={() => handleLeaveStatusChange(l.id, 'Approved')} className="flex-1 py-1.5 bg-green-100 text-green-700 hover:bg-green-500/30 text-xs font-bold rounded-lg border border-green-200">Approve</button>
                            <button onClick={() => handleLeaveStatusChange(l.id, 'Rejected')} className="flex-1 py-1.5 bg-red-100 text-red-600 hover:bg-red-500/30 text-xs font-bold rounded-lg border border-red-200">Reject</button>
                          </>
                        )}
                        <button onClick={() => handleDeleteLeave(l.id)} className="px-3 py-1.5 bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No leave requests.</div>}
              </div>
            </div>
          )}

          {/* ── PAYROLL ── */}
          {activeTab === 'salary' && (
            <CDMDataTable
              data={payouts}
              columns={[
                {
                  key: 'month', label: 'Month', sortable: true,
                  render: (val: string) => <span className="font-semibold text-purple-700">{val}</span>
                },
                {
                  key: 'employee_name', label: 'Employee', sortable: true,
                  render: (val: string) => <span className="font-medium text-gray-900">{val}</span>
                },
                {
                  key: 'amount', label: 'Amount', sortable: true,
                  render: (val: number) => <span className="font-bold text-emerald-700">LKR {val.toLocaleString()}</span>
                },
                {
                  key: 'paid_on', label: 'Paid On',
                  render: (val: string) => <span className="text-gray-500">{val || '—'}</span>
                },
              ] as CDMColumn[]}
              actions={[
                {
                  label: 'Payslip', icon: FileText, variant: 'default' as const,
                  onClick: (row: any) => generatePayslipPDF(row)
                },
                ...(isHead ? [{
                  label: 'Delete', icon: Trash2, variant: 'danger' as const,
                  onClick: (row: any) => handleDeletePayout(row.id)
                }] : [])
              ] as CDMAction[]}
              title="Payroll"
              icon={DollarSign}
              searchPlaceholder="Search payroll..."
              exportFileName="Payroll_Export"
              emptyMessage="No payroll records"
              headerActions={isHead ? (
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowPayoutModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold text-sm">
                  <Plus className="w-4 h-4" /> Log Payout
                </motion.button>
              ) : undefined}
            />
          )}

          {/* ── PERFORMANCE ── */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Performance Reviews</h2>
                {isHead && (
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                    <Plus className="w-4 h-4" /> Add Review
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{r.employee_name}</h3>
                        <p className="text-gray-400 text-xs">{r.quarter}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-lg font-black ${r.score >= 80 ? 'bg-green-100 text-green-700' : r.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                        {r.score}/100
                      </div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                      "{r.notes}"
                    </div>
                    {isHead && (
                      <div className="flex justify-end pt-2">
                        <button onClick={() => handleDeleteReview(r.id)} className="text-gray-400 hover:text-red-600 flex items-center gap-1 text-xs"><Trash2 className="w-3 h-3" /> Delete</button>
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No performance reviews yet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="purple" />}
          {activeTab === 'leave-requests' && <LeaveRequestsView />}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
              <p className="text-gray-500 mb-4">Your personal attendance records.</p>
              <StaffAttendance />
            </div>
          )}
          {activeTab === 'profile' && currentUser && (
            <ProfileSection userData={currentUser} />
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
              <IMSTasksPage embedded={true} />
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editingEmp ? 'Edit Staff Details' : 'Add New Staff'}</h2>
                  {editingEmp && <p className="text-sm text-gray-400 mt-0.5">{editingEmp.email}</p>}
                </div>
                <button type="button" onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSaveUser} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
                {/* Personal Info */}
                <div>
                  <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><Users className="w-4 h-4" /> Personal Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Full Name *</label>
                      <input required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: sanitizeName(e.target.value) }))}
                        onBlur={() => handleUserFormBlur("name")}
                        className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.name ? 'border-red-400' : 'border-gray-200'}`} />
                      <FieldError message={userFormErrors.name} />
                    </div>
                    {!editingEmp && (<>
                      <div>
                        <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Email *</label>
                        <input required type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                          onBlur={() => handleUserFormBlur("email")}
                          className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
                        <FieldError message={userFormErrors.email} />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Password *</label>
                        <input required minLength={6} type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                          onBlur={() => handleUserFormBlur("password")}
                          className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.password ? 'border-red-400' : 'border-gray-200'}`} />
                        <FieldError message={userFormErrors.password} />
                      </div>
                    </>)}
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Position</label>
                      <input value={userForm.position} onChange={e => setUserForm(p => ({ ...p, position: e.target.value }))} placeholder="Job title"
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Phone</label>
                      <input value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+94 7X XXX XXXX"
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><Briefcase className="w-4 h-4" /> Employment Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">NIC</label>
                      <input value={userForm.nic} onChange={e => setUserForm(p => ({ ...p, nic: e.target.value }))} placeholder="National ID"
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">EPF Number *</label>
                      <input value={userForm.epf_number} onChange={e => setUserForm(p => ({ ...p, epf_number: e.target.value }))} placeholder="EPF Number"
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Join Date</label>
                      <input type="date" value={userForm.join_date} onChange={e => setUserForm(p => ({ ...p, join_date: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Role</label>
                      <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as UserRole }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                        {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Department</label>
                      <select value={userForm.department} onChange={e => setUserForm(p => ({ ...p, department: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Contract Type</label>
                      <select value={userForm.contract_type} onChange={e => setUserForm(p => ({ ...p, contract_type: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                        {CONTRACT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Monthly Salary (LKR)</label>
                      <input type="number" value={userForm.monthly_salary} onChange={e => setUserForm(p => ({ ...p, monthly_salary: e.target.value }))} placeholder="0.00"
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Status</label>
                      <select value={userForm.employee_status} onChange={e => setUserForm(p => ({ ...p, employee_status: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                        {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold uppercase mb-1">Access Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setUserForm(p => ({ ...p, access_level: 1 }))}
                          className={`px-3 py-2 rounded-xl font-semibold flex justify-center items-center gap-1.5 border transition-all text-sm ${userForm.access_level === 1 ? "bg-blue-500/20 border-blue-500/50 text-blue-600" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                          <User className="w-3.5 h-3.5" /> Staff
                        </button>
                        <button type="button" onClick={() => setUserForm(p => {
                          const newPerms = new Set(p.permissions);
                          let newPosition = p.position;
                          if (['hr_officer', 'admin', 'super_admin', 'branch_manager'].includes(p.role)) {
                            newPerms.add("ims_users" as Permission);
                          }
                          newPerms.add("task_delete" as Permission);
                          if (p.department) newPosition = `Head of ${p.department}`;
                          return { ...p, access_level: 2, permissions: Array.from(newPerms), position: newPosition };
                        })}
                          className={`px-3 py-2 rounded-xl font-semibold flex justify-center items-center gap-1.5 border transition-all text-sm ${userForm.access_level === 2 ? "bg-orange-500/20 border-orange-500/50 text-orange-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                          <span>👑</span> Head
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><ShieldPlus className="w-4 h-4" /> Permissions</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { id: "task_delete", label: "Can Delete Tasks" },
                      { id: "ims_users", label: "Can Add Users" },
                      { id: "ims_roster", label: "Can View All Attendance" },
                      { id: "ims_hr", label: "Can Approve Leaves" },
                      { id: "ims_finance", label: "Can Manage Payroll" },
                      { id: "ims_overview", label: "Can View Reports" },
                    ].map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                        <input type="checkbox"
                          checked={userForm.permissions.includes(perm.id as Permission)}
                          onChange={(e) => {
                            if (e.target.checked) setUserForm(p => ({ ...p, permissions: [...p.permissions, perm.id as Permission] }))
                            else setUserForm(p => ({ ...p, permissions: p.permissions.filter(x => x !== perm.id) }))
                          }}
                          className="rounded bg-gray-100 border-gray-200 text-purple-500 focus:ring-purple-500"
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Shifts & Assets */}
                <div>
                  <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><Clock className="w-4 h-4" /> Shifts & Assets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                      <label className="block text-gray-900 font-bold text-xs uppercase mb-2">Shift Assignment</label>
                      <div className="flex gap-2 mb-2">
                        <input type="time" value={tempShiftTime} onChange={e => setTempShiftTime(e.target.value)}
                          className="flex-1 bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                        <button type="button" onClick={() => {
                          if (tempShiftTime) { setUserForm(p => ({ ...p, work_schedule: [...p.work_schedule, { startTime: tempShiftTime, durationHours: 8 }] })); setTempShiftTime(""); }
                        }} className="px-3 bg-purple-500 text-gray-900 rounded-lg hover:bg-purple-600 text-sm font-bold">Add</button>
                      </div>
                      {userForm.work_schedule.map((shift, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white px-2 py-1 rounded mb-1">
                          <span>{shift.startTime} (8 hrs)</span>
                          <button type="button" onClick={() => setUserForm(p => ({...p, work_schedule: p.work_schedule.filter((_,i)=>i!==idx)}))} className="text-red-600"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                      <label className="block text-gray-900 font-bold text-xs uppercase mb-2">Office Assets</label>
                      <div className="space-y-2 mb-2">
                        <input placeholder="Asset (e.g. Laptop)" value={tempAssetItem} onChange={e => setTempAssetItem(e.target.value)}
                          className="w-full bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                        <div className="flex gap-2">
                          <input placeholder="Serial No." value={tempAssetSerial} onChange={e => setTempAssetSerial(e.target.value)}
                            className="flex-1 bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                          <button type="button" onClick={() => {
                            if (tempAssetItem) { setUserForm(p => ({ ...p, office_assets: [...p.office_assets, { item: tempAssetItem, serialNo: tempAssetSerial, issuedDate: format(new Date(), 'yyyy-MM-dd') }] })); setTempAssetItem(""); setTempAssetSerial(""); }
                          }} className="px-3 bg-purple-500 text-gray-900 rounded-lg hover:bg-purple-600 text-sm font-bold">Add</button>
                        </div>
                      </div>
                      {userForm.office_assets.map((asset, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white px-2 py-1 rounded mb-1">
                          <span>{asset.item} <span className="text-gray-400">({asset.serialNo})</span></span>
                          <button type="button" onClick={() => setUserForm(p => ({...p, office_assets: p.office_assets.filter((_,i)=>i!==idx)}))} className="text-red-600"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attendance Overview (edit mode only) */}
                {editingEmp && (
                  <div>
                    <h3 className="text-purple-600 font-bold text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><Calendar className="w-4 h-4" /> Attendance (Last 30 Days)</h3>
                    {loadingAttendance ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm py-4"><RefreshCw className="h-4 w-4 animate-spin" /> Loading...</div>
                    ) : userAttendance.length === 0 ? (
                      <p className="text-sm text-gray-400 py-3">No attendance records found.</p>
                    ) : (() => {
                      const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().slice(0, 10) })
                      const byDate = userAttendance.reduce((acc, s) => { if (!acc[s.date]) acc[s.date] = []; acc[s.date].push(s); return acc }, {} as Record<string, StaffAttendanceSession[]>)
                      const totalPresent = last30.filter(d => byDate[d]?.length).length
                      const totalHours = userAttendance.reduce((sum, s) => s.time_in && s.time_out ? sum + (new Date(s.time_out).getTime() - new Date(s.time_in).getTime()) / 3600000 : sum, 0)
                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-green-700">{totalPresent}</p>
                              <p className="text-[10px] text-green-600 font-semibold uppercase">Present</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-red-600">{30 - totalPresent}</p>
                              <p className="text-[10px] text-red-500 font-semibold uppercase">Absent</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-blue-700">{totalHours.toFixed(1)}</p>
                              <p className="text-[10px] text-blue-600 font-semibold uppercase">Hours</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                            <div className="flex items-end gap-[3px] h-16">
                              {last30.map(day => {
                                const sessions = byDate[day] || []
                                const hrs = sessions.reduce((s, sess) => sess.time_in && sess.time_out ? s + (new Date(sess.time_out).getTime() - new Date(sess.time_in).getTime()) / 3600000 : s, 0)
                                const pct = Math.min(hrs / 10, 1)
                                const hasLate = sessions.some(s => s.status === 'late')
                                return (
                                  <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    <div className={`w-full rounded-t-sm ${sessions.length === 0 ? 'bg-gray-200' : hasLate ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                      style={{ height: sessions.length === 0 ? '3px' : `${Math.max(pct * 100, 12)}%` }} />
                                    <div className="absolute -top-7 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                      {day.slice(5)} — {hrs.toFixed(1)}h
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex justify-between mt-1 text-[9px] text-gray-400"><span>{last30[0].slice(5)}</span><span>Today</span></div>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" /> On-time</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" /> Late</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-200" /> Absent</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" disabled={creatingUser} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold disabled:opacity-50">
                    {creatingUser ? "Saving..." : editingEmp ? "Update Info" : "Create Staff"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Request Leave</h2>
                <button onClick={() => setShowLeaveModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleLeaveSubmit} className="space-y-3">
                {isHead && (
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Employee Name *</label>
                    <input required value={leaveForm.employee_name} onChange={e => setLeaveForm(p => ({ ...p, employee_name: e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                  </div>
                )}
                {!isHead && (
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Employee Name</label>
                    <input readOnly value={currentUser?.name || ''} 
                      className="w-full bg-white border border-gray-200 text-gray-500 px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 cursor-not-allowed" />
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Leave Type</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['From', 'from_date'], ['To', 'to_date']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-gray-600 text-sm mb-1">{label}</label>
                      <input required type="date" value={(leaveForm as any)[key]} onChange={e => setLeaveForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Reason</label>
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} rows={2}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" onClick={() => !isHead && setLeaveForm(p => ({ ...p, employee_name: currentUser?.name }))}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Record Salary Payout</h2>
                <button onClick={() => setShowPayoutModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handlePayoutSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Employee *</label>
                  <select required value={payoutForm.employee_name} onChange={e => setPayoutForm(p => ({ ...p, employee_name: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.full_name || e.email}>{e.full_name || e.email}</option>)}
                  </select>
                </div>
                {[['Month (YYYY-MM)', 'month', 'month', payoutForm.month], ['Amount (LKR)', 'amount', 'number', payoutForm.amount], ['Paid On', 'paid_on', 'date', payoutForm.paid_on]].map(([label, key, type, val]) => (
                  <div key={key as string}>
                    <label className="block text-gray-600 text-sm mb-1">{label as string}</label>
                    <input type={type as string} value={val as any}
                      onChange={e => setPayoutForm(p => ({ ...p, [key as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Notes</label>
                  <input value={payoutForm.notes} onChange={e => setPayoutForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPayoutModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Add Performance Review</h2>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Employee *</label>
                  <select required value={reviewForm.employee_name} onChange={e => setReviewForm(p => ({ ...p, employee_name: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.full_name || e.email}>{e.full_name || e.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Quarter</label>
                  <input value={reviewForm.quarter} onChange={e => setReviewForm(p => ({ ...p, quarter: e.target.value }))}
                    placeholder="e.g. Q1 2026"
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Score (0–100): {reviewForm.score}</label>
                  <input type="range" min={0} max={100} value={reviewForm.score} onChange={e => setReviewForm(p => ({ ...p, score: Number(e.target.value) }))}
                    className="w-full accent-purple-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Poor</span><span>Excellent</span></div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Notes</label>
                  <textarea value={reviewForm.notes} onChange={e => setReviewForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}



