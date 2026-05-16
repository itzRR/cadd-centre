// ============================================================
// CADD Centre Unified - Type Definitions
// Covers both ASMS (Academic & Student Management System)
// and IMS (Institute Management System)
// ============================================================

// ── ROLES ───────────────────────────────────────────────────
// System roles (non-staff)
export type SystemRole = 'student' | 'lecturer'
// Staff/Management roles (the 11 required roles)
export type StaffRole =
  | 'super_admin' | 'admin'
  | 'academic_head' | 'academic_officer'
  | 'finance_head' | 'finance_officer'
  | 'marketing_head' | 'marketing_officer'
  | 'hr_head' | 'hr_officer'
  | 'staff'
// Unified
export type UserRole = SystemRole | StaffRole

export const STAFF_ROLES: StaffRole[] = ['super_admin','admin','academic_head','academic_officer','finance_head','finance_officer','marketing_head','marketing_officer','hr_head','hr_officer','staff']
export const ADMIN_ROLES: UserRole[] = ['admin','super_admin']
export const ALL_ROLES: UserRole[] = ['admin','super_admin','student','lecturer','academic_head','academic_officer','finance_head','finance_officer','marketing_head','marketing_officer','hr_head','hr_officer','staff']

// ── PERMISSIONS ─────────────────────────────────────────────
export type Permission =
  | 'ims_overview'
  | 'ims_marketing'
  | 'ims_academic'
  | 'ims_finance'
  | 'ims_hr'
  | 'ims_users'
  | 'ims_tasks'
  | 'ims_roster'
  | 'ims_control_panel'
  | 'asms_full'
  | 'task_delete'

// ── PROFILE ─────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  // ASMS student fields
  student_id: string | null
  education_background: string | null
  // ASMS lecturer fields
  specialization: string | null
  bio: string | null
  // IMS staff fields
  position: string | null
  department: string | null
  access_level: number
  task_delete_permission: boolean
  permissions: Permission[]
  work_schedule?: { startTime: string, durationHours: number }[]
  office_assets?: { item: string, serialNo?: string, issuedDate?: string }[]
  documents?: { id: string; title: string; url: string; addedAt: string }[]
  epf_number?: string
  nic?: string
  join_date?: string
  contract_type?: string
  monthly_salary?: number
  employee_status?: string
  disabled: boolean
  last_active: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── ASMS TYPES ──────────────────────────────────────────────
export type CourseLevel = 'Proficient Certificate' | 'Master Certificate' | 'Expert Certificate'

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_hours: number
  order_index: number
  topics: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  short_description: string | null
  price: number
  original_price: number | null
  level: CourseLevel
  category: string
  total_hours: number
  image_url: string | null
  tags: string[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  modules?: Module[]
}

export type BatchMode = 'classroom' | 'online' | 'hybrid'

export interface Batch {
  id: string
  course_id: string
  name: string
  start_date: string
  end_date: string | null
  schedule: string
  mode: BatchMode
  venue: string | null
  seats: number
  enrolled_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  course?: Course
  lecturer_allocations?: LecturerAllocation[]
}

