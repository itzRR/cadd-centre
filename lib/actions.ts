/**
 * lib/actions.ts
 * Server Actions - CADD ASMS
 */
'use server'

import { createServerSupabaseClient } from './auth-server'
import { getServerCurrentUser } from './auth-server'

// ── ENROLLMENT ───────────────────────────────────────────────────────────────

export async function enrollInCourseAction(courseId: string, batchId?: string) {
  const user = await getServerCurrentUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('enrollments').select('id')
    .eq('user_id', user.id).eq('course_id', courseId).single()

  if (existing) return { data: null, error: 'already_enrolled' }

  const { data: course } = await supabase
    .from('courses').select('price, title')
    .eq('id', courseId).single()

  if (!course) return { data: null, error: 'Course not found' }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      batch_id: batchId || null,
      status: 'confirmed',
      payment_status: 'paid',
      amount_paid: course.price,
    })
    .select().single()

  if (error) return { data: null, error: error.message }

  if (batchId) {
    await supabase.rpc('increment_batch_enrolled', { p_batch_id: batchId })
  }

  console.log(`📧 Enrollment → ${user.email} for "${course.title}"`)
  return { data, error: null }
}

export async function getUserEnrollmentsAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*, modules(*)), batches(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function checkEnrollmentAction(courseId: string): Promise<boolean> {
  const user = await getServerCurrentUser()
  if (!user) return false

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('enrollments').select('id')
    .eq('user_id', user.id).eq('course_id', courseId).single()

  return !!data
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

export async function updateProfileAction(updates: {
  full_name?: string; phone?: string; education_background?: string
  specialization?: string; bio?: string; avatar_url?: string
}) {
  const user = await getServerCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return { error: error?.message || null }
}

export async function getFullProfileAction() {
  const user = await getServerCurrentUser()
  if (!user) return null

  const supabase = await createServerSupabaseClient()

  // Try profiles first (staff members)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile) return { ...profile, _source: 'profiles' }

  // Fallback to students table
  const { data: student } = await supabase.from('students').select('*').eq('id', user.id).single()
  if (student) return { ...student, role: 'student', _source: 'students' }

  return null
}

// ── STUDENT ATTENDANCE ────────────────────────────────────────────────────────

export async function getMyAttendanceAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()
  const { data: enrollments } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id)

  if (!enrollments || enrollments.length === 0) return []

  const enrollmentIds = enrollments.map(e => e.id)
  const { data } = await supabase
    .from('attendance')
    .select('*, batches(name)')
    .in('enrollment_id', enrollmentIds)
    .order('date', { ascending: false })

  return data || []
}

// ── STUDENT CERTIFICATES ──────────────────────────────────────────────────────

export async function getMyCertificatesAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('certificates')
    .select('*, courses(title, level)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  return data || []
}

// ── STUDENT ASSESSMENTS ───────────────────────────────────────────────────────

export async function getMyAssessmentsAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()
  const { data: enrollments } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id)

  if (!enrollments || enrollments.length === 0) return []

  const enrollmentIds = enrollments.map(e => e.id)
  const { data } = await supabase
    .from('assessments')
    .select('*, modules(title), enrollments(courses(title))')
    .in('enrollment_id', enrollmentIds)
    .order('conducted_at', { ascending: false })

  return data || []
}

// ── LEARNING RESOURCES ────────────────────────────────────────────────────────

export async function getMyResourcesAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user.id)
    .in('status', ['confirmed', 'completed'])

  if (!enrollments || enrollments.length === 0) return []

  const courseIds = enrollments.map(e => e.course_id)
  const { data } = await supabase
    .from('learning_resources')
    .select('*, modules(title), courses(title)')
    .in('course_id', courseIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data || []
}


// ── EVENT REGISTRATION ──────────────────────────────────────────────────────

export async function checkEventRegistrationAction(eventId: string): Promise<boolean> {
  const user = await getServerCurrentUser()
  if (!user) return false

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  return !!data
}

export async function registerForEventAction(eventId: string) {
  const user = await getServerCurrentUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) return { data: null, error: 'already_registered' }

  const { data: event } = await supabase
    .from('events')
    .select('id, title, price, capacity, booked_count')
    .eq('id', eventId)
    .single()

  if (!event) return { data: null, error: 'Event not found' }
  if ((event.booked_count || 0) >= event.capacity) return { data: null, error: 'Event is fully booked' }

  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      user_id: user.id,
      event_id: eventId,
      quantity: 1,
      status: 'confirmed',
      payment_status: event.price > 0 ? 'paid' : 'paid',
      amount_paid: event.price || 0,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  await supabase.rpc('increment_event_booked', { p_event_id: eventId })
  console.log(`Event registration -> ${user.email} for "${event.title}"`)
  return { data, error: null }
}


// ── STUDENT PROGRESS OVERVIEW ───────────────────────────────────────────────

export async function getMyProgressOverviewAction() {
  const user = await getServerCurrentUser()
  if (!user) return []

  const supabase = await createServerSupabaseClient()
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, status, courses(*, modules(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!enrollments || enrollments.length === 0) return []

  const enrollmentIds = enrollments.map((e: any) => e.id)
  const { data: progressRows } = await supabase
    .from('module_progress')
    .select('*, modules(title, duration_hours, order_index)')
    .in('enrollment_id', enrollmentIds)

  const { data: records } = await supabase
    .from('academic_records')
    .select('*, modules(title, duration_hours, order_index)')
    .in('enrollment_id', enrollmentIds)

  return enrollments.map((enrollment: any) => ({
    ...enrollment,
    progress_rows: (progressRows || []).filter((p: any) => p.enrollment_id === enrollment.id),
    academic_records: (records || []).filter((r: any) => r.enrollment_id === enrollment.id),
  }))
}
