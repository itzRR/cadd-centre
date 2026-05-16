"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format, isAfter, isBefore, addDays, isToday } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X, CheckCircle, Clock, AlertTriangle, ListTodo, Download, RefreshCw, Filter } from "lucide-react"
import { getOpsTasks, createOpsTask, updateOpsTask, deleteOpsTask, completeOpsTask, getAllProfiles, subscribeToOpsTasks, createSystemCommand } from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import type { OpsTask, Profile } from "@/types"
import * as XLSX from "xlsx"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

const DEPARTMENTS = ["Academic", "Marketing", "Finance", "HR", "IT", "Operations"]
const PRIORITY_COLORS = {
  low:    "bg-green-100 text-green-700 border-green-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  high:   "bg-red-100 text-red-700 border-red-300"
}
const PRIORITY_DOT = { low: "bg-green-500", medium: "bg-yellow-500", high: "bg-red-500" }

export default function IMSTasksPage(props: any) {
  const embedded = props?.embedded || false;
  const [tasks, setTasks] = useState<OpsTask[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "mine" | "today">("pending")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const emptyForm = {
    title: "", description: "", start_date: "", due_date: "",
    priority: "medium" as "low" | "medium" | "high", assigned_to: [] as string[], assigned_department: "",
    status: "pending" as const, completed_by: [],
  }
  const [taskForm, setTaskForm] = useState(emptyForm)
  const [assignType, setAssignType] = useState<"users" | "department">("users")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [t, u, cu] = await Promise.all([getOpsTasks(), getAllProfiles(), getCurrentUser()])
      setTasks(t); setUsers(u.filter((u: Profile) => u.role !== "student")); setCurrentUser(cu)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadData()
    const unsub = subscribeToOpsTasks(setTasks)
    return unsub
  }, [loadData])

  const canDelete = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.task_delete_permission === true

  const handleCreate = async () => {
    if (!taskForm.title.trim() || !taskForm.due_date) return toast.error("Title and due date required")
    const assigned = assignType === "department"
      ? users.filter(u => u.department === taskForm.assigned_department).map(u => u.id)
      : taskForm.assigned_to
    try {
      const created = await createOpsTask({
        ...taskForm,
        assigned_to: assigned,
        assigned_department: assignType === "department" ? taskForm.assigned_department : null,
        created_by: currentUser?.id,
      })

      setTasks(prev => [created, ...prev])
      toast.success("Task created")
      setShowModal(false); setTaskForm(emptyForm)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleComplete = async (task: OpsTask) => {
    try {
      await completeOpsTask(task.id, currentUser?.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "completed", completed_by: [...(t.completed_by || []), currentUser?.id] } : t))
      toast.success("Task marked complete")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    if (!canDelete) return toast.error("You don't have permission to delete tasks")
    if (!(await confirmDialog("Delete this task?"))) return
    try {
      await deleteOpsTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success("Task deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const exportTasks = () => {
    const ws = XLSX.utils.json_to_sheet(tasks.map(t => ({
      Title: t.title, Priority: t.priority, Status: t.status,
      DueDate: t.due_date, Department: t.assigned_department || "-",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tasks")
    XLSX.writeFile(wb, `tasks_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === "pending") return t.status === "pending"
    if (filter === "completed") return t.status === "completed"
    if (filter === "mine") return t.assigned_to?.includes(currentUser?.id) || t.created_by === currentUser?.id
    if (filter === "today") return isToday(new Date(t.due_date))
    return true
  })

  const isOverdue = (task: OpsTask) => task.status === "pending" && isBefore(new Date(task.due_date), new Date())
  const isDueSoon = (task: OpsTask) => task.status === "pending" && isAfter(new Date(task.due_date), new Date()) && isBefore(new Date(task.due_date), addDays(new Date(), 2))

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    completed: tasks.filter(t => t.status === "completed").length,
    mine: tasks.filter(t => t.assigned_to?.includes(currentUser?.id)).length,
    today: tasks.filter(t => isToday(new Date(t.due_date))).length,
  }

  const filterConfig = [
    { id: "all" as const, label: "All", color: "from-blue-600 to-cyan-500" },
    { id: "pending" as const, label: "Pending", color: "from-yellow-500 to-orange-500" },
    { id: "completed" as const, label: "Done", color: "from-green-500 to-emerald-500" },
    { id: "mine" as const, label: "Mine", color: "from-purple-500 to-pink-500" },
    { id: "today" as const, label: "Today", color: "from-red-500 to-rose-500" },
  ]

  return (
    <div className={embedded ? "space-y-6 text-gray-900 selection:bg-blue-500/20" : "min-h-screen bg-gray-50 p-4 md:p-8 space-y-6 text-gray-900 selection:bg-blue-500/20"}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            Shared Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cross-department task management &amp; real-time tracking</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors text-sm font-medium" onClick={loadData}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors text-sm font-medium" onClick={exportTasks}>
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-md transition-all text-sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: counts.all, color: "text-gray-900", glow: "" },
          { label: "Pending", value: counts.pending, color: "text-yellow-600", glow: "" },
          { label: "Completed", value: counts.completed, color: "text-green-600", glow: "" },
          { label: "Assigned to Me", value: counts.mine, color: "text-blue-600", glow: "" },
        ].map((s, i) => (
          <div key={i} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${s.glow}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterConfig.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              filter === f.id
                ? `bg-gradient-to-r ${f.color} text-white border-transparent shadow-md`
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {f.label} <span className="ml-1 opacity-70">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-2xl">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm mt-1">All clear in this view!</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task, i) => {
              const overdue = isOverdue(task)
              const dueSoon = isDueSoon(task)
              const completedByMe = task.completed_by?.includes(currentUser?.id)
              const assignedNames = (task.assigned_to || [])
                .map(uid => users.find(u => u.id === uid)?.full_name || "Unknown")

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${
                    overdue ? "border-red-300 shadow-sm"
                    : dueSoon ? "border-yellow-300 shadow-sm"
                    : task.status === "completed" ? "border-gray-100 opacity-70"
                    : "border-gray-200"
                  }`}
                >
                  {/* Priority accent bar */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${PRIORITY_DOT[task.priority]}`} />

                  <div className="flex items-start gap-4 pl-3">
                    {/* Complete button */}
                    <button
                      onClick={() => task.status === "pending" ? handleComplete(task) : undefined}
                      disabled={task.status === "completed"}
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        task.status === "completed"
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 hover:border-green-500 hover:bg-green-50"
                      }`}
                    >
                      {task.status === "completed" && <CheckCircle className="h-4 w-4 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className={`font-semibold text-base ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {task.title}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                        {dueSoon && !overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            <Clock className="h-3 w-3" /> Due Soon
                          </span>
                        )}
                        {task.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-500 mb-3 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Due <span className={overdue ? "text-red-500 font-bold" : "text-gray-600"}>{task.due_date}</span>
                        </span>
                        {task.assigned_department && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
                            {task.assigned_department}
                          </span>
                        )}
                        {assignedNames.length > 0 && (
                          <span>→ {assignedNames.slice(0, 2).join(", ")}{assignedNames.length > 2 ? ` +${assignedNames.length - 2}` : ""}</span>
                        )}
                        {(task.completed_by?.length || 0) > 0 && (
                          <span className="text-green-400 font-medium">{task.completed_by?.length} completed</span>
                        )}
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl my-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
                  <p className="text-gray-500 text-sm mt-1">Assign tasks to staff or departments</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Task Title *</label>
                  <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Update student records"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Description</label>
                  <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Start Date</label>
                    <input type="date" value={taskForm.start_date} onChange={e => setTaskForm(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Due Date *</label>
                    <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Priority</label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map(p => (
                        <button key={p} type="button" onClick={() => setTaskForm(prev => ({ ...prev, priority: p }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${taskForm.priority === p ? PRIORITY_COLORS[p] : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Assign To</label>
                    <div className="flex gap-2">
                      {(["users", "department"] as const).map(t => (
                        <button key={t} type="button" onClick={() => setAssignType(t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${assignType === t ? 'bg-yellow-50 border-yellow-400 text-yellow-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                          {t === "users" ? "Users" : "Dept"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {assignType === "department" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Department</label>
                    <select value={taskForm.assigned_department || ""} onChange={e => setTaskForm(p => ({ ...p, assigned_department: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-yellow-500 transition-all">
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Select Users</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                      {users.map(u => (
                        <label key={u.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${taskForm.assigned_to.includes(u.id) ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'}`}>
                            {taskForm.assigned_to.includes(u.id) && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <input type="checkbox" checked={taskForm.assigned_to.includes(u.id)} className="hidden"
                            onChange={e => setTaskForm(p => ({
                              ...p,
                              assigned_to: e.target.checked ? [...p.assigned_to, u.id] : p.assigned_to.filter(id => id !== u.id)
                            }))} />
                          <span className="text-sm text-gray-700 font-medium">{u.full_name || u.email}</span>
                          <div className="ml-auto flex flex-col items-end gap-0.5">
                            {u.department && (
                              <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {u.department}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 capitalize">{u.role.replace(/_/g," ")}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCreate} className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-md transition-all">
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

