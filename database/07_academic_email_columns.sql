-- ============================================================================
-- CADD CENTRE LANKA — STUDENT TABLE SEPARATION
-- Run this in Supabase SQL Editor AFTER all previous migrations
-- Creates a separate `students` table and decouples students from `profiles`
-- ============================================================================

-- 1. Create the students table (linked to auth.users, NOT profiles)
CREATE TABLE IF NOT EXISTS public.students (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,                  -- academic email (login email)
  personal_email    TEXT,                            -- original personal email
  full_name         TEXT NOT NULL,
  student_id        TEXT UNIQUE,                     -- e.g. ACAD12MAY26MG01
  academic_email    TEXT,                             -- studentId@caddcentre.lk
  academic_password TEXT,                             -- default password = student ID
  phone             TEXT,
  nic               TEXT,
  dob               DATE,
  avatar_url        TEXT,
  address           TEXT,
  gender            TEXT,
  guardian_name     TEXT,
  guardian_phone    TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  education_background    TEXT,
  -- Academic
  course_name       TEXT,
  batch_code        TEXT,
  course_id         UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id          UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  enrollment_date   DATE DEFAULT CURRENT_DATE,
  source            TEXT DEFAULT 'lead_pipeline',
  lead_id           TEXT,
  payment_status    TEXT DEFAULT 'paid',
  status            TEXT DEFAULT 'active',            -- active, inactive, graduated, suspended
  branch_id         UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  -- Timestamps
  disabled          BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_active       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.students IS 'Dedicated student table — separated from staff profiles';

-- 2. Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_email ON public.students(academic_email) WHERE academic_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_personal_email ON public.students(personal_email) WHERE personal_email IS NOT NULL;

-- 3. Allow enrollments.user_id to reference EITHER profiles OR students
-- We change the FK to reference auth.users directly (parent of both tables)
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Same for attendance.marked_by (can be a student via enrollment)
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;

-- 5. RLS policies for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can read their own record
CREATE POLICY students_self_read ON public.students
  FOR SELECT USING (auth.uid() = id);

-- Students can update their own record
CREATE POLICY students_self_update ON public.students
  FOR UPDATE USING (auth.uid() = id);

-- Staff can read all students
CREATE POLICY students_staff_read ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin','academic_head','academic_officer','finance_head','finance_officer','marketing_head','marketing_officer','hr_head','hr_officer','staff','lecturer')
    )
  );

-- Staff can insert students
CREATE POLICY students_staff_insert ON public.students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin','academic_head','academic_officer','finance_head','finance_officer')
    )
  );

-- Staff can update students
CREATE POLICY students_staff_update ON public.students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin','academic_head','academic_officer')
    )
  );

-- 6. Migrate existing student records from profiles to students table
-- (Run this only once — it copies student profiles into the new students table)
INSERT INTO public.students (id, email, full_name, student_id, phone, nic, avatar_url, address, gender, dob, guardian_name, guardian_phone, emergency_contact_name, emergency_contact_phone, education_background, branch_id, disabled, is_active, last_active, created_at, updated_at)
SELECT id, email, full_name, student_id, phone, nic, avatar_url, address, gender, date_of_birth, guardian_name, guardian_phone, emergency_contact_name, emergency_contact_phone, education_background, branch_id, disabled, is_active, last_active, created_at, updated_at
FROM public.profiles
WHERE role = 'student'
ON CONFLICT (id) DO NOTHING;

-- 7. Remove student records from profiles (they now live in students table)
-- UNCOMMENT this line ONLY after verifying the migration worked:
-- DELETE FROM public.profiles WHERE role = 'student';
