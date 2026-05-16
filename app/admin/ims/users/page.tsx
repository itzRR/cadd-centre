"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, X, Search, ShieldOff, ShieldCheck,
  Users, RefreshCw, Download, ShieldPlus, Info, Lock,
  Calendar, DollarSign, Briefcase, Phone, CreditCard, UserCheck
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldError } from "@/components/ui/field-error"
import { getAllProfiles, createStaffUser, updateProfileRole, disableUser, getMyAttendance } from "@/lib/ims-data"
import type { StaffAttendanceSession } from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import {
  PERMISSION_DEFS, ROLE_BASE_PERMISSIONS, getExtraPermissions,
  hasPermission
} from "@/lib/permissions"
import { sanitizeName, isValidName, isValidEmail } from "@/lib/validation"
import type { Permission } from "@/lib/permissions"
import type { Profile, UserRole } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"
import * as XLSX from "xlsx"

const IMS_ROLES: UserRole[] = [
  "admin", "super_admin",
  "academic_head", "academic_officer",
  "finance_head", "finance_officer",
  "marketing_head", "marketing_officer",
  "hr_head", "hr_officer",
  "staff", "lecturer",
]
const DEPARTMENTS = ["Academic", "Marketing", "Finance", "HR", "IT", "Operations"]
const CONTRACT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"]
const EMPLOYEE_STATUSES = ["Active", "Inactive", "On Leave", "Terminated"]

const ROLE_COLORS: Record<string, string> = {
  admin:             "bg-red-100 text-red-600 border-red-200",
  super_admin:       "bg-red-100 text-red-600 border-red-200",
  academic_head:     "bg-blue-100 text-blue-700 border-blue-200",
  academic_officer:  "bg-blue-50 text-blue-600 border-blue-200",
  marketing_head:    "bg-pink-100 text-pink-700 border-pink-200",
  marketing_officer: "bg-pink-50 text-pink-600 border-pink-200",
  finance_head:      "bg-green-100 text-green-700 border-green-200",
  finance_officer:   "bg-green-50 text-green-600 border-green-200",
  hr_head:           "bg-orange-100 text-orange-700 border-orange-200",
  hr_officer:        "bg-orange-50 text-orange-600 border-orange-200",
  staff:             "bg-gray-100 text-gray-600 border-gray-300",
  student:           "bg-cyan-100 text-cyan-700 border-cyan-200",
  lecturer:          "bg-yellow-100 text-yellow-700 border-yellow-200",
}

// ── Permission Checkbox Grid ─────────────────────────────────

interface PermissionGridProps {
  role: UserRole
  grantedPermissions: Permission[]
  onChange: (perms: Permission[]) => void
  readOnly?: boolean
}