export interface LecturerAllocation {
  id: string
  batch_id: string
  lecturer_id: string
  module_id: string | null
  created_at: string
  lecturer?: Profile
  module?: Module
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  batch_id: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount_paid: number
  enrolled_at: string
  created_at: string
  updated_at: string
  courses?: Course
  profiles?: Profile
  batches?: Batch
  batch?: Batch
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRecord {
  id: string
  enrollment_id: string
  batch_id: string
  date: string
  status: AttendanceStatus
  notes: string | null
  marked_by: string
  created_at: string
  enrollment?: Enrollment
}

export interface ModuleProgress {
  id: string
  enrollment_id: string
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  score: number | null
  practical_score: number | null
  theory_score: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  module?: Module
}

export type AssessmentType = 'module_test' | 'practical' | 'final_project'

export interface Assessment {
  id: string
  enrollment_id: string
  module_id: string | null
  type: AssessmentType
  title: string
  marks_obtained: number | null
  total_marks: number
  grade: string | null
  conducted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  module?: Module
}

export type CertificateType = 'course_completion' | 'professional_bim'

export interface Certificate {
  id: string
  enrollment_id: string
  user_id: string
  course_id: string
  certificate_number: string
  type: CertificateType
  issued_at: string
  qr_code_data: string
  pdf_url: string | null
  created_at: string
  profile?: Profile
  course?: Course
}

export type ResourceType = 'ebook' | 'video' | 'guide' | 'document'

export interface LearningResource {
  id: string
  module_id: string | null
  course_id: string | null
  title: string
  description: string | null
  type: ResourceType
  url: string
  is_active: boolean
  created_at: string
  updated_at: string
  module?: Module
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: boolean
  replied_at: string | null
  created_at: string
}

export interface StudentLead {
  id: string
  full_name: string
  email: string
  phone: string | null
  interested_course: string | null
  preferred_level: CourseLevel | null
  status: 'new' | 'contacted' | 'qualified' | 'enrolled' | 'lost'
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalStudents: number
  totalCourses: number
  totalBatches: number
  totalLecturers: number
  totalEnrollments: number
  totalRevenue: number
  certificatesIssued: number
  monthlyRevenue: { month: string; revenue: number }[]
  recentEnrollments: Enrollment[]
  attendanceRate: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

// ── IMS TYPES ───────────────────────────────────────────────

export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Lost'
export type LeadSource = 'Facebook' | 'Website' | 'Walk-in' | 'Referral' | 'WhatsApp' | 'Other'

export interface FollowUp {
  method: 'Call' | 'WhatsApp' | 'Email'
  due_date: string
  note: string
  done: boolean
}

export interface MarketingLead {
  id: string
  name: string
  contact: string | null
  email: string | null
  dob: string | null
  nic: string | null
  occupation: string | null
  course_interested: string | null
  source: LeadSource
  status: LeadStatus
  assigned_to: string | null
  campaign_id: string | null
  follow_ups: FollowUp[]
  notes: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface MarketingCampaign {
  id: string
  name: string
  source: LeadSource
  start_date: string | null
  end_date: string | null
  budget: number
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface ImsPayment {
  id: string
  student_name: string
  student_id: string | null
  course_id: string | null
  amount: number
  method: 'Cash' | 'Bank Transfer' | 'Online'
  date: string
  invoice_id: string | null
  notes: string | null
  lead_id: string | null
  source: string | null
  payment_confirmed: boolean
  created_by: string | null
  created_at: string
}

export interface ImsInvoiceItem {
  description: string
  amount: number
}

export interface ImsInvoice {
  id: string
  student_name: string
  student_id: string | null
  course_name: string | null
  items: ImsInvoiceItem[]
  total: number
  status: 'Paid' | 'Unpaid' | 'Partial'
  due_date: string | null
  generated_by: string | null
  generated_at: string
}

export interface ImsExpense {
  id: string
  category: 'Utilities' | 'Rent' | 'Salaries' | 'Marketing' | 'Equipment' | 'Maintenance' | 'Other'
  amount: number
  date: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export type LeaveType = 'Annual' | 'Sick' | 'Emergency' | 'Maternity/Paternity' | 'Other'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

export interface HrLeaveRequest {
  id: string
  user_id: string
  employee_name: string
  type: LeaveType
  from_date: string
  to_date: string
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  created_at: string
  updated_at: string
  employee?: Profile
}

export interface HrSalaryPayout {
  id: string
  user_id: string
  employee_name: string
  month: string
  amount: number
  paid_on: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface HrPerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  quarter: string
  score: number
  notes: string | null
  reviewed_by: string | null
  created_at: string
}

export interface HrRoster {
  id: string
  date: string
  type: 'Shift' | 'Duty' | 'On-call' | 'Other'
  shift: string | null
  assigned_to: string | null
  assigned_name: string | null
  description: string | null
  created_by: string | null
  created_at: string
  assignee?: Profile
}

export interface OpsTask {
  id: string
  title: string
  description: string | null
  start_date: string | null
  due_date: string
  assigned_to: string[]
  assigned_department: string | null
  status: 'pending' | 'completed'
  priority: 'low' | 'medium' | 'high'
  completed_by: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OpsMinuteTracker {
  id: string
  date: string
  total_minutes: number
  priority: 'low' | 'medium' | 'high'
  description: string | null
  task_template: string | null
  members: string[]
  created_by: string | null
  created_at: string
  tasks?: OpsMinuteTrackerTask[]
}

export interface OpsMinuteTrackerTask {
  id: string
  tracker_id: string
  description: string
  minutes: number
  member_id: string | null
  completed: boolean
  created_at: string
}

export interface ImsLoginHistory {
  id: string
  user_id: string | null
  user_name: string | null
  email: string | null
  login_time: string
  ip_address: string | null
  device_info: string | null
}

export interface ImsSystemCommand {
  id: string
  type: 'force_logout' | 'popup' | 'broadcast' | 'disable_user'
  message: string | null
  target_user_id: string | null
  target_user_name: string | null
  sent_by_id: string | null
  sent_by_name: string | null
  status: 'pending' | 'delivered' | 'cancelled'
  sent_at: string
}

// ── EVENTS ───────────────────────────────────────────────────
export interface EventAgendaItem {
  time?: string
  title: string
  description?: string
  speaker?: string
}

export interface EventSpeaker {
  name: string
  title?: string
  role?: string
  company?: string
  bio?: string
  image_url?: string
}

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  short_description: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  venue: string
  capacity: number
  booked_count: number
  price: number
  category: string
  organizer: string
  image_url: string | null
  tags: string[]
  agenda: EventAgendaItem[]
  speakers: EventSpeaker[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  user_id: string
  event_id: string
  quantity: number
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount_paid: number
  created_at: string
  updated_at: string
  event?: Event
  profile?: Profile
}

export type AcademicRecordType = 'assignment' | 'practical_project' | 'software_skill'

export interface AcademicRecord {
  id: string
  enrollment_id: string
  module_id: string | null
  type: AcademicRecordType
  title: string
  status: 'not_started' | 'in_progress' | 'completed'
  score: number | null
  max_score: number | null
  notes: string | null
  evidence_url: string | null
  assessed_at: string | null
  created_at: string
  updated_at: string
  module?: Module
}

export interface EnrollmentReport {
  course_title: string
  batch_name: string
  total_enrolled: number
  completed: number
  pending: number
  cancelled: number
  revenue: number
}

export interface AttendanceReport {
  student_name: string
  student_id: string
  batch_name: string
  total_sessions: number
  present: number
  absent: number
  attendance_percentage: number
}

export interface IMSDashboardStats {
  totalStaff: number
  activeLeads: number
  convertedLeads: number
  totalRevenue: number
  pendingPayments: number
  pendingLeaves: number
  openTasks: number
  totalStudents: number
}

export interface ImsAcademicStudent {
  id: string
  student_name: string
  student_id: string
  email: string | null
  phone: string | null
  nic: string | null
  dob: string | null
  batch_code: string | null
  course_id: string | null
  course_name: string | null
  enrollment_date: string
  source: 'direct' | 'marketing_lead'
  lead_id: string | null
  payment_status: 'pending' | 'paid' | 'partial'
  status: 'active' | 'completed' | 'dropped'
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── LECTURER ────────────────────────────────────────────────
export interface Lecturer {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  specialization: string | null
  qualification: string | null
  department: string | null
  status: 'Active' | 'Inactive'
  avatar_url: string | null
  created_at: string
}

// ── LEAD CONFIRMATION (Cross-dashboard workflow) ────────────
export type LeadConfirmationStage = 'marketing_confirmed' | 'finance_confirmed' | 'academic_confirmed'

export interface LeadConfirmation {
  id: string
  lead_id: string
  lead_name: string
  contact: string | null
  email: string | null
  course_interested: string | null
  stage: LeadConfirmationStage
  marketing_confirmed_by: string | null
  marketing_confirmed_at: string | null
  finance_confirmed_by: string | null
  finance_confirmed_at: string | null
  academic_confirmed_by: string | null
  academic_confirmed_at: string | null
  payment_amount: number | null
  payment_method: string | null
  batch_id: string | null
  student_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── BATCH CODE / STUDENT ID HELPERS ─────────────────────────
export type TimeCode = 'M' | 'A' | 'E'  // Morning, Afternoon, Evening
export type TypeCode = 'G' | 'I'         // Group, Individual
