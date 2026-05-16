-- ============================================================================
-- PHASE 1 RLS & PERMISSION FIXES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── FIX #0: Allow anonymous users to INSERT into marketing_leads ──
-- This is needed for the public course enquiry form
GRANT INSERT ON public.marketing_leads TO anon;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anon can submit enquiries" ON public.marketing_leads;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anon can submit enquiries"
  ON public.marketing_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── FIX #7: Ensure staff can update marketing_leads status ──
-- The existing policy uses is_staff() but let's make sure it covers UPDATE explicitly
-- Drop and recreate to be safe
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access marketing leads" ON public.marketing_leads;
  DROP POLICY IF EXISTS "mkt_leads_staff" ON public.marketing_leads;
  DROP POLICY IF EXISTS "Staff full access marketing leads" ON public.marketing_leads;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access marketing leads"
  ON public.marketing_leads
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── FIX #10: Ensure system_commands and login_history are accessible ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access system commands" ON public.ims_system_commands;
  DROP POLICY IF EXISTS "Staff access login history" ON public.ims_login_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff access system commands"
  ON public.ims_system_commands
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Staff access login history"
  ON public.ims_login_history
  FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ── FIX #11: Ensure ims_payments has proper write policies ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access payments" ON public.ims_payments;
  DROP POLICY IF EXISTS "Staff full access payments" ON public.ims_payments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access payments"
  ON public.ims_payments
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── FIX: Ensure lead_confirmations has proper write policies ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access lead confirmations" ON public.lead_confirmations;
  DROP POLICY IF EXISTS "Staff full access lead confirmations" ON public.lead_confirmations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access lead confirmations"
  ON public.lead_confirmations
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── FIX: Ensure ims_invoices has proper write policies ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access invoices" ON public.ims_invoices;
  DROP POLICY IF EXISTS "Staff full access invoices" ON public.ims_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access invoices"
  ON public.ims_invoices
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── FIX: Ensure ims_expenses has proper write policies ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff access expenses" ON public.ims_expenses;
  DROP POLICY IF EXISTS "Staff full access expenses" ON public.ims_expenses;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access expenses"
  ON public.ims_expenses
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── FIX: Grant anon access to marketing_leads sequences ──
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ── FIX #3: Restrict lecturer attendance marking to assigned batches ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Lecturers can manage attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Lecturers can manage assigned batch attendance" ON public.attendance;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Lecturers can manage assigned batch attendance" ON public.attendance
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'lecturer'
    AND EXISTS (
      SELECT 1 FROM public.lecturer_allocations
      WHERE lecturer_id = auth.uid()
      AND batch_id = public.attendance.batch_id
    )
  );

-- ── FIX: Ensure students table has proper access policies ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "students_staff_read" ON public.students;
  DROP POLICY IF EXISTS "students_staff_insert" ON public.students;
  DROP POLICY IF EXISTS "students_staff_update" ON public.students;
  DROP POLICY IF EXISTS "Staff full access students" ON public.students;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Staff full access students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Grant explicit table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO service_role;

-- ── VERIFY ──
-- After running, test: 
-- 1. Open course page (not logged in) → click Enroll → submit form → should work
-- 2. Login as marketing user → update lead status → should work
-- 3. Login as finance user → record payment → should work
