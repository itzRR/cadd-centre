-- ============================================================================
-- CADD CENTRE LANKA — LECTURER RLS FIX
-- Run this in Supabase SQL Editor to allow lecturer role to read academic data
-- ============================================================================

-- Update is_staff_member() to include 'lecturer'
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

-- Also update is_staff() to be consistent (in case it was re-created)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role NOT IN ('student','guest','parent_guardian')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ensure lecturer_allocations has a policy for lecturer read access
-- (lecturer can see their own allocations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lecturer_allocations' AND policyname = 'Lecturers see own allocations'
  ) THEN
    CREATE POLICY "Lecturers see own allocations" ON public.lecturer_allocations
      FOR SELECT USING (lecturer_id = auth.uid());
  END IF;
END $$;
