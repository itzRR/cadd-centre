"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  Terminal, Send, LogOut, Bell, Users, Shield,
  Clock, AlertTriangle, X, RefreshCw, Activity, Zap
} from "lucide-react"
import {
  getAllProfiles, getSystemCommands, createSystemCommand,
  updateSystemCommandStatus, disableUser, getLoginHistory,
} from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import type { Profile, ImsSystemCommand, ImsLoginHistory } from "@/types"

type CmdType = "force_logout" | "popup" | "broadcast" | "disable_user"

const CMD_META: Record<CmdType, { icon: React.ReactNode; label: string; color: string }> = {
  force_logout:  { icon: <LogOut className="h-4 w-4" />,  label: "Force Logout",    color: "text-red-600" },
  popup:         { icon: <Bell className="h-4 w-4" />,     label: "Popup Alert",     color: "text-yellow-600" },
  broadcast:     { icon: <Send className="h-4 w-4" />,     label: "Broadcast",       color: "text-blue-600" },
  disable_user:  { icon: <Shield className="h-4 w-4" />,   label: "Disable Account", color: "text-orange-600" },
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
}

export default function IMSControlPanelPage() {
  const [users, setUsers]         = useState<Profile[]>([])
  const [commands, setCommands]   = useState<ImsSystemCommand[]>([])
  const [loginLogs, setLoginLogs] = useState<ImsLoginHistory[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<"commands" | "login_history" | "active_users">("commands")
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [cmdType, setCmdType]       = useState<CmdType>("broadcast")
  const [cmdTarget, setCmdTarget]   = useState<string>("all")
  const [cmdMessage, setCmdMessage] = useState("")
  const [sending, setSending]       = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [u, c, l, cu] = await Promise.all([
        getAllProfiles(), getSystemCommands(), getLoginHistory(), getCurrentUser(),
      ])
      setUsers(u.filter((p: Profile) => p.role !== "student" && !p.disabled))
      setCommands(c)
      setLoginLogs(l)
      setCurrentUser(cu)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const isSuperAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  const handleSendCommand = async () => {
    if (!cmdMessage.trim() && cmdType !== "force_logout" && cmdType !== "disable_user") {
      return toast.error("Message required for this command type")
    }
    if ((cmdType === "force_logout" || cmdType === "disable_user") && cmdTarget === "all") {
      return toast.error(`Cannot ${cmdType.replace("_"," ")} all users at once`)
    }
    setSending(true)
    try {
      let finalTargetId = null;
      let finalTargetName = null;
      let targetProfile = null;

      if (cmdTarget === "all") {
        finalTargetName = "All Users";
      } else if (cmdTarget.startsWith("dept:")) {
        finalTargetId = cmdTarget;
        finalTargetName = `Dept: ${cmdTarget.replace("dept:", "")}`;
      } else {
        targetProfile = users.find(u => u.id === cmdTarget);
        finalTargetId = targetProfile?.id || null;
        finalTargetName = targetProfile?.full_name || null;
      }

      const cmd = await createSystemCommand({
        type: cmdType,
        message: cmdMessage || null,
        target_user_id: finalTargetId,
        target_user_name: finalTargetName,
        sent_by_id: currentUser?.id,
        sent_by_name: currentUser?.name,
        status: "pending",
      })
      setCommands(prev => [cmd, ...prev])
      if (cmdType === "disable_user" && targetProfile) {
        await disableUser(targetProfile.id, true)
        setUsers(prev => prev.filter(u => u.id !== targetProfile.id))
        toast.success(`${targetProfile.full_name} has been disabled`)
      } else {
        toast.success("Command sent successfully")
      }
      setCmdMessage(""); setCmdTarget("all")
    } catch (e: any) { toast.error(e.message) }
    finally { setSending(false) }
  }

  const handleCancelCommand = async (id: string) => {
    try {
      await updateSystemCommandStatus(id, "cancelled")
      setCommands(prev => prev.map(c => c.id === id ? { ...c, status: "cancelled" } : c))
      toast.success("Command cancelled")
    } catch (e: any) { toast.error(e.message) }
  }

  const recentLogins = loginLogs.slice(0, 50)
  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"

  const tabs = [
    { id: "commands" as const,      label: "Commands",      icon: <Zap className="h-4 w-4" /> },
    { id: "login_history" as const, label: "Login History", icon: <Activity className="h-4 w-4" /> },
    { id: "active_users" as const,  label: "Active Staff",  icon: <Users className="h-4 w-4" /> },
  ]

  const uniqueDepartments = Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6 text-gray-900">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            System Control Panel
          </h1>
          <p className="text-sm text-gray-500 mt-1">Admin-only commands, login history &amp; system audit</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors text-sm font-medium shadow-sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Access warning */}
      {!isSuperAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-700">Restricted Access</p>
            <p className="text-sm text-red-500">This panel is restricted to Super Admin and Admin roles only. You can view data but cannot send commands.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Staff",   value: users.length,                                        icon: Users,    color: "text-blue-600",   bg: "bg-blue-50 border-blue-100" },
          { label: "Commands Sent",  value: commands.length,                                     icon: Terminal, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
          { label: "Active Commands",value: commands.filter(c => c.status === "pending").length, icon: Clock,    color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" },
          { label: "Login Events",   value: loginLogs.length,                                    icon: Shield,   color: "text-green-600",  bg: "bg-green-50 border-green-100" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color} opacity-70`} />
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{loading ? "…" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* COMMANDS TAB */}
      {activeTab === "commands" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Command */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Send System Command</h3>
            </div>

            {!isSuperAdmin && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 font-medium">
                Read-only: You don&apos;t have permission to send commands.
              </div>
            )}

            {/* Command Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">Command Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(CMD_META) as [CmdType, typeof CMD_META[CmdType]][]).map(([key, meta]) => (
                  <button key={key} type="button" onClick={() => {
                    setCmdType(key)
                    // force_logout and disable_user cannot target 'all', reset to first user
                    if (key === "force_logout" || key === "disable_user") {
                      setCmdTarget(users[0]?.id || "")
                    } else if (key === "broadcast") {
                      setCmdTarget("all")
                    }
                  }} disabled={!isSuperAdmin}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 ${
                      cmdType === key
                        ? `bg-red-50 border-red-300 ${meta.color}`
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                    }`}>
                    <span className={cmdType === key ? meta.color : "text-gray-400"}>{meta.icon}</span>
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">
                {cmdType === "force_logout" || cmdType === "disable_user" ? "Target User (required)" : "Target User / Group"}
              </label>
              <select value={cmdTarget} onChange={e => setCmdTarget(e.target.value)} disabled={!isSuperAdmin}
                className={inputCls + " disabled:opacity-50"}>

                {/* Only show 'All Users' for broadcast */}
                {cmdType === "broadcast" && <option value="all">🌐 All Users</option>}

                {/* Department targeting for popup/broadcast only */}
                {(cmdType === "popup" || cmdType === "broadcast") && uniqueDepartments.length > 0 && (
                  <optgroup label="By Department">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={`dept:${dept}`}>🏢 Department: {dept}</option>
                    ))}
                  </optgroup>
                )}

                {/* Specific users always available */}
                <optgroup label={cmdType === "force_logout" || cmdType === "disable_user" ? "Select a User" : "Specific User"}>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role.replace(/_/g, " ")})
                    </option>
                  ))}
                </optgroup>
              </select>
              {(cmdType === "force_logout" || cmdType === "disable_user") && (
                <p className="text-xs text-orange-500 font-medium">⚠ Must target a specific user - cannot apply to all at once.</p>
              )}
            </div>

            {/* Message */}
            {cmdType !== "force_logout" && cmdType !== "disable_user" && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Message</label>
                <textarea rows={3} disabled={!isSuperAdmin}
                  placeholder={cmdType === "broadcast" ? "Message to broadcast to all staff…" : "Message for popup alert…"}
                  value={cmdMessage} onChange={e => setCmdMessage(e.target.value)}
                  className={inputCls + " resize-none disabled:opacity-50"} />
              </div>
            )}

            {/* Warning */}
            <div className={`rounded-xl p-4 text-sm font-medium ${
              cmdType === "force_logout" || cmdType === "disable_user"
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-blue-50 border border-blue-200 text-blue-700"
            }`}>
              {cmdType === "force_logout" && "⚠️ This will immediately end the selected user's session."}
              {cmdType === "disable_user" && "⚠️ This will permanently disable the account until re-enabled."}
              {cmdType === "popup" && "ℹ️ This will display an alert popup to the selected user."}
              {cmdType === "broadcast" && "📢 This will send a message visible to all active staff members."}
            </div>

            <button onClick={handleSendCommand} disabled={sending || !isSuperAdmin}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? "Sending…" : "Send Command"}
            </button>
          </div>

          {/* Command History */}
          <div className="space-y-6">
            {/* Active Commands */}
            {commands.filter(c => c.status === "pending").length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="h-24 w-24 text-red-600" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-black text-red-900">Active System Commands</h3>
                  </div>
                  <div className="space-y-3">
                    {commands.filter(c => c.status === "pending").map(cmd => (
                      <div key={cmd.id} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-red-200 shadow-sm">
                        <div className={`mt-0.5 flex-shrink-0 ${CMD_META[cmd.type]?.color || "text-gray-400"}`}>
                          {CMD_META[cmd.type]?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-gray-800">{CMD_META[cmd.type]?.label}</span>
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border bg-yellow-100 text-yellow-700 border-yellow-200">
                              Active / Pending
                            </span>
                          </div>
                          {cmd.message && <p className="text-sm font-medium text-gray-800 mb-1">&ldquo;{cmd.message}&rdquo;</p>}
                          <p className="text-[10px] text-gray-500">
                            Target: <span className="font-bold">{cmd.target_user_name || "All Users"}</span> · Sent: {format(new Date(cmd.sent_at), "HH:mm")}
                          </p>
                        </div>
                        {isSuperAdmin && (
                          <button onClick={() => handleCancelCommand(cmd.id)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-all flex-shrink-0 border border-red-200">
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Past History */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900">Past Command History</h3>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {commands.filter(c => c.status !== "pending").length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Terminal className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No past commands</p>
                  </div>
                ) : commands.filter(c => c.status !== "pending").slice(0, 5).map(cmd => (
                  <div key={cmd.id} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 opacity-75">
                    <div className={`mt-0.5 flex-shrink-0 ${CMD_META[cmd.type]?.color || "text-gray-400"}`}>
                      {CMD_META[cmd.type]?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-gray-800">{CMD_META[cmd.type]?.label}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[cmd.status] || STATUS_COLORS.cancelled}`}>
                          {cmd.status}
                        </span>
                      </div>
                      {cmd.message && <p className="text-xs text-gray-500 truncate mb-1">&ldquo;{cmd.message}&rdquo;</p>}
                      <p className="text-[10px] text-gray-400">
                        → {cmd.target_user_name || "All"} · by {cmd.sent_by_name} · {format(new Date(cmd.sent_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN HISTORY TAB */}
      {activeTab === "login_history" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" /> Recent Login Events
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  {["User", "Email", "Login Time", "IP Address", "Device"].map(h => (
                    <th key={h} className="text-left py-4 px-6 font-semibold border-b border-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading…</td></tr>
                ) : recentLogins.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No login history found</td></tr>
                ) : recentLogins.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">{log.user_name || "-"}</td>
                    <td className="py-4 px-6 text-gray-500 text-xs">{log.email || "-"}</td>
                    <td className="py-4 px-6 text-gray-600 text-xs">
                      {log.login_time ? format(new Date(log.login_time), "MMM d yyyy, HH:mm:ss") : "-"}
                    </td>
                    <td className="py-4 px-6 text-cyan-700 text-xs font-mono">{log.ip_address || "-"}</td>
                    <td className="py-4 px-6 text-gray-400 text-xs max-w-[200px] truncate" title={log.device_info || ""}>
                      {log.device_info ? log.device_info.replace(/Mozilla\/[^ ]+/, "").substring(0, 50) + "…" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE STAFF TAB */}
      {activeTab === "active_users" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No active staff users found</p>
            </div>
          ) : users.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                {(u.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{u.full_name || "-"}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 capitalize">
                    {u.role.replace(/_/g, " ")}
                  </span>
                  {u.department && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      {u.department}
                    </span>
                  )}
                </div>
              </div>
              {u.last_active && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">Last active</p>
                  <p className="text-xs font-bold text-gray-600">{format(new Date(u.last_active), "MMM d")}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
