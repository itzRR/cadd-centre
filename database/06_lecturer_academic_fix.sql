-- Fix for Grade & Attendance Issues
-- Update is_academic_role() to include 'lecturer' so they can update assessments and mark attendance.

CREATE OR REPLACE FUNCTION public.is_academic_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin','admin','academic_head','academic_officer','lecturer')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
