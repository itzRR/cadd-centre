// ── Academic Module — localStorage Data Layer ──────────────────────────────
// All academic data is stored in localStorage until the database is rebuilt.

// ── TYPES ───────────────────────────────────────────────────────────────────

export interface Batch {
  id: string
  name: string
  courseId: string | null
  lecturerId: string | null
  studentIds: string[]
  startDate: string
  endDate: string | null
  status: 'upcoming' | 'active' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  studentId: string
  fullName: string
  email: string
  phone: string | null
  address: string | null
  gender: string | null
  guardianName: string | null
  guardianPhone: string | null
  educationBackground: string | null
  registrationDate: string
  status: 'active' | 'inactive' | 'graduated' | 'withdrawn'
  createdAt: string
  updatedAt: string
}

export interface Lecturer {
  id: string
  lecturerId: string
  fullName: string
  email: string
  phone: string | null
  specialization: string | null
  employmentStatus: 'active' | 'on_leave' | 'resigned'
  joiningDate: string
  availability: string | null
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  name: string
  code: string | null
  duration: string | null
  category: string | null
  level: string | null
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CourseModule {
  id: string
  courseId: string
  name: string
  description: string | null
  orderIndex: number
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  batchId: string
  studentId: string
  date: string
  session: string | null
  status: 'present' | 'absent' | 'late'
  markedAt: string
}

export interface Assessment {
  id: string
  batchId: string
  name: string
  type: 'exam' | 'assignment' | 'quiz' | 'project' | 'practical'
  dueDate: string | null
  maxMarks: number
  markingScheme: string | null
  status: 'draft' | 'published' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface AssessmentSubmission {
  id: string
  assessmentId: string
  studentId: string
  marksObtained: number | null
  grade: string | null
  submissionStatus: 'pending' | 'submitted' | 'graded'
  fileAttachments: string[]
  submittedAt: string | null
  gradedAt: string | null
}

export interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityName: string
  timestamp: string
}

// ── STORAGE KEYS ────────────────────────────────────────────────────────────

const KEYS = {
  batches: 'acad_batches',
  students: 'acad_students',
  lecturers: 'acad_lecturers',
  courses: 'acad_courses',
  modules: 'acad_modules',
  attendance: 'acad_attendance',
  assessments: 'acad_assessments',
  submissions: 'acad_submissions',
  activity: 'acad_activity',
} as const

// ── HELPERS ─────────────────────────────────────────────────────────────────

function genId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

function logActivity(action: string, entityType: string, entityName: string) {
  const logs = load<ActivityLog>(KEYS.activity)
  logs.unshift({ id: genId(), action, entityType, entityName, timestamp: now() })
  if (logs.length > 50) logs.length = 50
  save(KEYS.activity, logs)
}

function genStudentId(): string {
  const students = load<Student>(KEYS.students)
  const num = students.length + 1
  return `CADDSTU${String(num).padStart(4, '0')}`
}

function genLecturerId(): string {
  const lecturers = load<Lecturer>(KEYS.lecturers)
  const num = lecturers.length + 1
  return `CADDLEC${String(num).padStart(4, '0')}`
}

// ── BATCH CRUD ──────────────────────────────────────────────────────────────

export function getBatches(): Batch[] {
  return load<Batch>(KEYS.batches)
}

export function getBatchById(id: string): Batch | undefined {
  return getBatches().find(b => b.id === id)
}

export function createBatch(data: { name: string; startDate: string; endDate?: string | null; courseId?: string | null; lecturerId?: string | null; studentIds?: string[] }): Batch {
  const batches = getBatches()
  if (batches.some(b => b.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error('Batch name already exists')
  }
  if (data.endDate && data.endDate < data.startDate) {
    throw new Error('End date must not be earlier than start date')
  }
  const today = new Date().toISOString().slice(0, 10)
  let status: Batch['status'] = 'upcoming'
  if (data.startDate <= today && (!data.endDate || data.endDate >= today)) status = 'active'
  if (data.endDate && data.endDate < today) status = 'completed'

  const batch: Batch = {
    id: genId(), name: data.name, courseId: data.courseId || null, lecturerId: data.lecturerId || null,
    studentIds: data.studentIds || [], startDate: data.startDate, endDate: data.endDate || null,
    status, createdAt: now(), updatedAt: now(),
  }
  batches.unshift(batch)
  save(KEYS.batches, batches)
  logActivity('Created', 'Batch', batch.name)
  return batch
}

export function updateBatch(id: string, updates: Partial<Omit<Batch, 'id' | 'createdAt'>>): Batch {
  const batches = getBatches()
  const idx = batches.findIndex(b => b.id === id)
  if (idx === -1) throw new Error('Batch not found')
  if (updates.name && updates.name.toLowerCase() !== batches[idx].name.toLowerCase()) {
    if (batches.some(b => b.id !== id && b.name.toLowerCase() === updates.name!.toLowerCase())) {
      throw new Error('Batch name already exists')
    }
  }
  const startDate = updates.startDate || batches[idx].startDate
  const endDate = updates.endDate !== undefined ? updates.endDate : batches[idx].endDate
  if (endDate && endDate < startDate) throw new Error('End date must not be earlier than start date')

  const today = new Date().toISOString().slice(0, 10)
  let status: Batch['status'] = updates.status || batches[idx].status
  if (!updates.status) {
    if (startDate <= today && (!endDate || endDate >= today)) status = 'active'
    else if (startDate > today) status = 'upcoming'
    else if (endDate && endDate < today) status = 'completed'
  }

  batches[idx] = { ...batches[idx], ...updates, status, updatedAt: now() }
  save(KEYS.batches, batches)
  logActivity('Updated', 'Batch', batches[idx].name)
  return batches[idx]
}

export function deleteBatch(id: string): void {
  const batches = getBatches()
  const batch = batches.find(b => b.id === id)
  save(KEYS.batches, batches.filter(b => b.id !== id))
  if (batch) logActivity('Deleted', 'Batch', batch.name)
}

// ── STUDENT CRUD ────────────────────────────────────────────────────────────

export function getStudents(): Student[] {
  return load<Student>(KEYS.students)
}

export function getStudentById(id: string): Student | undefined {
  return getStudents().find(s => s.id === id)
}

export function getStudentsByBatch(batchId: string): Student[] {
  const batch = getBatchById(batchId)
  if (!batch) return []
  const students = getStudents()
  return students.filter(s => batch.studentIds.includes(s.id))
}

export function createStudent(data: Omit<Student, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>): Student {
  const students = getStudents()
  const student: Student = {
    ...data, id: genId(), studentId: genStudentId(), createdAt: now(), updatedAt: now(),
  }
  students.unshift(student)
  save(KEYS.students, students)
  logActivity('Registered', 'Student', student.fullName)
  return student
}

export function updateStudent(id: string, updates: Partial<Omit<Student, 'id' | 'studentId' | 'createdAt'>>): Student {
  const students = getStudents()
  const idx = students.findIndex(s => s.id === id)
  if (idx === -1) throw new Error('Student not found')
  students[idx] = { ...students[idx], ...updates, updatedAt: now() }
  save(KEYS.students, students)
  logActivity('Updated', 'Student', students[idx].fullName)
  return students[idx]
}

export function deleteStudent(id: string): void {
  const students = getStudents()
  const student = students.find(s => s.id === id)
  save(KEYS.students, students.filter(s => s.id !== id))
  // Also remove from all batches
  const batches = getBatches()
  batches.forEach(b => { b.studentIds = b.studentIds.filter(sid => sid !== id) })
  save(KEYS.batches, batches)
  if (student) logActivity('Deleted', 'Student', student.fullName)
}

// ── LECTURER CRUD ───────────────────────────────────────────────────────────

export function getLecturers(): Lecturer[] {
  return load<Lecturer>(KEYS.lecturers)
}

export function getLecturerById(id: string): Lecturer | undefined {
  return getLecturers().find(l => l.id === id)
}

export function createLecturer(data: Omit<Lecturer, 'id' | 'lecturerId' | 'createdAt' | 'updatedAt'>): Lecturer {
  const lecturers = getLecturers()
  const lecturer: Lecturer = {
    ...data, id: genId(), lecturerId: genLecturerId(), createdAt: now(), updatedAt: now(),
  }
  lecturers.unshift(lecturer)
  save(KEYS.lecturers, lecturers)
  logActivity('Added', 'Lecturer', lecturer.fullName)
  return lecturer
}

export function updateLecturer(id: string, updates: Partial<Omit<Lecturer, 'id' | 'lecturerId' | 'createdAt'>>): Lecturer {
  const lecturers = getLecturers()
  const idx = lecturers.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Lecturer not found')
  lecturers[idx] = { ...lecturers[idx], ...updates, updatedAt: now() }
  save(KEYS.lecturers, lecturers)
  logActivity('Updated', 'Lecturer', lecturers[idx].fullName)
  return lecturers[idx]
}

export function deleteLecturer(id: string): void {
  const lecturers = getLecturers()
  const lecturer = lecturers.find(l => l.id === id)
  save(KEYS.lecturers, lecturers.filter(l => l.id !== id))
  // Remove from batches
  const batches = getBatches()
  batches.forEach(b => { if (b.lecturerId === id) b.lecturerId = null })
  save(KEYS.batches, batches)
  if (lecturer) logActivity('Deleted', 'Lecturer', lecturer.fullName)
}

// ── COURSE CRUD ─────────────────────────────────────────────────────────────

export function getCourses(): Course[] {
  return load<Course>(KEYS.courses)
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find(c => c.id === id)
}

export function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
  const courses = getCourses()
  const course: Course = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
  courses.unshift(course)
  save(KEYS.courses, courses)
  logActivity('Added', 'Course', course.name)
  return course
}

export function updateCourse(id: string, updates: Partial<Omit<Course, 'id' | 'createdAt'>>): Course {
  const courses = getCourses()
  const idx = courses.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Course not found')
  courses[idx] = { ...courses[idx], ...updates, updatedAt: now() }
  save(KEYS.courses, courses)
  logActivity('Updated', 'Course', courses[idx].name)
  return courses[idx]
}

export function deleteCourseFromStore(id: string): void {
  const courses = getCourses()
  const course = courses.find(c => c.id === id)
  save(KEYS.courses, courses.filter(c => c.id !== id))
  // Remove modules
  const modules = getModules().filter(m => m.courseId !== id)
  save(KEYS.modules, modules)
  // Clear from batches
  const batches = getBatches()
  batches.forEach(b => { if (b.courseId === id) b.courseId = null })
  save(KEYS.batches, batches)
  if (course) logActivity('Deleted', 'Course', course.name)
}

// ── MODULE CRUD ─────────────────────────────────────────────────────────────

export function getModules(): CourseModule[] {
  return load<CourseModule>(KEYS.modules)
}

export function getModulesByCourse(courseId: string): CourseModule[] {
  return getModules().filter(m => m.courseId === courseId).sort((a, b) => a.orderIndex - b.orderIndex)
}

export function createModule(data: Omit<CourseModule, 'id' | 'createdAt'>): CourseModule {
  const modules = getModules()
  const mod: CourseModule = { ...data, id: genId(), createdAt: now() }
  modules.push(mod)
  save(KEYS.modules, modules)
  logActivity('Added Module', 'Course', data.name)
  return mod
}

export function updateModule(id: string, updates: Partial<Omit<CourseModule, 'id' | 'createdAt'>>): CourseModule {
  const modules = getModules()
  const idx = modules.findIndex(m => m.id === id)
  if (idx === -1) throw new Error('Module not found')
  modules[idx] = { ...modules[idx], ...updates }
  save(KEYS.modules, modules)
  return modules[idx]
}

export function deleteModule(id: string): void {
  save(KEYS.modules, getModules().filter(m => m.id !== id))
}

// ── ATTENDANCE CRUD ─────────────────────────────────────────────────────────

export function getAttendance(): AttendanceRecord[] {
  return load<AttendanceRecord>(KEYS.attendance)
}

export function getAttendanceByBatch(batchId: string): AttendanceRecord[] {
  return getAttendance().filter(a => a.batchId === batchId)
}

export function getAttendanceByDate(batchId: string, date: string): AttendanceRecord[] {
  return getAttendance().filter(a => a.batchId === batchId && a.date === date)
}

export function markAttendance(records: { batchId: string; studentId: string; date: string; session?: string; status: 'present' | 'absent' | 'late' }[]): AttendanceRecord[] {
  const all = getAttendance()
  const created: AttendanceRecord[] = []
  for (const rec of records) {
    // Remove existing record for same student/date/batch
    const existIdx = all.findIndex(a => a.batchId === rec.batchId && a.studentId === rec.studentId && a.date === rec.date)
    if (existIdx !== -1) all.splice(existIdx, 1)
    const record: AttendanceRecord = { id: genId(), batchId: rec.batchId, studentId: rec.studentId, date: rec.date, session: rec.session || null, status: rec.status, markedAt: now() }
    all.unshift(record)
    created.push(record)
  }
  save(KEYS.attendance, all)
  if (records.length > 0) {
    const batch = getBatchById(records[0].batchId)
    logActivity('Marked Attendance', 'Batch', batch?.name || 'Unknown')
  }
  return created
}

// ── ASSESSMENT CRUD ─────────────────────────────────────────────────────────

export function getAssessments(): Assessment[] {
  return load<Assessment>(KEYS.assessments)
}

export function getAssessmentsByBatch(batchId: string): Assessment[] {
  return getAssessments().filter(a => a.batchId === batchId)
}

export function createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Assessment {
  const assessments = getAssessments()
  const assessment: Assessment = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
  assessments.unshift(assessment)
  save(KEYS.assessments, assessments)
  logActivity('Created Assessment', 'Batch', data.name)
  return assessment
}

export function updateAssessment(id: string, updates: Partial<Omit<Assessment, 'id' | 'createdAt'>>): Assessment {
  const assessments = getAssessments()
  const idx = assessments.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Assessment not found')
  assessments[idx] = { ...assessments[idx], ...updates, updatedAt: now() }
  save(KEYS.assessments, assessments)
  return assessments[idx]
}

export function deleteAssessment(id: string): void {
  save(KEYS.assessments, getAssessments().filter(a => a.id !== id))
  save(KEYS.submissions, getSubmissions().filter(s => s.assessmentId !== id))
}

// ── SUBMISSION CRUD ─────────────────────────────────────────────────────────

export function getSubmissions(): AssessmentSubmission[] {
  return load<AssessmentSubmission>(KEYS.submissions)
}

export function getSubmissionsByAssessment(assessmentId: string): AssessmentSubmission[] {
  return getSubmissions().filter(s => s.assessmentId === assessmentId)
}

export function upsertSubmission(data: { assessmentId: string; studentId: string; marksObtained?: number | null; grade?: string | null; submissionStatus: AssessmentSubmission['submissionStatus']; fileAttachments?: string[] }): AssessmentSubmission {
  const subs = getSubmissions()
  const existIdx = subs.findIndex(s => s.assessmentId === data.assessmentId && s.studentId === data.studentId)
  if (existIdx !== -1) {
    subs[existIdx] = { ...subs[existIdx], ...data, marksObtained: data.marksObtained ?? subs[existIdx].marksObtained, grade: data.grade ?? subs[existIdx].grade, fileAttachments: data.fileAttachments || subs[existIdx].fileAttachments, submittedAt: data.submissionStatus === 'submitted' ? now() : subs[existIdx].submittedAt, gradedAt: data.submissionStatus === 'graded' ? now() : subs[existIdx].gradedAt }
    save(KEYS.submissions, subs)
    return subs[existIdx]
  }
  const sub: AssessmentSubmission = { id: genId(), assessmentId: data.assessmentId, studentId: data.studentId, marksObtained: data.marksObtained ?? null, grade: data.grade ?? null, submissionStatus: data.submissionStatus, fileAttachments: data.fileAttachments || [], submittedAt: data.submissionStatus === 'submitted' ? now() : null, gradedAt: data.submissionStatus === 'graded' ? now() : null }
  subs.unshift(sub)
  save(KEYS.submissions, subs)
  return sub
}

// ── ACTIVITY LOG ────────────────────────────────────────────────────────────

export function getActivityLog(): ActivityLog[] {
  return load<ActivityLog>(KEYS.activity)
}

// ── DASHBOARD STATS ─────────────────────────────────────────────────────────

export function getAcademicStats() {
  const batches = getBatches()
  const students = getStudents()
  const lecturers = getLecturers()
  const courses = getCourses()
  const attendance = getAttendance()
  const assessments = getAssessments()
  const submissions = getSubmissions()

  const activeBatches = batches.filter(b => b.status === 'active').length
  const completedBatches = batches.filter(b => b.status === 'completed').length
  const upcomingBatches = batches.filter(b => b.status === 'upcoming').length

  // Batch attendance summaries
  const batchAttendance = batches.slice(0, 5).map(b => {
    const records = attendance.filter(a => a.batchId === b.id)
    const present = records.filter(r => r.status === 'present').length
    const total = records.length
    return { batchName: b.name, batchId: b.id, rate: total > 0 ? Math.round((present / total) * 100) : 0, total }
  })

  // Batch performance summaries
  const batchPerformance = batches.slice(0, 5).map(b => {
    const batchAssessments = assessments.filter(a => a.batchId === b.id)
    const batchSubs = submissions.filter(s => batchAssessments.some(a => a.id === s.assessmentId) && s.marksObtained !== null)
    const avg = batchSubs.length > 0 ? Math.round(batchSubs.reduce((sum, s) => sum + (s.marksObtained || 0), 0) / batchSubs.length) : 0
    return { batchName: b.name, batchId: b.id, avgScore: avg, totalAssessments: batchAssessments.length }
  })

  // Pending alerts
  const alerts: string[] = []
  batches.filter(b => b.status === 'active').forEach(b => {
    if (!b.lecturerId) alerts.push(`Batch "${b.name}" has no lecturer assigned`)
    if (b.studentIds.length === 0) alerts.push(`Batch "${b.name}" has no students`)
    if (!b.courseId) alerts.push(`Batch "${b.name}" has no course assigned`)
  })

  return {
    totalBatches: batches.length, totalStudents: students.length,
    totalLecturers: lecturers.length, totalCourses: courses.length,
    activeBatches, completedBatches, upcomingBatches,
    batchAttendance, batchPerformance, alerts,
    recentActivity: getActivityLog().slice(0, 10),
  }
}
