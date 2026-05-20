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
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_salary_payouts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createHrSalaryPayoutAction(payout: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_salary_payouts')
    .insert(payout)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data
}

export async function deleteHrSalaryPayoutAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { error } = await supabaseAdmin.from('hr_salary_payouts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getHrPerformanceReviewsAction() {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_performance_reviews')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createHrPerformanceReviewAction(review: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_performance_reviews')
    .insert(review)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data
}

export async function deleteHrPerformanceReviewAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { error } = await supabaseAdmin.from('hr_performance_reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getHrLeaveRequestsAction() {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createHrLeaveRequestAction(leave: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .insert(leave)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data
}

export async function updateHrLeaveRequestAction(id: string, updates: any) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('hr_leave_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data
}

export async function deleteHrLeaveRequestAction(id: string) {
  const user = await getServerCurrentUser()
  if (!user || user.role === 'student') throw new Error("Unauthorized")

  const { error } = await supabaseAdmin.from('hr_leave_requests').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
