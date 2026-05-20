'use server'

import { createClient } from '@supabase/supabase-js'
import { getServerCurrentUser } from './auth-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function getHrSalaryPayoutsAction() {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_salary_payouts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return { data: null, error: error.message }
  return { data: data || [], error: null }
}

export async function createHrSalaryPayoutAction(payout: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_salary_payouts')
    .insert(payout)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteHrSalaryPayoutAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { error: "Unauthorized" }

  const { error } = await supabaseAdmin.from('hr_salary_payouts').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function getHrPerformanceReviewsAction() {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_performance_reviews')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return { data: null, error: error.message }
  return { data: data || [], error: null }
}

export async function createHrPerformanceReviewAction(review: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_performance_reviews')
    .insert(review)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteHrPerformanceReviewAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { error: "Unauthorized" }

  const { error } = await supabaseAdmin.from('hr_performance_reviews').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function getHrLeaveRequestsAction() {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return { data: null, error: error.message }
  return { data: data || [], error: null }
}

export async function createHrLeaveRequestAction(leave: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .insert(leave)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateHrLeaveRequestAction(id: string, updates: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { data: null, error: "Unauthorized" }

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteHrLeaveRequestAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') return { error: "Unauthorized" }

  const { error } = await supabaseAdmin.from('hr_leave_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
