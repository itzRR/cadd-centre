import { supabase } from './supabase'
import { getLecturersProfiles } from './data'
import type {
  Profile, MarketingLead, MarketingCampaign,
  ImsPayment, ImsInvoice, ImsExpense,
  HrLeaveRequest, HrSalaryPayout, HrPerformanceReview, HrRoster,
  OpsTask, OpsMinuteTracker, OpsMinuteTrackerTask,
  ImsLoginHistory, ImsSystemCommand, IMSDashboardStats, UserRole,
  ImsAcademicStudent, Lecturer, LeadConfirmation, LeadConfirmationStage
} from '@/types'

// ── PROFILES / STAFF ─────────────────────────────────────────

export async function getIMSStaff(): Promise<Profile[]> {
  const imsRoles = ['admin','super_admin','academic_head','academic_officer','finance_head','finance_officer','marketing_head','marketing_officer','hr_head','hr_officer','staff']
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', imsRoles)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateProfileRole(id: string, updates: Partial<{
  role: UserRole
  position: string
  department: string
  access_level: number
  task_delete_permission: boolean
  permissions: string[]
  work_schedule: { startTime: string, durationHours: number }[]
  office_assets: { item: string, serialNo?: string, issuedDate?: string }[]
  disabled: boolean
  full_name: string
  phone: string
  avatar_url: string
  documents: any[]
  nic: string
  join_date: string
  contract_type: string
  monthly_salary: number
  employee_status: string
  epf_number: string
}>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createStaffUser(params: {
  email: string
  password: string
  name: string
  role: UserRole
  position: string
  department?: string
  access_level?: number
  permissions?: string[]
  work_schedule?: { startTime: string, durationHours: number }[]
  office_assets?: { item: string, serialNo?: string, issuedDate?: string }[]
  phone?: string
  nic?: string
  join_date?: string
  contract_type?: string
  monthly_salary?: number
  employee_status?: string
  epf_number?: string
  student_id?: string
}) {
  // Calls the server-side API route which uses the service role key
  // to bypass RLS policies on the profiles table.
  const { data: { session } } = await supabase.auth.getSession()
  
  const res = await fetch("/api/ims/create-staff-user", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      name: params.name,
      role: params.role,
      position: params.position,
      department: params.department || null,
      access_level: params.access_level ?? 1,
      permissions: params.permissions || [],
      work_schedule: params.work_schedule || [],
      office_assets: params.office_assets || [],
      phone: params.phone || null,
      nic: params.nic || null,
      join_date: params.join_date || null,
      contract_type: params.contract_type || 'Full-time',
      monthly_salary: params.monthly_salary || null,
      employee_status: params.employee_status || 'Active',
      epf_number: params.epf_number || null,
      student_id: params.student_id || null,
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to create user")
  return json.user
}


// ── IMS DASHBOARD STATS ──────────────────────────────────────

export async function getIMSDashboardStats(): Promise<IMSDashboardStats> {
  const [
    { count: totalStaff },
    { count: totalStudents },
    { count: activeLeads },
    { count: convertedLeads },
    { count: pendingLeaves },
    { count: openTasks },
    revenueResult,
    pendingPaymentsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin','super_admin','academic_head','academic_officer','finance_head','finance_officer','marketing_head','marketing_officer','hr_head','hr_officer','staff']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('status', 'eq', 'Converted').not('status', 'eq', 'Lost'),
    supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', 'Converted'),
    supabase.from('hr_leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('ops_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('ims_payments').select('amount'),
    supabase.from('ims_invoices').select('total').eq('status', 'Unpaid'),
  ])

  const totalRevenue = (revenueResult.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const pendingPayments = (pendingPaymentsResult.data || []).reduce((sum: number, i: any) => sum + (i.total || 0), 0)

  return {
    totalStaff: totalStaff || 0,
    totalStudents: totalStudents || 0,
    activeLeads: activeLeads || 0,
    convertedLeads: convertedLeads || 0,
    pendingLeaves: pendingLeaves || 0,
    openTasks: openTasks || 0,
    totalRevenue,
    pendingPayments,
  }
}

// ── MARKETING LEADS ──────────────────────────────────────────

export async function getMarketingLeads(): Promise<MarketingLead[]> {
  const { data, error } = await supabase
    .from('marketing_leads')
    .select('*, assignee:profiles!assigned_to(id,full_name,email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, follow_ups: d.follow_ups || [] }))
}

export async function createMarketingLead(lead: Omit<MarketingLead, 'id' | 'created_at' | 'updated_at' | 'assignee'>): Promise<MarketingLead> {
  const { data, error } = await supabase
    .from('marketing_leads')
    .insert({ ...lead, follow_ups: lead.follow_ups || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, follow_ups: data.follow_ups || [] }
}

export async function updateMarketingLead(id: string, updates: Partial<MarketingLead>): Promise<MarketingLead> {
  const { assignee, ...rest } = updates as any
  const { data, error } = await supabase
    .from('marketing_leads')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, follow_ups: data.follow_ups || [] }
}

export async function deleteMarketingLead(id: string): Promise<void> {
  const { error } = await supabase.from('marketing_leads').delete().eq('id', id)
  if (error) throw error
}

export async function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMarketingCampaign(campaign: Omit<MarketingCampaign, 'id' | 'created_at'>): Promise<MarketingCampaign> {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMarketingCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
  if (error) throw error
}

// ── FINANCE ──────────────────────────────────────────────────

export async function getImsPayments(): Promise<ImsPayment[]> {
  const { data, error } = await supabase
    .from('ims_payments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createImsPayment(payment: Omit<ImsPayment, 'id' | 'created_at'>): Promise<ImsPayment> {
  const { data, error } = await supabase
    .from('ims_payments')
    .insert(payment)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteImsPayment(id: string): Promise<void> {
  const { error } = await supabase.from('ims_payments').delete().eq('id', id)
  if (error) throw error
}

export async function getImsInvoices(): Promise<ImsInvoice[]> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .select('*')
    .order('generated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, items: d.items || [] }))
}

export async function createImsInvoice(invoice: Omit<ImsInvoice, 'id' | 'generated_at'>): Promise<ImsInvoice> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .insert({ ...invoice, items: invoice.items || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, items: data.items || [] }
}

export async function updateImsInvoice(id: string, updates: Partial<ImsInvoice>): Promise<ImsInvoice> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, items: data.items || [] }
}

export async function deleteImsInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('ims_invoices').delete().eq('id', id)
  if (error) throw error
}

export async function getImsExpenses(): Promise<ImsExpense[]> {
  const { data, error } = await supabase
    .from('ims_expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createImsExpense(expense: Omit<ImsExpense, 'id' | 'created_at'>): Promise<ImsExpense> {
  const { data, error } = await supabase
    .from('ims_expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteImsExpense(id: string): Promise<void> {
  const { error } = await supabase.from('ims_expenses').delete().eq('id', id)
  if (error) throw error
}

// ── HR ───────────────────────────────────────────────────────

export async function getHrLeaveRequests(): Promise<HrLeaveRequest[]> {
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .select('*, employee:profiles!user_id(id,full_name,position,department)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrLeaveRequest(req: Omit<HrLeaveRequest, 'id' | 'created_at' | 'updated_at' | 'employee'>): Promise<HrLeaveRequest> {
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .insert(req)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHrLeaveRequest(id: string, updates: Partial<HrLeaveRequest>): Promise<HrLeaveRequest> {
  const { employee, ...rest } = updates as any
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase.from('hr_leave_requests').delete().eq('id', id)
  if (error) throw error
}

export async function getHrSalaryPayouts(): Promise<HrSalaryPayout[]> {
  const { data, error } = await supabase
    .from('hr_salary_payouts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrSalaryPayout(payout: Omit<HrSalaryPayout, 'id' | 'created_at'>): Promise<HrSalaryPayout> {
  const { data, error } = await supabase
    .from('hr_salary_payouts')
    .insert(payout)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrSalaryPayout(id: string): Promise<void> {
  const { error } = await supabase.from('hr_salary_payouts').delete().eq('id', id)
  if (error) throw error
}

export async function getHrPerformanceReviews(): Promise<HrPerformanceReview[]> {
  const { data, error } = await supabase
    .from('hr_performance_reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrPerformanceReview(review: Omit<HrPerformanceReview, 'id' | 'created_at'>): Promise<HrPerformanceReview> {
  const { data, error } = await supabase
    .from('hr_performance_reviews')
    .insert(review)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrPerformanceReview(id: string): Promise<void> {
  const { error } = await supabase.from('hr_performance_reviews').delete().eq('id', id)
  if (error) throw error
}

export async function getHrRoster(): Promise<HrRoster[]> {
  const { data, error } = await supabase
    .from('hr_roster')
    .select('*, assignee:profiles!assigned_to(id,full_name,position)')
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrRoster(entry: Omit<HrRoster, 'id' | 'created_at' | 'assignee'>): Promise<HrRoster> {
  const { data, error } = await supabase
    .from('hr_roster')
    .insert(entry)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrRoster(id: string): Promise<void> {
  const { error } = await supabase.from('hr_roster').delete().eq('id', id)
  if (error) throw error
}

// ── TASKS ────────────────────────────────────────────────────

export async function getOpsTasks(): Promise<OpsTask[]> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({
    ...d,
    assigned_to: d.assigned_to || [],
    completed_by: d.completed_by || [],
  }))
}

export async function createOpsTask(task: Omit<OpsTask, 'id' | 'created_at' | 'updated_at'>): Promise<OpsTask> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .insert({ ...task, assigned_to: task.assigned_to || [], completed_by: task.completed_by || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, assigned_to: data.assigned_to || [], completed_by: data.completed_by || [] }
}

export async function updateOpsTask(id: string, updates: Partial<OpsTask>): Promise<OpsTask> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, assigned_to: data.assigned_to || [], completed_by: data.completed_by || [] }
}

export async function deleteOpsTask(id: string): Promise<void> {
  const { error } = await supabase.from('ops_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function completeOpsTask(taskId: string, userId: string): Promise<void> {
  const { data } = await supabase.from('ops_tasks').select('completed_by').eq('id', taskId).single()
  const completedBy: string[] = data?.completed_by || []
  if (!completedBy.includes(userId)) completedBy.push(userId)
  const { error } = await supabase
    .from('ops_tasks')
    .update({ status: 'completed', completed_by: completedBy, updated_at: new Date().toISOString() })
    .eq('id', taskId)
  if (error) throw error
}

// ── MINUTE TRACKERS ──────────────────────────────────────────

export async function getMinuteTrackers(): Promise<OpsMinuteTracker[]> {
  const { data, error } = await supabase
    .from('ops_minute_trackers')
    .select('*, tasks:ops_minute_tracker_tasks(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, members: d.members || [], tasks: d.tasks || [] }))
}

export async function createMinuteTracker(tracker: Omit<OpsMinuteTracker, 'id' | 'created_at' | 'tasks'>): Promise<OpsMinuteTracker> {
  const { data, error } = await supabase
    .from('ops_minute_trackers')
    .insert({ ...tracker, members: tracker.members || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, members: data.members || [], tasks: [] }
}

export async function deleteMinuteTracker(id: string): Promise<void> {
  const { error } = await supabase.from('ops_minute_trackers').delete().eq('id', id)
  if (error) throw error
}

export async function addMinuteTrackerTask(task: Omit<OpsMinuteTrackerTask, 'id' | 'created_at'>): Promise<OpsMinuteTrackerTask> {
  const { data, error } = await supabase
    .from('ops_minute_tracker_tasks')
    .insert(task)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── SYSTEM / ADMIN ────────────────────────────────────────────

export async function getLoginHistory(): Promise<ImsLoginHistory[]> {
  const { data, error } = await supabase
    .from('ims_login_history')
    .select('*')
    .order('login_time', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function getSystemCommands(): Promise<ImsSystemCommand[]> {
  const { data, error } = await supabase
    .from('ims_system_commands')
    .select('*')
    .order('sent_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createSystemCommand(cmd: Omit<ImsSystemCommand, 'id' | 'sent_at'>): Promise<ImsSystemCommand> {
  const { data, error } = await supabase
    .from('ims_system_commands')
    .insert(cmd)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSystemCommandStatus(id: string, status: 'delivered' | 'cancelled'): Promise<void> {
  const { error } = await supabase
    .from('ims_system_commands')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function disableUser(userId: string, disabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ disabled, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

// ── ACADEMIC RESULTS ─────────────────────────────────────────

export interface AcademicResult {
  id: string
  student_id: string
  student_name: string
  course_id: string
  exam_name: string
  score: number
  max_score: number
  passed: boolean
  date: string
  created_at: string
}

export async function getAcademicResults(): Promise<AcademicResult[]> {
  const { data, error } = await supabase
    .from('ims_academic_results')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAcademicResult(result: Omit<AcademicResult, 'id' | 'created_at' | 'passed'>): Promise<AcademicResult> {
  const { data, error } = await supabase
    .from('ims_academic_results')
    .insert({ ...result, passed: result.score >= result.max_score * 0.5 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAcademicResult(id: string): Promise<void> {
  const { error } = await supabase.from('ims_academic_results').delete().eq('id', id)
  if (error) throw error
}

// ── WORK CALENDAR EVENTS ─────────────────────────────────────

export interface WorkCalendarEvent {
  id: string
  uid: string
  user_name: string
  title: string
  date: string
  end_date?: string
  start_time?: string
  end_time?: string
  category: 'Work' | 'Meeting' | 'Deadline' | 'Leave' | 'Task' | 'Other'
  color: string
  notes?: string
  created_at: string
}

export async function getWorkCalendarEvents(uid: string): Promise<WorkCalendarEvent[]> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .select('*')
    .eq('uid', uid)
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createWorkCalendarEvent(event: Omit<WorkCalendarEvent, 'id' | 'created_at'>): Promise<WorkCalendarEvent> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .insert(event)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkCalendarEvent(id: string, updates: Partial<WorkCalendarEvent>): Promise<WorkCalendarEvent> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from('work_calendar_events').delete().eq('id', id)
  if (error) throw error
}

// ── STAFF ATTENDANCE ─────────────────────────────────────────

export interface StaffAttendanceSession {
  id: string
  user_id: string
  user_name: string
  date: string
  time_in: string
  time_out?: string | null
  status: 'present' | 'late' | 'active'
  daily_report?: string
  session_index: number
  created_at: string
}

export async function getMyAttendance(userId: string, limit = 90): Promise<StaffAttendanceSession[]> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .eq('user_id', userId)
    .order('time_in', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getAllAttendance(): Promise<StaffAttendanceSession[]> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .order('time_in', { ascending: false })
    .limit(500)
  if (error) throw error
  return data || []
}

export async function getDepartmentAttendance(department: string): Promise<StaffAttendanceSession[]> {
  const { data: profiles } = await supabase.from('profiles').select('id').eq('department', department)
  if (!profiles || profiles.length === 0) return []
  const userIds = profiles.map(p => p.id)

  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .in('user_id', userIds)
    .order('time_in', { ascending: false })
    .limit(500)
  if (error) throw error
  return data || []
}

export async function clockIn(params: { userId: string; userName: string; sessionIndex: number }): Promise<StaffAttendanceSession> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  // Determine status: late if after 08:00 local time
  const localHour = new Date().getHours()
  const status: 'present' | 'late' = localHour > 8 ? 'late' : 'present'
  const { data, error } = await supabase
    .from('staff_attendance')
    .insert({
      user_id: params.userId,
      user_name: params.userName,
      date: today,
      time_in: now,
      status,
      session_index: params.sessionIndex,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function clockOut(sessionId: string, dailyReport: string): Promise<StaffAttendanceSession> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .update({ time_out: new Date().toISOString(), daily_report: dailyReport })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── REALTIME SUBSCRIPTIONS ────────────────────────────────────

export function subscribeToMarketingLeads(callback: (leads: MarketingLead[]) => void) {
  const channel = supabase
    .channel('marketing_leads_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_leads' }, async () => {
      const leads = await getMarketingLeads()
      callback(leads)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToOpsTasks(callback: (tasks: OpsTask[]) => void): () => void {
  const channel = supabase
    .channel('ops_tasks_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_tasks' }, async () => {
      const tasks = await getOpsTasks()
      callback(tasks)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToSystemCommands(userId: string, callback: (cmd: ImsSystemCommand) => void): () => void {
  const channel = supabase
    .channel(`system_commands_${userId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ims_system_commands', filter: `target_user_id=eq.${userId}` },
      (payload) => callback(payload.new as ImsSystemCommand)
    )
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

// ── LEAD-TO-STUDENT WORKFLOW ─────────────────────────────────

export async function convertLeadToStudent(params: {
  leadId: string
  studentName: string
  email: string | null
  phone: string | null
  nic: string | null
  dob: string | null
  courseName: string
  courseId: string | null
  amount: number
  createdBy: string | null
}): Promise<ImsPayment> {
  // 1. Update lead status to Converted
  await supabase
    .from('marketing_leads')
    .update({ status: 'Converted', updated_at: new Date().toISOString() })
    .eq('id', params.leadId)

  // 2. Create a pending payment record linked to the lead
  const { data, error } = await supabase
    .from('ims_payments')
    .insert({
      student_name: params.studentName,
      course_id: params.courseId,
      amount: params.amount,
      method: 'Cash',
      date: new Date().toISOString().slice(0, 10),
      lead_id: params.leadId,
      source: 'marketing_lead',
      payment_confirmed: false,
      notes: `Auto-created from Marketing lead conversion. Course: ${params.courseName}`,
      created_by: params.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmLeadPayment(params: {
  paymentId: string
  leadId: string
  studentName: string
  email: string | null
  phone: string | null
  nic: string | null
  dob: string | null
  courseName: string
  courseId: string | null
  batchCode: string | null
  batchId?: string | null
  confirmedBy: string | null
  academicEmail?: string | null
  academicPassword?: string | null
}): Promise<any> {
  // 1. Mark payment as confirmed
  await supabase
    .from('ims_payments')
    .update({ payment_confirmed: true })
    .eq('id', params.paymentId)

  // 2. Generate student ID
  const batchCodeForId = params.batchCode || 'GEN'
  const seq = await getNextStudentSequence(batchCodeForId)
  const studentId = generateStudentId(batchCodeForId, seq)

  // The auth login email is the ACADEMIC email (studentId@caddcentre.lk)
  const authEmail = params.academicEmail || `${studentId.toLowerCase()}@caddcentre.lk`
  const authPassword = params.academicPassword || studentId

  // 3. Check if student already exists (by academic email OR personal email)
  let { data: existingStudent } = await supabase.from('students').select('id').eq('email', authEmail).maybeSingle()
  if (!existingStudent && params.email) {
    const { data: byPersonal } = await supabase.from('students').select('id').eq('personal_email', params.email).maybeSingle()
    existingStudent = byPersonal
  }
  let userId = existingStudent?.id
  if (!userId) {
    // createStaffUser with role='student' → inserts into `students` table (not profiles)
    const newStudent = await createStaffUser({
      email: authEmail,
      password: authPassword,
      name: params.studentName,
      role: 'student',
      position: 'Student',
      department: 'Academic',
      phone: params.phone || undefined,
      nic: params.nic || undefined,
      student_id: studentId
    })
    userId = newStudent.id
  }

  // 3b. Update the students record with full academic details
  await supabase.from('students').update({
    academic_email: authEmail,
    academic_password: authPassword,
    student_id: studentId,
    personal_email: params.email || null,
    phone: params.phone || null,
    nic: params.nic || null,
    dob: params.dob || null,
    course_name: params.courseName || null,
    course_id: params.courseId || null,
    batch_code: params.batchCode || null,
    batch_id: params.batchId || null,
    lead_id: params.leadId || null,
    source: 'lead_pipeline',
    payment_status: 'paid',
    status: 'active',
  }).eq('id', userId)

  // 4. Create enrollment
  const { data, error } = await supabase.from('enrollments').insert({
    user_id: userId,
    course_id: params.courseId,
    batch_id: params.batchId || null,
    status: 'confirmed',
    payment_status: 'paid',
    amount_paid: 0
  }).select().single()
  
  if (error) throw error

  // 5. Also create IMS academic student record (for admin views)
  await supabase.from('ims_academic_students').insert({
    student_name: params.studentName,
    student_id: studentId,
    email: params.email,
    phone: params.phone,
    nic: params.nic,
    dob: params.dob,
    batch_code: params.batchCode,
    course_id: params.courseId,
    course_name: params.courseName,
    source: 'lead_pipeline',
    lead_id: params.leadId,
    payment_status: 'paid',
    status: 'active',
    academic_email: authEmail,
    academic_password: authPassword,
    created_by: params.confirmedBy,
  }).select().single()

  return data
}

// ── BATCH CODE & STUDENT ID GENERATORS ───────────────────────

const COURSE_ABBREVIATIONS: Record<string, string> = {
  'AutoCAD': 'ACAD', 'Revit': 'RVT', 'SketchUp': 'SKU',
  '3ds Max': '3DM', 'V-Ray': 'VRY', 'Lumion': 'LUM',
  'Photoshop': 'PS', 'Illustrator': 'AI', 'InDesign': 'ID',
  'Premiere Pro': 'PR', 'After Effects': 'AE', 'Blender': 'BLN',
  'SolidWorks': 'SW', 'CATIA': 'CAT', 'Fusion 360': 'F360',
  'BIM': 'BIM', 'Interior Design': 'INT', 'Graphic Design': 'GD',
}

export function generateBatchCode(
  courseAbbreviation: string,
  startDate: Date,
  timeCode: 'M' | 'A' | 'E',
  typeCode: 'G' | 'I'
): string {
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  let abbr = COURSE_ABBREVIATIONS[courseAbbreviation]
  if (!abbr) {
    const firstWord = courseAbbreviation.split(' ')[0]
    abbr = COURSE_ABBREVIATIONS[firstWord] || courseAbbreviation.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()
  }
  const dd = String(startDate.getDate()).padStart(2, '0')
  const mon = MONTHS[startDate.getMonth()]
  const yy = String(startDate.getFullYear()).slice(-2)
  return `${abbr}${dd}${mon}${yy}${timeCode}${typeCode}`
}

/**
 * Generate student ID: batchCode + 2-digit sequence (01-99)
 * Example: ACAD12MAY26MG01
 */
export function generateStudentId(batchCode: string, sequenceNumber: number): string {
  return `${batchCode}${String(sequenceNumber).padStart(2, '0')}`
}

/**
 * Get the next available sequence number for a batch
 */
export async function getNextStudentSequence(batchCode: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('student_id')
    .like('student_id', `${batchCode}%`)
    .order('student_id', { ascending: false })
    .limit(1)
  if (data && data.length > 0) {
    const lastId = data[0].student_id
    const lastSeq = parseInt(lastId.slice(-2), 10)
    return isNaN(lastSeq) ? 1 : lastSeq + 1
  }
  return 1
}

// ── IMS ACADEMIC STUDENTS ────────────────────────────────────

export async function getImsAcademicStudents(): Promise<ImsAcademicStudent[]> {
  const { data, error } = await supabase
    .from('ims_academic_students')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createImsAcademicStudent(student: Omit<ImsAcademicStudent, 'id' | 'created_at' | 'updated_at'>): Promise<ImsAcademicStudent> {
  const { data, error } = await supabase
    .from('ims_academic_students')
    .insert(student)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteImsAcademicStudent(id: string): Promise<void> {
  const { error } = await supabase.from('ims_academic_students').delete().eq('id', id)
  if (error) throw error
}

// ── ADDITIONAL REAL-TIME SUBSCRIPTIONS ────────────────────────

export function subscribeToImsPayments(callback: (payments: ImsPayment[]) => void): () => void {
  const channel = supabase
    .channel('ims_payments_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ims_payments' }, async () => {
      const payments = await getImsPayments()
      callback(payments)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToHrLeaveRequests(callback: (requests: HrLeaveRequest[]) => void): () => void {
  const channel = supabase
    .channel('hr_leave_requests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_leave_requests' }, async () => {
      const requests = await getHrLeaveRequests()
      callback(requests)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToAcademicStudents(callback: (students: ImsAcademicStudent[]) => void): () => void {
  const channel = supabase
    .channel('ims_academic_students_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ims_academic_students' }, async () => {
      const students = await getImsAcademicStudents()
      callback(students)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

// ── LECTURERS ────────────────────────────────────────────────

export async function getLecturers(): Promise<Lecturer[]> {
  const { data, error } = await supabase
    .from('lecturers')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createLecturer(lecturer: Omit<Lecturer, 'id' | 'created_at'>): Promise<Lecturer> {
  const { data, error } = await supabase
    .from('lecturers')
    .insert(lecturer)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLecturer(id: string, updates: Partial<Lecturer>): Promise<Lecturer> {
  const { data, error } = await supabase
    .from('lecturers')
    .update({ ...updates })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLecturer(id: string): Promise<void> {
  const { error } = await supabase.from('lecturers').delete().eq('id', id)
  if (error) throw error
}

// ── LEAD CONFIRMATIONS (Cross-dashboard pipeline) ────────────

export async function getLeadConfirmations(stage?: LeadConfirmationStage): Promise<LeadConfirmation[]> {
  let query = supabase
    .from('lead_confirmations')
    .select('*')
    .order('created_at', { ascending: false })
  if (stage) query = query.eq('stage', stage)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function confirmMarketingLead(leadId: string, confirmedBy: string): Promise<LeadConfirmation> {
  // Get lead details
  const { data: lead, error: leadError } = await supabase
    .from('marketing_leads')
    .select('*')
    .eq('id', leadId)
    .single()
  if (leadError) throw leadError

  // Mark lead as confirmed
  await supabase
    .from('marketing_leads')
    .update({ confirmed: true, confirmed_at: new Date().toISOString(), confirmed_by: confirmedBy })
    .eq('id', leadId)

  // Create lead confirmation record
  const { data, error } = await supabase
    .from('lead_confirmations')
    .insert({
      lead_id: leadId,
      lead_name: lead.name,
      contact: lead.contact,
      email: lead.email,
      course_interested: lead.course_interested,
      stage: 'marketing_confirmed',
      marketing_confirmed_by: confirmedBy,
      marketing_confirmed_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmLeadPaymentFinance(
  confirmationId: string, confirmedBy: string,
  paymentAmount: number, paymentMethod: string
): Promise<LeadConfirmation> {
  const { data, error } = await supabase
    .from('lead_confirmations')
    .update({
      stage: 'finance_confirmed',
      finance_confirmed_by: confirmedBy,
      finance_confirmed_at: new Date().toISOString(),
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq('id', confirmationId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmLeadAsStudent(
  confirmationId: string, confirmedBy: string,
  batchId: string, studentId: string
): Promise<LeadConfirmation> {
  const { data, error } = await supabase
    .from('lead_confirmations')
    .update({
      stage: 'academic_confirmed',
      academic_confirmed_by: confirmedBy,
      academic_confirmed_at: new Date().toISOString(),
      batch_id: batchId,
      student_id: studentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', confirmationId)
    .select()
    .single()
  if (error) throw error
  return data
}



// ── REALTIME SUBSCRIPTIONS (new) ─────────────────────────────

export function subscribeToLecturers(callback: (lecturers: any[]) => void): () => void {
  const channel = supabase
    .channel('lecturers_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.lecturer" }, async () => {
      const lecturers = await getLecturersProfiles()
      callback(lecturers)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToLeadConfirmations(callback: (confirmations: LeadConfirmation[]) => void): () => void {
  const channel = supabase
    .channel('lead_confirmations_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_confirmations' }, async () => {
      const confirmations = await getLeadConfirmations()
      callback(confirmations)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}
