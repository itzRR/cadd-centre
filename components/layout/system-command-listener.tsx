"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AlertOctagon, Info, Bell } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { ImsSystemCommand } from "@/types"

const getTaskRoute = (user: any) => {
  if (user?.department) {
    const dept = user.department.toLowerCase()
    if (["marketing", "academic", "finance", "hr"].includes(dept)) {
      if (typeof window !== 'undefined' && window.location.pathname.includes(`/admin/ims/${dept}`)) {
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'tasks' }))
        return null
      }
      return `/admin/ims/${dept}?tab=tasks`
    }
  }
  return '/admin/ims/tasks'
}

export function SystemCommandListener() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [blockingCommand, setBlockingCommand] = useState<ImsSystemCommand | null>(null)
  const router = useRouter()

  const processCommands = useCallback(async (user: any) => {
    // Only process for logged in users
    if (!user) return

    // Fetch all pending commands
    const { data: commands, error } = await supabase
      .from('ims_system_commands')
      .select('*')
      .eq('status', 'pending')
      .order('sent_at', { ascending: false })

    if (error || !commands) return

    let activeBlockingCmd: ImsSystemCommand | null = null

    for (const cmd of commands) {
      const isBroadcast = cmd.type === "broadcast" && cmd.target_user_id === null
      const isTargetedUser = cmd.target_user_id === user.id
      const isTargetedDept = user.department && cmd.target_user_id === `dept:${user.department}`

      if (isBroadcast || isTargetedUser || isTargetedDept) {
        
        // Super admins are immune to blocking overlays so they can still use the control panel
        if (user.role === 'super_admin' && (cmd.type === "broadcast" || cmd.type === "popup")) {
          continue
        }

        if (cmd.type === "force_logout") {
          await signOut()
          window.location.href = "/auth/login?message=Your session was terminated by an administrator."
          return
        }

        if (cmd.type === "disable_user") {
          await signOut()
          window.location.href = "/auth/login?message=Your account has been disabled."
          return
        }

        if (cmd.type === "broadcast" || cmd.type === "popup") {
          // Ignore legacy TASK_ASSIGNED popups (now handled via ops_tasks directly)
          if (cmd.type === "popup" && cmd.message?.startsWith("TASK_ASSIGNED|")) {
            continue
          }

          // Normal popups (non-task)
          if (cmd.type === "popup") {
            const deliveredKey = `delivered_cmds_${user.id}`
            try {
              const delivered = JSON.parse(localStorage.getItem(deliveredKey) || "[]")
              if (delivered.includes(cmd.id)) continue

              toast(
                <div className="flex flex-col gap-1 cursor-pointer group">
                  <span className="font-bold flex items-center gap-2 group-hover:text-blue-600 transition-colors"><Bell className="w-4 h-4 text-blue-500" /> Notification</span>
                  <span className="text-sm text-gray-600">{cmd.message}</span>
                </div>,
                { duration: 8000 }
              )
              delivered.push(cmd.id)
              localStorage.setItem(deliveredKey, JSON.stringify(delivered))
              supabase.from('ims_system_commands').update({ status: 'delivered' }).eq('id', cmd.id).then()
            } catch (err) {}
            continue
          }

          // Keep the most recent blocking command
          if (!activeBlockingCmd) {
            activeBlockingCmd = cmd as ImsSystemCommand
          }
        }
      }
    }

    setBlockingCommand(activeBlockingCmd)
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const user = await getCurrentUser()
      if (!mounted) return
      setCurrentUser(user)
      if (user) {
        await processCommands(user)

        const { data: tasks } = await supabase.from('ops_tasks').select('assigned_to, assigned_department, completed_by').eq('status', 'pending')
        if (tasks) {
          const myPending = tasks.filter(t => {
            const completedBy = Array.isArray(t.completed_by) ? t.completed_by : []
            if (completedBy.includes(user.id)) return false
            return t.assigned_to?.includes(user.id) || (user.department && t.assigned_department === user.department)
          })
          if (myPending.length > 0) {
            toast(
              <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => { const route = getTaskRoute(user); if (route) router.push(route) }}>
                <span className="font-bold flex items-center gap-2 group-hover:text-blue-600 transition-colors"><Bell className="w-4 h-4 text-blue-500" /> Action Required</span>
                <span className="text-sm text-gray-600">You have {myPending.length} pending task(s) to complete.</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view tasks &rarr;</span>
              </div>,
              { duration: 10000, id: "pending_tasks_reminder" }
            )
          }
        }
      }
    }

    init()

    // ── Heartbeat: update last_active every 2 minutes so presence works ──
    const heartbeat = setInterval(async () => {
      const user = await getCurrentUser()
      if (user) {
        supabase.from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', user.id)
          .then(() => {})
      }
    }, 2 * 60 * 1000) // every 2 minutes

    const channel = supabase
      .channel('system_commands_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ims_system_commands' }, () => {
        if (currentUser) {
          processCommands(currentUser)
        } else {
          // If state hasn't updated yet but we know something changed, fetch user again just in case
          getCurrentUser().then(user => {
            if (mounted && user) {
              setCurrentUser(user)
              processCommands(user)
            }
          })
        }
      })
      .subscribe()

    // ── Live listener for new tasks assigned to this user ──
    const taskChannel = supabase
      .channel('live_tasks')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ops_tasks' }, (payload) => {
        const task = payload.new
        if (currentUser) {
          const isForMe = task.assigned_to?.includes(currentUser.id) || (currentUser.department && task.assigned_department === currentUser.department)
          if (isForMe && task.created_by !== currentUser.id) {
            toast(
              <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => { const route = getTaskRoute(currentUser); if (route) router.push(route) }}>
                <span className="font-bold flex items-center gap-2 group-hover:text-blue-600 transition-colors"><Bell className="w-4 h-4 text-blue-500" /> New Task Assigned</span>
                <span className="text-sm text-gray-600">{task.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view tasks &rarr;</span>
              </div>,
              { duration: 8000 }
            )
          }
        }
      })
      .subscribe()

    return () => {
      mounted = false
      clearInterval(heartbeat)
      supabase.removeChannel(channel)
      supabase.removeChannel(taskChannel)
    }
  }, [processCommands, currentUser?.id]) // intentionally depending on currentUser?.id to trigger re-subscribe if user changes

  if (!blockingCommand) return null

  // Render blocking overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        style={{ pointerEvents: 'auto' }} // Explicitly block clicks to underlying elements
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            {blockingCommand.type === 'broadcast' ? (
              <Info className="h-10 w-10 text-red-600" />
            ) : (
              <AlertOctagon className="h-10 w-10 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {blockingCommand.type === 'broadcast' ? 'System Broadcast' : 'Important Message'}
          </h2>
          <p className="text-gray-600 text-base font-medium mb-6">
            {blockingCommand.message || "The system is currently undergoing maintenance. Please wait."}
          </p>
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            Sent by {blockingCommand.sent_by_name || "System Administrator"} • Please wait for this to be resolved.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
