-- ============================================================================
-- CADD CENTRE LANKA — LIVE RLS FIX
-- Run this in Supabase SQL Editor to fix permissions for all roles
-- ============================================================================

-- Helper: Check if user is a full admin (super_admin or admin)
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is any staff member (non-student, non-lecturer)
CREATE OR REPLACE FUNCTION public.is_staff_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin','admin','academic_head','academic_officer',
                 'finance_head','finance_officer','marketing_head','marketing_officer',
                 'hr_head','hr_officer','staff','lecturer')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is academic staff (head or officer)
CREATE OR REPLACE FUNCTION public.is_academic_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin','admin','academic_head','academic_officer')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is academic HEAD specifically
CREATE OR REPLACE FUNCTION public.is_academic_head()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin','admin','academic_head')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════
-- DROP existing policies that may conflict
-- ════════════════════════════════════════════════════════════
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════
-- PROFILES — All staff can read, users can read own
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_full_admin());

-- ════════════════════════════════════════════════════════════
-- COURSES — Public read, academic_head + admin can write
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_all" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "courses_write_academic_head" ON public.courses
  FOR ALL USING (public.is_academic_head());

-- ════════════════════════════════════════════════════════════
-- MODULES — Public read, academic_head + admin can write
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_select_all" ON public.modules
  FOR SELECT USING (true);

CREATE POLICY "modules_write_academic_head" ON public.modules
  FOR ALL USING (public.is_academic_head());

-- ════════════════════════════════════════════════════════════
-- BATCHES — Academic roles can read, academic roles can write
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_select_all" ON public.batches
  FOR SELECT USING (true);

CREATE POLICY "batches_write_academic" ON public.batches
  FOR INSERT WITH CHECK (public.is_academic_role());

CREATE POLICY "batches_update_academic" ON public.batches
  FOR UPDATE USING (public.is_academic_role());

CREATE POLICY "batches_delete_admin" ON public.batches
  FOR DELETE USING (public.is_full_admin());

-- ════════════════════════════════════════════════════════════
-- LECTURER ALLOCATIONS — Academic roles can manage
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.lecturer_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lec_alloc_select_staff" ON public.lecturer_allocations
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "lec_alloc_write_academic" ON public.lecturer_allocations
  FOR ALL USING (public.is_academic_role());

-- ════════════════════════════════════════════════════════════
-- ENROLLMENTS — Academic head + admin can manage
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_own" ON public.enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "enrollments_select_staff" ON public.enrollments
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "enrollments_write_academic_head" ON public.enrollments
  FOR ALL USING (public.is_academic_head());

-- ════════════════════════════════════════════════════════════
-- ATTENDANCE — Staff can read, academic roles can write
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_staff" ON public.attendance
  FOR SELECT USING (public.is_staff_member() OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "attendance_write_academic" ON public.attendance
  FOR ALL USING (public.is_academic_role());

-- ════════════════════════════════════════════════════════════
-- ASSESSMENTS — Academic roles can manage
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_select_staff" ON public.assessments
  FOR SELECT USING (public.is_staff_member() OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "assessments_write_academic" ON public.assessments
  FOR ALL USING (public.is_academic_role());

-- ════════════════════════════════════════════════════════════
-- CERTIFICATES — Staff read, academic head write
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certs_select_all" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "certs_write_academic_head" ON public.certificates
  FOR ALL USING (public.is_academic_head());

-- ════════════════════════════════════════════════════════════
-- CONTACT MESSAGES — Anyone can insert, staff can read
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_insert_anyone" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_select_staff" ON public.contact_messages
  FOR SELECT USING (public.is_staff_member());

-- ════════════════════════════════════════════════════════════
-- EVENTS — Public read, staff manage
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_write_staff" ON public.events
  FOR ALL USING (public.is_staff_member());

-- ════════════════════════════════════════════════════════════
-- IMS TABLES — Marketing, Finance, HR (department-specific)
-- ════════════════════════════════════════════════════════════

-- Marketing Leads
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_leads') THEN
  ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "mkt_leads_staff" ON public.marketing_leads FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- Lead Confirmations
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_confirmations') THEN
  ALTER TABLE public.lead_confirmations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "lead_conf_staff" ON public.lead_confirmations FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- IMS Payments
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ims_payments') THEN
  ALTER TABLE public.ims_payments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ims_pay_staff" ON public.ims_payments FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- IMS Invoices
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ims_invoices') THEN
  ALTER TABLE public.ims_invoices ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ims_inv_staff" ON public.ims_invoices FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- IMS Expenses
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ims_expenses') THEN
  ALTER TABLE public.ims_expenses ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ims_exp_staff" ON public.ims_expenses FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- HR tables
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hr_leave_requests') THEN
  ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "hr_leave_staff" ON public.hr_leave_requests FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- Ops Tasks
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ops_tasks') THEN
  ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ops_tasks_staff" ON public.ops_tasks FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- Staff Attendance
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_attendance') THEN
  ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "staff_att_staff" ON public.staff_attendance FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- Notifications
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "notif_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "notif_staff_write" ON public.notifications FOR ALL USING (public.is_staff_member());
END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════