function PermissionGrid({ role, grantedPermissions, onChange, readOnly }: PermissionGridProps) {
  const basePerms = ROLE_BASE_PERMISSIONS[role] || []
  const groups = ['IMS', 'ASMS', 'Tasks'] as const

  const togglePerm = (key: Permission) => {
    if (readOnly) return
    if (grantedPermissions.includes(key)) {
      onChange(grantedPermissions.filter(p => p !== key))
    } else {
      onChange([...grantedPermissions, key])
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(group => {
        let items = PERMISSION_DEFS.filter(d => d.group === group)
        
        // Hide cross-department and advanced permissions for non-admin roles
        if (!['admin', 'super_admin'].includes(role)) {
          let hidePerms = ['ims_overview', 'ims_marketing', 'ims_academic', 'ims_finance', 'ims_hr', 'ims_control_panel', 'asms_full', 'ims_users']
          
          if (role === 'hr_officer') hidePerms = hidePerms.filter(p => p !== 'ims_users')
          // Remove the academic_manager special case — no longer exists
            
          items = items.filter(d => !hidePerms.includes(d.key))
        }
        
        // Don't render empty groups
        if (items.length === 0) return null

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group}</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {items.map(def => {
                const isBase = basePerms.includes(def.key)
                const isGranted = isBase || grantedPermissions.includes(def.key)
                const isExtra = !isBase && grantedPermissions.includes(def.key)

                return (
                  <motion.label
                    key={def.key}
                    whileHover={!isBase ? { scale: 1.01, x: 4 } : {}}
                    whileTap={!isBase ? { scale: 0.99 } : {}}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      isBase
                        ? 'bg-blue-500/10 border-blue-500/20 opacity-80 cursor-default'
                        : isExtra
                          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          : 'bg-gray-200 border-gray-100 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => !isBase && togglePerm(def.key)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isBase ? (
                        <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Lock className="h-3 w-3 text-gray-900" />
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${
                          isGranted
                            ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                            : 'border-gray-200 bg-gray-100'
                        }`}>
                          {isGranted && (
                            <motion.svg initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold transition-colors ${isGranted ? 'text-gray-900' : 'text-gray-600'}`}>{def.label}</span>
                        {isBase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-600 font-bold border border-blue-500/20 uppercase tracking-tighter">
                            Default
                          </span>
                        )}
                        {isExtra && (
                          <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/20 uppercase tracking-tighter">
                            Granted
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{def.description}</p>
                    </div>
                  </motion.label>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <strong className="text-blue-600">Blue/Lock</strong> permissions are fixed for this role. 
          <br />
          <strong className="text-emerald-700">Emerald</strong> permissions are custom overrides granted to this specific user.
        </p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────

export default function IMSUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterDept, setFilterDept] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const emptyForm = {
    email: "", password: "", name: "",
    role: "staff" as UserRole,
    position: "", department: "", access_level: 1,
    permissions: [] as Permission[],
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
    phone: "", nic: "", join_date: "",
    contract_type: "Full-time", monthly_salary: "" as string,
    employee_status: "Active",
  }
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createTouched, setCreateTouched] = useState<Record<string, boolean>>({})

  const [tempShiftTime, setTempShiftTime] = useState("")
  const [tempAssetItem, setTempAssetItem] = useState("")
  const [tempAssetSerial, setTempAssetSerial] = useState("")

  // Edit role modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({
    role: "staff" as UserRole,
    full_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    access_level: 1,
    task_delete_permission: false,
    permissions: [] as Permission[],
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
    nic: "",
    join_date: "",
    contract_type: "Full-time",
    monthly_salary: "" as string,
    employee_status: "Active",
  })
  const [userAttendance, setUserAttendance] = useState<StaffAttendanceSession[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, u] = await Promise.all([getAllProfiles(), getCurrentUser()])
      setProfiles(p); setCurrentUser(u)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.role === "hr_officer" || currentUser?.permissions?.includes("ims_users")
  const canGrantPermissions = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  // Create form validation errors
  const createErrors: Record<string, string> = {}
  if (createTouched.name && !createForm.name.trim()) {
    createErrors.name = "Name is required"
  } else if (createTouched.name && createForm.name.trim() && !isValidName(createForm.name)) {
    createErrors.name = "Name can only contain letters, spaces, and hyphens"
  }
  if (createTouched.email && !createForm.email.trim()) {
    createErrors.email = "Email is required"
  } else if (createTouched.email && createForm.email.trim() && !isValidEmail(createForm.email)) {
    createErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (createTouched.password && createForm.password && createForm.password.length < 6) {
    createErrors.password = "Password must be at least 6 characters"
  }

  const handleCreateBlur = (field: string) => setCreateTouched(prev => ({ ...prev, [field]: true }))

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setCreateTouched({ name: true, email: true, password: true })
    if (!createForm.name.trim() || !isValidName(createForm.name))
      return toast.error("Please enter a valid name (letters only)")
    if (!createForm.email.trim() || !isValidEmail(createForm.email))
      return toast.error("Please enter a valid email address")
    if (!createForm.password || createForm.password.length < 6)
      return toast.error("Password must be at least 6 characters")
    setCreating(true)
    try {
      await createStaffUser({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        role: createForm.role,
        position: createForm.position,
        department: createForm.department || undefined,
        access_level: createForm.access_level,
        work_schedule: createForm.work_schedule,
        office_assets: createForm.office_assets,
        phone: createForm.phone || undefined,
        nic: createForm.nic || undefined,
        join_date: createForm.join_date || undefined,
        contract_type: createForm.contract_type || 'Full-time',
        monthly_salary: createForm.monthly_salary ? parseFloat(createForm.monthly_salary) : undefined,
        employee_status: createForm.employee_status || 'Active',
      })
      // After creation, update permissions if any extras were set
      toast.success("User created - they can now log in with their credentials")
      setShowCreateModal(false); setCreateForm(emptyForm); setCreateTouched({})
      await loadData()
    } catch (e: any) { toast.error(e.message) }
    finally { setCreating(false) }
  }

  const openEditModal = (p: Profile) => {
    setEditingProfile(p)
    // Only store the EXTRA permissions (not the base role ones) in UI state
    const extras = getExtraPermissions(p.role, (p.permissions as Permission[]) || [])
    setEditForm({
      role: p.role,
      full_name: p.full_name || "",
      email: p.email || "",
      phone: p.phone || "",
      position: p.position || "",
      department: p.department || "",
      access_level: p.access_level || 1,
      task_delete_permission: p.task_delete_permission || false,
      permissions: extras,
      work_schedule: p.work_schedule || [],
      office_assets: p.office_assets || [],
      nic: p.nic || "",
      join_date: p.join_date || "",
      contract_type: p.contract_type || "Full-time",
      monthly_salary: p.monthly_salary != null ? String(p.monthly_salary) : "",
      employee_status: p.employee_status || "Active",
    })
    setShowEditModal(true)
    // Load attendance data for this user
    setLoadingAttendance(true)
    getMyAttendance(p.id, 60).then(data => setUserAttendance(data)).catch(() => setUserAttendance([])).finally(() => setLoadingAttendance(false))
  }

  const handleEditSave = async () => {
    if (!editingProfile) return
    try {
      // Sync task_delete_permission with the task_delete permission key
      const hasTaskDelete = editForm.permissions.includes('task_delete') || editForm.task_delete_permission
      const finalPerms = hasTaskDelete
        ? Array.from(new Set([...editForm.permissions, 'task_delete' as Permission]))
        : editForm.permissions.filter(p => p !== 'task_delete')

      const updated = await updateProfileRole(editingProfile.id, {
        role: editForm.role,
        full_name: editForm.full_name,
        phone: editForm.phone,
        position: editForm.position,
        department: editForm.department,
        access_level: editForm.access_level,
        task_delete_permission: hasTaskDelete,
        permissions: finalPerms,
        work_schedule: editForm.work_schedule,
        office_assets: editForm.office_assets,
        nic: editForm.nic,
        join_date: editForm.join_date || undefined,
        contract_type: editForm.contract_type,
        monthly_salary: editForm.monthly_salary ? parseFloat(editForm.monthly_salary) : undefined,
        employee_status: editForm.employee_status,
      })
      setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, ...updated } : p))
      toast.success("Profile updated successfully")
      setShowEditModal(false); setEditingProfile(null)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleToggleDisable = async (p: Profile) => {
    if (!isAdmin) return toast.error("Only admins can disable accounts")
    if (p.id === currentUser?.id) return toast.error("You cannot disable your own account")
    if (!(await confirmDialog(`${p.disabled ? "Enable" : "Disable"} ${p.full_name}?`))) return
    try {
      await disableUser(p.id, !p.disabled)
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, disabled: !p.disabled } : x))
      toast.success(`Account ${p.disabled ? "enabled" : "disabled"}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const exportUsers = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProfiles.map(p => ({
      Name: p.full_name, Email: p.email, Role: p.role,
      Position: p.position, Department: p.department,
      AccessLevel: p.access_level,
      ExtraPermissions: ((p.permissions as Permission[]) || []).join(', '),
      Status: p.disabled ? "Disabled" : "Active",
      Joined: p.created_at ? format(new Date(p.created_at), "yyyy-MM-dd") : "-",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Users")
    XLSX.writeFile(wb, `users_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  // Exclude students — they belong in Academic → Students
  const staffProfiles = profiles.filter(p => p.role !== 'student')

  const filteredProfiles = staffProfiles.filter(p => {
    const matchSearch = !search ||
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.department || "").toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === "all" || p.role === filterRole ||
      (filterRole === "admin" && ["admin", "super_admin"].includes(p.role))
    const matchDept = filterDept === "all" || p.department === filterDept
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && !p.disabled) ||
      (filterStatus === "disabled" && p.disabled) ||
      (filterStatus === "online" && p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 5 * 60 * 1000)
    return matchSearch && matchRole && matchDept && matchStatus
  })

  const isOnline = (p: Profile) => p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 5 * 60 * 1000

  const roleGroups = IMS_ROLES.reduce((acc, r) => {
    acc[r] = staffProfiles.filter(p => p.role === r).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-700" /> Staff Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage accounts, roles and individual access permissions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl border border-gray-200 transition-colors" onClick={loadData}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl border border-gray-200 transition-colors" onClick={exportUsers}><Download className="h-4 w-4" /> Export</button>
          {isAdmin && (
            <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-gray-900 font-bold rounded-xl shadow-lg transition-all" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" /> Add New Staff
            </button>
          )}
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { role: "all",             label: "All Users", count: staffProfiles.length },
          { role: "admin",           label: "Admins",    count: (roleGroups["admin"] || 0) + (roleGroups["super_admin"] || 0) },
          { role: "academic_head",   label: "Academic",  count: (roleGroups["academic_head"] || 0) + (roleGroups["academic_officer"] || 0) },
          { role: "marketing_head",  label: "Marketing", count: (roleGroups["marketing_head"] || 0) + (roleGroups["marketing_officer"] || 0) },
          { role: "finance_head",    label: "Finance",   count: (roleGroups["finance_head"] || 0) + (roleGroups["finance_officer"] || 0) },
          { role: "hr_head",         label: "HR",        count: (roleGroups["hr_head"] || 0) + (roleGroups["hr_officer"] || 0) },
        ].map(g => (
          <div key={g.role} onClick={() => setFilterRole(g.role)}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${filterRole === g.role ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-100 border-gray-200 hover:border-white/30 hover:bg-gray-100'}`}>
            <p className="text-xs text-gray-600 mb-1">{g.label}</p>
            <p className={`text-2xl font-black ${filterRole === g.role ? 'text-cyan-700' : 'text-gray-900'}`}>{g.count}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-cyan-500">
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-cyan-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="online">Online Now</option>
            </select>
            {(filterDept !== "all" || filterStatus !== "all" || filterRole !== "all" || search) && (
              <button onClick={() => { setFilterDept("all"); setFilterStatus("all"); setFilterRole("all"); setSearch("") }}
                className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold px-2 py-1 hover:bg-cyan-50 rounded-lg transition-colors">
                Clear all filters
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filteredProfiles.length} of {profiles.length} users</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role & Access</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map(p => {
                  const extrasCount = getExtraPermissions(p.role, (p.permissions as Permission[]) || []).length
                  return (
                    <tr key={p.id} className={`hover:bg-gray-100 transition-colors ${p.disabled ? 'opacity-60 bg-red-900/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-gray-900 font-bold shadow-lg overflow-hidden">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                p.full_name?.charAt(0) || p.email.charAt(0).toUpperCase()
                              )}
                            </div>
                            {isOnline(p) ? (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white" />
                              </span>
                            ) : (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gray-300 border-2 border-white" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.full_name || '-'}</p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${ROLE_COLORS[p.role] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                            {p.role.replace(/_/g, ' ')}
                          </span>
                          {extrasCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                              <ShieldPlus className="h-3 w-3" /> +{extrasCount} custom perms
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.department ? (
                          <span className="text-gray-600">{p.department}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                        {p.position && <p className="text-xs text-gray-400 mt-0.5">{p.position}</p>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.disabled ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {p.disabled ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {p.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(p)} className="p-2 bg-gray-100 hover:bg-blue-500/20 text-gray-600 hover:text-blue-600 rounded-lg transition-colors" title="Edit user">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleDisable(p)} className={`p-2 rounded-lg transition-colors ${p.disabled ? 'bg-green-500/10 text-green-700 hover:bg-green-100' : 'bg-red-500/10 text-red-600 hover:bg-red-100'}`} title={p.disabled ? "Enable user" : "Disable user"}>
                              {p.disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE USER MODAL ─────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 w-full max-w-4xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Staff User</h2>
                <p className="text-gray-500 text-sm mt-1">Set up credentials, role, and HR details for the new employee.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
              {/* Account Credentials */}
              <div>
                <h3 className="text-sm font-bold text-cyan-700 mb-4 uppercase tracking-wider flex items-center gap-2"><Lock className="h-4 w-4" /> Account Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Full Name *</label>
                    <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: sanitizeName(e.target.value) }))} onBlur={() => handleCreateBlur("name")} placeholder="Letters only" required
                      className={`w-full bg-gray-100 border rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${createErrors.name ? 'border-red-400' : 'border-gray-200'}`} />
                    <FieldError message={createErrors.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Email *</label>
                    <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} onBlur={() => handleCreateBlur("email")} placeholder="john@example.com" required
                      className={`w-full bg-gray-100 border rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${createErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
                    <FieldError message={createErrors.email} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Password *</label>
                    <input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} onBlur={() => handleCreateBlur("password")} placeholder="Min 6 characters" required autoComplete="new-password"
                      className={`w-full bg-gray-100 border rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${createErrors.password ? 'border-red-400' : 'border-gray-200'}`} />
                    <FieldError message={createErrors.password} />
                  </div>
                </div>
              </div>

              {/* Role & Position */}
              <div>
                <h3 className="text-sm font-bold text-cyan-700 mb-4 uppercase tracking-wider flex items-center gap-2"><Briefcase className="h-4 w-4" /> Role & Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">System Role *</label>
                    <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value as UserRole }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      {IMS_ROLES.map(r => <option key={r} value={r} className="bg-white text-gray-900">{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Job Title</label>
                    <input value={createForm.position} onChange={e => setCreateForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Senior Instructor"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Department</label>
                    <select value={createForm.department} onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      <option value="" className="bg-white text-gray-900">Select Department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-white text-gray-900">{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* HR Details */}
              <div>
                <h3 className="text-sm font-bold text-cyan-700 mb-4 uppercase tracking-wider flex items-center gap-2"><UserCheck className="h-4 w-4" /> HR Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Phone</label>
                    <input value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} placeholder="+94 7X XXX XXXX"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">NIC</label>
                    <input value={createForm.nic} onChange={e => setCreateForm(p => ({ ...p, nic: e.target.value }))} placeholder="National ID Card"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Join Date</label>
                    <input type="date" value={createForm.join_date} onChange={e => setCreateForm(p => ({ ...p, join_date: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Contract Type</label>
                    <select value={createForm.contract_type} onChange={e => setCreateForm(p => ({ ...p, contract_type: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      {CONTRACT_TYPES.map(ct => <option key={ct} value={ct} className="bg-white text-gray-900">{ct}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Monthly Salary (LKR)</label>
                    <input type="number" value={createForm.monthly_salary} onChange={e => setCreateForm(p => ({ ...p, monthly_salary: e.target.value }))} placeholder="0.00"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <select value={createForm.employee_status} onChange={e => setCreateForm(p => ({ ...p, employee_status: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      {EMPLOYEE_STATUSES.map(s => <option key={s} value={s} className="bg-white text-gray-900">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={creating} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-gray-900 rounded-xl shadow-lg font-bold disabled:opacity-50">
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT HR DETAILS MODAL ─────────────── */}
      {showEditModal && editingProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-[2rem] w-full max-w-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-[2rem]">
              <div>
                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-cyan-700" />
                  Edit Details
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{editingProfile.email}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Personal Info */}
              <div>
                <h3 className="text-xs font-bold text-cyan-700 mb-3 uppercase tracking-wider flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Personal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Name *</label>
                    <input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Position</label>
                    <input value={editForm.position} onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))} placeholder="Job title..."
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+94 7X XXX XXXX"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-xs font-bold text-cyan-700 mb-3 uppercase tracking-wider flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">NIC</label>
                    <input value={editForm.nic} onChange={e => setEditForm(p => ({ ...p, nic: e.target.value }))} placeholder="National ID"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Join Date</label>
                    <input type="date" value={editForm.join_date} onChange={e => setEditForm(p => ({ ...p, join_date: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Department</label>
                    <select value={editForm.department || "none"} onChange={e => setEditForm(p => ({ ...p, department: e.target.value === "none" ? "" : e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500">
                      <option value="none">None</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Contract Type</label>
                    <select value={editForm.contract_type} onChange={e => setEditForm(p => ({ ...p, contract_type: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500">
                      {CONTRACT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Monthly Salary (LKR)</label>
                    <input type="number" value={editForm.monthly_salary} onChange={e => setEditForm(p => ({ ...p, monthly_salary: e.target.value }))} placeholder="0.00"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</label>
                    <select value={editForm.employee_status} onChange={e => setEditForm(p => ({ ...p, employee_status: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500">
                      {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Role & Access */}
              <div>
                <h3 className="text-xs font-bold text-cyan-700 mb-3 uppercase tracking-wider flex items-center gap-2"><ShieldPlus className="h-3.5 w-3.5" /> Role & Access</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">System Role</label>
                    <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as UserRole, permissions: [] }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500">
                      {IMS_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Access Level</label>
                    <div className="flex gap-2">
                      {[{v:1,label:"Standard"},{v:2,label:"Head"}].map(lvl => (
                        <button key={lvl.v} type="button" onClick={() => {
                          setEditForm(p => {
                            const newPerms = new Set(p.permissions);
                            let newPosition = p.position;
                            if (lvl.v === 2) {
                              newPerms.add("task_delete" as Permission);
                              if (['hr_officer', 'admin', 'super_admin', 'branch_manager'].includes(p.role)) {
                                newPerms.add("ims_users" as Permission);
                              }
                              if (p.department) newPosition = `Head of ${p.department}`;
                            }
                            return { ...p, access_level: lvl.v, permissions: Array.from(newPerms), position: newPosition };
                          });
                        }}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${editForm.access_level === lvl.v ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permission Grid */}
              <div>
                <h3 className="text-xs font-bold text-cyan-700 mb-4 uppercase tracking-wider">Granular Permissions</h3>
                {!canGrantPermissions ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 p-4 rounded-xl text-sm font-medium">
                    You do not have sufficient privileges to modify granular permissions.
                  </div>
                ) : (
                  <div className="bg-gray-200 border border-gray-200 rounded-2xl p-4">
                    <PermissionGrid
                      role={editForm.role}
                      grantedPermissions={editForm.permissions}
                      onChange={p => setEditForm(prev => ({ ...prev, permissions: p }))}
                    />
                  </div>
                )}
              </div>

              {/* Active permissions summary */}
              {editForm.permissions.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2">Extra permissions being granted:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.permissions.map(key => (
                      <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-medium">
                        {PERMISSION_DEFS.find(d => d.key === key)?.label || key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Schedule */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Work Schedule (Shifts)</label>
                <div className="flex gap-2">
                  <input type="time" value={tempShiftTime} onChange={e => setTempShiftTime(e.target.value)}
                    className="flex-1 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
                  <button type="button" onClick={() => { if (tempShiftTime) { setEditForm(p => ({ ...p, work_schedule: [...p.work_schedule, { startTime: tempShiftTime, durationHours: 8 }] })); setTempShiftTime(''); }}}
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 border border-cyan-500/30 rounded-xl text-sm font-bold transition-all">
                    Add
                  </button>
                </div>
                {editForm.work_schedule.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.work_schedule.map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600">
                        ⏰ {shift.startTime}
                        <button type="button" onClick={() => setEditForm(p => ({ ...p, work_schedule: p.work_schedule.filter((_, i) => i !== idx) }))}
                          className="text-red-600 hover:text-red-300 ml-1"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Office Assets */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Office Assets</label>
                <div className="flex gap-2">
                  <input placeholder="Asset (e.g. Laptop)" value={tempAssetItem} onChange={e => setTempAssetItem(e.target.value)}
                    className="flex-1 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-all" />
                  <input placeholder="Serial" value={tempAssetSerial} onChange={e => setTempAssetSerial(e.target.value)}
                    className="w-24 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-all" />
                  <button type="button" onClick={() => { if (tempAssetItem) { setEditForm(p => ({ ...p, office_assets: [...p.office_assets, { item: tempAssetItem, serialNo: tempAssetSerial, issuedDate: new Date().toISOString() }] })); setTempAssetItem(''); setTempAssetSerial(''); }}}
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 border border-cyan-500/30 rounded-xl text-sm font-bold transition-all">
                    Add
                  </button>
                </div>
                {editForm.office_assets.length > 0 && (
                  <div className="space-y-2">
                    {editForm.office_assets.map((asset, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-200 border border-gray-200 px-4 py-2.5 rounded-xl text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">{asset.item}</span>
                          {asset.serialNo && <span className="text-gray-400 ml-2 text-xs">SN: {asset.serialNo}</span>}
                        </div>
                        <button type="button" onClick={() => setEditForm(p => ({ ...p, office_assets: p.office_assets.filter((_, i) => i !== idx) }))} className="text-red-600 hover:text-red-300">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance Overview */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Attendance Overview (Last 30 Days)</h3>
                {loadingAttendance ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-4"><RefreshCw className="h-4 w-4 animate-spin" /> Loading...</div>
                ) : userAttendance.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">No attendance records found.</p>
                ) : (() => {
                  const last30 = Array.from({ length: 30 }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (29 - i))
                    return d.toISOString().slice(0, 10)
                  })
                  const byDate = userAttendance.reduce((acc, s) => {
                    if (!acc[s.date]) acc[s.date] = []
                    acc[s.date].push(s)
                    return acc
                  }, {} as Record<string, StaffAttendanceSession[]>)
                  const totalPresent = last30.filter(d => byDate[d]?.length).length
                  const totalLate = last30.filter(d => byDate[d]?.some(s => s.status === 'late')).length
                  const totalHours = userAttendance.reduce((sum, s) => {
                    if (s.time_in && s.time_out) {
                      return sum + (new Date(s.time_out).getTime() - new Date(s.time_in).getTime()) / 3600000
                    }
                    return sum
                  }, 0)
                  return (
                    <div className="space-y-4">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                          <p className="text-lg font-black text-green-700">{totalPresent}</p>
                          <p className="text-[10px] text-green-600 font-semibold uppercase">Days Present</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                          <p className="text-lg font-black text-amber-700">{totalLate}</p>
                          <p className="text-[10px] text-amber-600 font-semibold uppercase">Late Days</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                          <p className="text-lg font-black text-blue-700">{totalHours.toFixed(1)}</p>
                          <p className="text-[10px] text-blue-600 font-semibold uppercase">Total Hours</p>
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-end gap-[3px] h-20">
                          {last30.map(day => {
                            const sessions = byDate[day] || []
                            const hrs = sessions.reduce((s, sess) => {
                              if (sess.time_in && sess.time_out) return s + (new Date(sess.time_out).getTime() - new Date(sess.time_in).getTime()) / 3600000
                              return s
                            }, 0)
                            const pct = Math.min(hrs / 10, 1)
                            const hasLate = sessions.some(s => s.status === 'late')
                            const isToday = day === new Date().toISOString().slice(0, 10)
                            return (
                              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <div className={`w-full rounded-t-sm transition-all ${sessions.length === 0 ? 'bg-gray-200' : hasLate ? 'bg-amber-400' : 'bg-emerald-400'} ${isToday ? 'ring-1 ring-cyan-400' : ''}`}
                                  style={{ height: sessions.length === 0 ? '4px' : `${Math.max(pct * 100, 12)}%` }} />
                                <div className="absolute -top-8 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                  {day.slice(5)} — {hrs.toFixed(1)}h
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                          <span>{last30[0].slice(5)}</span>
                          <span>Today</span>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> On-time</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Late</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> Absent</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleEditSave} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 rounded-xl font-bold shadow-lg transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



