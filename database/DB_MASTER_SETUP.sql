-- ============================================================================
-- CADD CENTRE LANKA — DB_MASTER_SETUP.sql
-- COMPLETE UNIFIED DATABASE SETUP SCRIPT
-- Generated: 2026-05-16
-- ============================================================================
-- INSTRUCTIONS:
--   1. Go to your Supabase project dashboard -> SQL Editor
--   2. Paste the ENTIRE contents of this file and click "Run"
--   3. This sets up ALL tables, RLS policies, functions, triggers,
--      views, seed data, and migrations for both ASMS and IMS.
--   WARNING: This will drop and recreate all public tables.
-- ============================================================================
-- Consolidated from:
--   01_foundation.sql, 02_ims_and_system.sql, 03_indexes_and_rls.sql,
--   04a_functions_triggers.sql, 04b_views_seed.sql, 05_live_rls_fix.sql,
--   06_lecturer_rls_fix.sql, 07_academic_email_columns.sql
-- ============================================================================
-- ============================================================================
-- CADD CENTRE LANKA â€” ENTERPRISE DATABASE ARCHITECTURE
-- Part 1: Foundation â€” Extensions, Schemas, Enums, Core Tables
-- Target: PostgreSQL 15+ / Supabase
-- ============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. EXTENSIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- composite GIN indexes
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. SCHEMAS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- public  â†’ all application tables (Supabase default)
-- audit   â†’ audit trails and change logs
-- archive â†’ soft-deleted / archived records

CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS archive;

COMMENT ON SCHEMA public  IS 'Primary application schema â€“ all ASMS + IMS tables';
COMMENT ON SCHEMA audit   IS 'Immutable audit trail and change history';
COMMENT ON SCHEMA archive IS 'Soft-deleted and archived records';

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. ENUM TYPES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Unified role enum covering both ASMS and IMS
CREATE TYPE public.user_role AS ENUM (
  'student', 'lecturer',
  'super_admin', 'admin',
  'academic_head', 'academic_officer',
  'finance_head', 'finance_officer',
  'marketing_head', 'marketing_officer',
  'hr_head', 'hr_officer',
  'staff'
);

CREATE TYPE public.permission_key AS ENUM (
  'ims_overview', 'ims_marketing', 'ims_academic', 'ims_finance',
  'ims_hr', 'ims_users', 'ims_tasks', 'ims_roster',
  'ims_control_panel', 'asms_full', 'task_delete'
);

CREATE TYPE public.course_level AS ENUM (
  'Proficient Certificate', 'Master Certificate', 'Expert Certificate'
);

CREATE TYPE public.batch_mode AS ENUM ('classroom', 'online', 'hybrid');

CREATE TYPE public.batch_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

CREATE TYPE public.enrollment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partial');

CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TYPE public.module_progress_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TYPE public.assessment_type AS ENUM ('module_test', 'practical', 'final_project', 'quiz', 'assignment');

CREATE TYPE public.academic_record_type AS ENUM ('assignment', 'practical_project', 'software_skill');

CREATE TYPE public.certificate_type AS ENUM ('course_completion', 'professional_bim');

CREATE TYPE public.resource_type AS ENUM ('ebook', 'video', 'guide', 'document');

CREATE TYPE public.lead_status AS ENUM ('New', 'Contacted', 'Follow-up', 'Converted', 'Lost');

CREATE TYPE public.lead_source AS ENUM ('Facebook', 'Website', 'Walk-in', 'Referral', 'WhatsApp', 'Other');

CREATE TYPE public.invoice_status AS ENUM ('Paid', 'Unpaid', 'Partial');

CREATE TYPE public.expense_category AS ENUM (
  'Utilities', 'Rent', 'Salaries', 'Marketing', 'Equipment', 'Maintenance', 'Other'
);

CREATE TYPE public.leave_type AS ENUM ('Annual', 'Sick', 'Emergency', 'Maternity/Paternity', 'Other');

CREATE TYPE public.leave_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TYPE public.roster_type AS ENUM ('Shift', 'Duty', 'On-call', 'Other');

CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

CREATE TYPE public.task_status AS ENUM ('pending', 'completed');

CREATE TYPE public.staff_attendance_status AS ENUM ('present', 'late', 'active');

CREATE TYPE public.system_command_type AS ENUM ('force_logout', 'popup', 'broadcast', 'disable_user');

CREATE TYPE public.system_command_status AS ENUM ('pending', 'delivered', 'cancelled');

CREATE TYPE public.calendar_event_category AS ENUM ('Work', 'Meeting', 'Deadline', 'Leave', 'Task', 'Other');

CREATE TYPE public.lead_confirmation_stage AS ENUM ('marketing_confirmed', 'finance_confirmed', 'academic_confirmed');

CREATE TYPE public.event_reg_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TYPE public.student_lead_status AS ENUM ('new', 'contacted', 'qualified', 'enrolled', 'lost');

CREATE TYPE public.ims_student_source AS ENUM ('direct', 'marketing_lead');

CREATE TYPE public.ims_student_status AS ENUM ('active', 'completed', 'dropped');

CREATE TYPE public.ims_payment_method AS ENUM ('Cash', 'Bank Transfer', 'Online');

CREATE TYPE public.lecturer_status AS ENUM ('Active', 'Inactive');

CREATE TYPE public.employee_status AS ENUM ('Active', 'On Leave', 'Resigned', 'Terminated');

CREATE TYPE public.contract_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Intern');

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. CORE TABLES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.1 BRANCHES (Multi-branch support)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  address     TEXT,
  city        TEXT,
  phone       TEXT,
  email       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.branches IS 'Multi-branch / campus support for the institute';

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.2 DEPARTMENTS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  branch_id   UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  head_id     UUID,  -- FK added after profiles table
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.3 PROFILES (Central user table â€” extends auth.users)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  full_name               TEXT,
  phone                   TEXT,
  role                    public.user_role NOT NULL DEFAULT 'student',
  avatar_url              TEXT,
  branch_id               UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  -- Student fields
  student_id              TEXT UNIQUE,
  education_background    TEXT,
  guardian_name           TEXT,
  guardian_phone          TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  address                 TEXT,
  gender                  TEXT,
  date_of_birth           DATE,
  -- Lecturer fields
  specialization          TEXT,
  bio                     TEXT,
  qualification           TEXT,
  -- IMS Staff fields
  position                TEXT,
  department              TEXT,
  department_id           UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  access_level            INTEGER NOT NULL DEFAULT 1,
  task_delete_permission  BOOLEAN NOT NULL DEFAULT FALSE,
  permissions             JSONB NOT NULL DEFAULT '[]'::JSONB,
  work_schedule           JSONB DEFAULT '[]'::JSONB,
  office_assets           JSONB DEFAULT '[]'::JSONB,
  documents               JSONB DEFAULT '[]'::JSONB,
  epf_number              TEXT,
  nic                     TEXT,
  join_date               DATE,
  contract_type           public.contract_type DEFAULT 'Full-time',
  monthly_salary          NUMERIC(12,2),
  employee_status         public.employee_status DEFAULT 'Active',
  -- Status
  disabled                BOOLEAN NOT NULL DEFAULT FALSE,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  last_active             TIMESTAMPTZ,
  -- Soft delete
  deleted_at              TIMESTAMPTZ,
  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Central user profiles extending Supabase auth.users â€” all roles';

-- Now add the FK for departments.head_id
ALTER TABLE public.departments ADD CONSTRAINT fk_dept_head
  FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.4 COURSES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.courses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price    NUMERIC(10,2),
  level             public.course_level NOT NULL DEFAULT 'Proficient Certificate',
  category          TEXT NOT NULL DEFAULT 'General',
  total_hours       INTEGER NOT NULL DEFAULT 0,
  image_url         TEXT,
  tags              JSONB NOT NULL DEFAULT '[]'::JSONB,
  branch_id         UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_course_price CHECK (price >= 0),
  CONSTRAINT chk_course_hours CHECK (total_hours >= 0)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.5 MODULES (per course)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.modules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  order_index    INTEGER NOT NULL DEFAULT 0,
  topics         JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_module_duration CHECK (duration_hours >= 0)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.6 BATCHES (Central to the entire system)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.batches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL,
  batch_code     TEXT UNIQUE,
  start_date     DATE NOT NULL,
  end_date       DATE,
  schedule       TEXT NOT NULL DEFAULT '',
  mode           public.batch_mode NOT NULL DEFAULT 'classroom',
  venue          TEXT,
  seats          INTEGER NOT NULL DEFAULT 20,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  branch_id      UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  status         public.batch_status NOT NULL DEFAULT 'upcoming',
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_batch_seats CHECK (seats > 0),
  CONSTRAINT chk_batch_enrolled CHECK (enrolled_count >= 0),
  CONSTRAINT chk_batch_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.7 LECTURER ALLOCATIONS (Lecturer â†” Batch â†” Module)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.lecturer_allocations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lecturer_batch_module UNIQUE (batch_id, lecturer_id, module_id)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.8 ENROLLMENTS (Student â†” Course â†” Batch)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.enrollments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  batch_id       UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  status         public.enrollment_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  amount_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ,
  cancellation_reason TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_enrollment_amount CHECK (amount_paid >= 0),
  CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.9 ATTENDANCE (Student attendance per batch per date)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        public.attendance_status NOT NULL DEFAULT 'absent',
  notes         TEXT,
  marked_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_enrollment_date UNIQUE (enrollment_id, date)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.10 MODULE PROGRESS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.module_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status          public.module_progress_status NOT NULL DEFAULT 'not_started',
  score           NUMERIC(5,2),
  practical_score NUMERIC(5,2),
  theory_score    NUMERIC(5,2),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_module_progress UNIQUE (enrollment_id, module_id),
  CONSTRAINT chk_mp_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT chk_mp_practical CHECK (practical_score IS NULL OR (practical_score >= 0 AND practical_score <= 100)),
  CONSTRAINT chk_mp_theory CHECK (theory_score IS NULL OR (theory_score >= 0 AND theory_score <= 100))
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.11 ASSESSMENTS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.assessments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id  UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id      UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  type           public.assessment_type NOT NULL DEFAULT 'module_test',
  title          TEXT NOT NULL,
  marks_obtained NUMERIC(6,2),
  total_marks    NUMERIC(6,2) NOT NULL DEFAULT 100,
  grade          TEXT,
  conducted_at   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assess_marks CHECK (marks_obtained IS NULL OR marks_obtained >= 0),
  CONSTRAINT chk_assess_total CHECK (total_marks > 0)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.12 ACADEMIC RECORDS (assignments, projects, skills)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.academic_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id     UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  type          public.academic_record_type NOT NULL DEFAULT 'assignment',
  title         TEXT NOT NULL,
  status        public.module_progress_status NOT NULL DEFAULT 'not_started',
  score         NUMERIC(5,2),
  max_score     NUMERIC(5,2),
  notes         TEXT,
  evidence_url  TEXT,
  assessed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.13 CERTIFICATES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.certificates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id      UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  certificate_number TEXT NOT NULL UNIQUE,
  type               public.certificate_type NOT NULL DEFAULT 'course_completion',
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code_data       TEXT NOT NULL DEFAULT '',
  pdf_url            TEXT,
  verified_count     INTEGER NOT NULL DEFAULT 0,
  revoked            BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at         TIMESTAMPTZ,
  revoked_reason     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.14 LEARNING RESOURCES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.learning_resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  type        public.resource_type NOT NULL DEFAULT 'document',
  url         TEXT NOT NULL,
  file_size   BIGINT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.15 EVENTS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  start_date        DATE NOT NULL,
  end_date          DATE,
  start_time        TIME,
  end_time          TIME,
  venue             TEXT NOT NULL DEFAULT '',
  capacity          INTEGER NOT NULL DEFAULT 50,
  booked_count      INTEGER NOT NULL DEFAULT 0,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  category          TEXT NOT NULL DEFAULT 'General',
  organizer         TEXT NOT NULL DEFAULT '',
  image_url         TEXT,
  tags              JSONB NOT NULL DEFAULT '[]'::JSONB,
  agenda            JSONB NOT NULL DEFAULT '[]'::JSONB,
  speakers          JSONB NOT NULL DEFAULT '[]'::JSONB,
  branch_id         UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_capacity CHECK (capacity > 0),
  CONSTRAINT chk_event_price CHECK (price >= 0)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 4.16 EVENT REGISTRATIONS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CREATE TABLE public.event_registrations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL DEFAULT 1,
  status         public.event_reg_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  amount_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================================================
-- CADD CENTRE LANKA â€” ENTERPRISE DATABASE ARCHITECTURE
-- Part 2: IMS Tables, Communication, System Admin
-- ============================================================================

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 5. IMS TABLES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 5.1 CONTACT MESSAGES (Public contact form) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.2 STUDENT LEADS (ASMS-side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.student_leads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  interested_course TEXT,
  preferred_level  public.course_level,
  status           public.student_lead_status NOT NULL DEFAULT 'new',
  notes            TEXT,
  assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id        UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.3 MARKETING LEADS (IMS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.marketing_leads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  contact          TEXT,
  email            TEXT,
  dob              DATE,
  nic              TEXT,
  occupation       TEXT,
  course_interested TEXT,
  source           public.lead_source NOT NULL DEFAULT 'Other',
  status           public.lead_status NOT NULL DEFAULT 'New',
  assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id      UUID,  -- FK added after campaigns table
  follow_ups       JSONB NOT NULL DEFAULT '[]'::JSONB,
  notes            TEXT,
  confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_at     TIMESTAMPTZ,
  confirmed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id        UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.4 MARKETING CAMPAIGNS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.marketing_campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  source      public.lead_source NOT NULL DEFAULT 'Other',
  start_date  DATE,
  end_date    DATE,
  budget      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id   UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_campaign_budget CHECK (budget >= 0)
);

ALTER TABLE public.marketing_leads ADD CONSTRAINT fk_lead_campaign
  FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

-- â”€â”€ 5.5 LEAD CONFIRMATIONS (Cross-department pipeline) â”€â”€â”€â”€â”€
CREATE TABLE public.lead_confirmations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 TEXT NOT NULL,
  lead_name               TEXT NOT NULL,
  contact                 TEXT,
  email                   TEXT,
  course_interested       TEXT,
  stage                   public.lead_confirmation_stage NOT NULL DEFAULT 'marketing_confirmed',
  marketing_confirmed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marketing_confirmed_at  TIMESTAMPTZ,
  finance_confirmed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  finance_confirmed_at    TIMESTAMPTZ,
  academic_confirmed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  academic_confirmed_at   TIMESTAMPTZ,
  payment_amount          NUMERIC(10,2),
  payment_method          TEXT,
  batch_id                UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  student_id              TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.6 IMS PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name      TEXT NOT NULL,
  student_id        TEXT,
  course_id         UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  amount            NUMERIC(12,2) NOT NULL,
  method            public.ims_payment_method NOT NULL DEFAULT 'Cash',
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_id        UUID,  -- FK added after invoices
  notes             TEXT,
  lead_id           TEXT,
  source            TEXT,
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id         UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

-- â”€â”€ 5.7 IMS INVOICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE,
  student_name  TEXT NOT NULL,
  student_id    TEXT,
  course_name   TEXT,
  items         JSONB NOT NULL DEFAULT '[]'::JSONB,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        public.invoice_status NOT NULL DEFAULT 'Unpaid',
  due_date      DATE,
  generated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id     UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_invoice_total CHECK (total >= 0)
);

ALTER TABLE public.ims_payments ADD CONSTRAINT fk_payment_invoice
  FOREIGN KEY (invoice_id) REFERENCES public.ims_invoices(id) ON DELETE SET NULL;

-- â”€â”€ 5.8 IMS EXPENSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_expenses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   public.expense_category NOT NULL DEFAULT 'Other',
  amount     NUMERIC(12,2) NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id  UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_expense_amount CHECK (amount > 0)
);

-- â”€â”€ 5.9 HR LEAVE REQUESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.hr_leave_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  type          public.leave_type NOT NULL DEFAULT 'Annual',
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  reason        TEXT,
  status        public.leave_status NOT NULL DEFAULT 'Pending',
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_leave_dates CHECK (to_date >= from_date)
);

-- â”€â”€ 5.10 HR SALARY PAYOUTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.hr_salary_payouts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  month         TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  paid_on       DATE,
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_salary_amount CHECK (amount > 0),
  CONSTRAINT uq_salary_user_month UNIQUE (user_id, month)
);

-- â”€â”€ 5.11 HR PERFORMANCE REVIEWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.hr_performance_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  quarter       TEXT NOT NULL,
  score         NUMERIC(4,1) NOT NULL,
  notes         TEXT,
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_review_score CHECK (score >= 0 AND score <= 10)
);

-- â”€â”€ 5.12 HR ROSTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.hr_roster (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL,
  type          public.roster_type NOT NULL DEFAULT 'Shift',
  shift         TEXT,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_name TEXT,
  description   TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.13 OPS TASKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ops_tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  start_date          DATE,
  due_date            DATE NOT NULL,
  assigned_to         JSONB NOT NULL DEFAULT '[]'::JSONB,
  assigned_department TEXT,
  status              public.task_status NOT NULL DEFAULT 'pending',
  priority            public.task_priority NOT NULL DEFAULT 'medium',
  completed_by        JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id           UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.14 OPS MINUTE TRACKERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ops_minute_trackers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes  INTEGER NOT NULL DEFAULT 0,
  priority       public.task_priority NOT NULL DEFAULT 'medium',
  description    TEXT,
  task_template  TEXT,
  members        JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ops_minute_tracker_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracker_id  UUID NOT NULL REFERENCES public.ops_minute_trackers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 0,
  member_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.15 STAFF ATTENDANCE (Clock-in/out) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.staff_attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name     TEXT NOT NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out      TIMESTAMPTZ,
  status        public.staff_attendance_status NOT NULL DEFAULT 'present',
  daily_report  TEXT,
  session_index INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.16 IMS LOGIN HISTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_login_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  email       TEXT,
  login_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  INET,
  device_info TEXT
);

-- â”€â”€ 5.17 IMS SYSTEM COMMANDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_system_commands (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             public.system_command_type NOT NULL,
  message          TEXT,
  target_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_name TEXT,
  sent_by_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_by_name     TEXT,
  status           public.system_command_status NOT NULL DEFAULT 'pending',
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.18 WORK CALENDAR EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.work_calendar_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name  TEXT NOT NULL,
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  end_date   DATE,
  start_time TIME,
  end_time   TIME,
  category   public.calendar_event_category NOT NULL DEFAULT 'Work',
  color      TEXT NOT NULL DEFAULT '#3b82f6',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.19 IMS ACADEMIC STUDENTS (IMS-managed student records) â”€
CREATE TABLE public.ims_academic_students (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name    TEXT NOT NULL,
  student_id      TEXT,
  email           TEXT,
  phone           TEXT,
  nic             TEXT,
  dob             DATE,
  batch_code      TEXT,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name     TEXT,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source          public.ims_student_source NOT NULL DEFAULT 'direct',
  lead_id         TEXT,
  payment_status  public.payment_status NOT NULL DEFAULT 'pending',
  status          public.ims_student_status NOT NULL DEFAULT 'active',
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id       UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€ 5.20 IMS ACADEMIC RESULTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.ims_academic_results (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_id    UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  exam_name    TEXT NOT NULL,
  score        NUMERIC(5,2) NOT NULL,
  max_score    NUMERIC(5,2) NOT NULL,
  passed       BOOLEAN NOT NULL DEFAULT FALSE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_result_score CHECK (score >= 0),
  CONSTRAINT chk_result_max CHECK (max_score > 0)
);

-- â”€â”€ 5.21 LECTURERS (IMS standalone) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE public.lecturers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  specialization TEXT,
  qualification  TEXT,
  department     TEXT,
  status         public.lecturer_status NOT NULL DEFAULT 'Active',
  avatar_url     TEXT,
  branch_id      UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 6. AUDIT TABLES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE audit.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit.audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit.audit_log(record_id);
CREATE INDEX idx_audit_log_action ON audit.audit_log(action);
CREATE INDEX idx_audit_log_time ON audit.audit_log(created_at DESC);

CREATE TABLE audit.activity_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  entity_name TEXT,
  metadata    JSONB DEFAULT '{}'::JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 7. FUTURE-READY TABLES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System settings
CREATE TABLE public.system_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      JSONB NOT NULL DEFAULT '{}'::JSONB,
  group_name TEXT NOT NULL DEFAULT 'general',
  label      TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature flags
CREATE TABLE public.feature_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File uploads
CREATE TABLE public.file_uploads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_size     BIGINT,
  mime_type     TEXT,
  entity_type   TEXT,
  entity_id     UUID,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grading rules
CREATE TABLE public.grading_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  min_score   NUMERIC(5,2) NOT NULL,
  max_score   NUMERIC(5,2) NOT NULL,
  grade       TEXT NOT NULL,
  gpa_points  NUMERIC(3,2),
  is_passing  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Academic calendar
CREATE TABLE public.academic_calendar (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  type        TEXT NOT NULL DEFAULT 'event',
  description TEXT,
  branch_id   UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_holiday  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scholarships
CREATE TABLE public.scholarships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  max_recipients  INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timetable slots
CREATE TABLE public.timetable_slots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  room        TEXT,
  lecturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_slot_times CHECK (end_time > start_time)
);
-- ============================================================================
-- CADD CENTRE LANKA â€” ENTERPRISE DATABASE ARCHITECTURE
-- Part 3: Indexes, RLS, Functions, Triggers, Views, Seed Data
-- ============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 8. INDEXES (Performance Optimization)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_profiles_branch ON public.profiles(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_profiles_department ON public.profiles(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_profiles_active ON public.profiles(is_active, disabled);
CREATE INDEX idx_profiles_deleted ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_fullname_trgm ON public.profiles USING gin(full_name gin_trgm_ops);

-- Courses
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_active ON public.courses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_courses_featured ON public.courses(is_featured) WHERE is_featured = TRUE;

-- Modules
CREATE INDEX idx_modules_course ON public.modules(course_id);
CREATE INDEX idx_modules_order ON public.modules(course_id, order_index);

-- Batches
CREATE INDEX idx_batches_course ON public.batches(course_id);
CREATE INDEX idx_batches_active ON public.batches(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_batches_dates ON public.batches(start_date, end_date);
CREATE INDEX idx_batches_branch ON public.batches(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_batches_status ON public.batches(status);

-- Lecturer allocations
CREATE INDEX idx_lec_alloc_batch ON public.lecturer_allocations(batch_id);
CREATE INDEX idx_lec_alloc_lecturer ON public.lecturer_allocations(lecturer_id);

-- Enrollments
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_batch ON public.enrollments(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_payment ON public.enrollments(payment_status);
CREATE INDEX idx_enrollments_created ON public.enrollments(created_at DESC);

-- Attendance
CREATE INDEX idx_attendance_enrollment ON public.attendance(enrollment_id);
CREATE INDEX idx_attendance_batch ON public.attendance(batch_id);
CREATE INDEX idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX idx_attendance_batch_date ON public.attendance(batch_id, date);
CREATE INDEX idx_attendance_status ON public.attendance(status);

-- Module progress
CREATE INDEX idx_modprog_enrollment ON public.module_progress(enrollment_id);
CREATE INDEX idx_modprog_module ON public.module_progress(module_id);

-- Assessments
CREATE INDEX idx_assessments_enrollment ON public.assessments(enrollment_id);
CREATE INDEX idx_assessments_module ON public.assessments(module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_assessments_type ON public.assessments(type);

-- Academic records
CREATE INDEX idx_acadrec_enrollment ON public.academic_records(enrollment_id);

-- Certificates
CREATE INDEX idx_certs_user ON public.certificates(user_id);
CREATE INDEX idx_certs_course ON public.certificates(course_id);
CREATE INDEX idx_certs_number ON public.certificates(certificate_number);
CREATE INDEX idx_certs_enrollment ON public.certificates(enrollment_id);

-- Learning resources
CREATE INDEX idx_resources_course ON public.learning_resources(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_resources_module ON public.learning_resources(module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_resources_active ON public.learning_resources(is_active) WHERE is_active = TRUE;

-- Events
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_start ON public.events(start_date);
CREATE INDEX idx_events_active ON public.events(is_active) WHERE is_active = TRUE;

-- Event registrations
CREATE INDEX idx_eventreg_user ON public.event_registrations(user_id);
CREATE INDEX idx_eventreg_event ON public.event_registrations(event_id);

-- Contact messages
CREATE INDEX idx_contact_read ON public.contact_messages(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_contact_created ON public.contact_messages(created_at DESC);

-- Student leads
CREATE INDEX idx_stuleads_status ON public.student_leads(status);
CREATE INDEX idx_stuleads_assigned ON public.student_leads(assigned_to) WHERE assigned_to IS NOT NULL;

-- Marketing leads
CREATE INDEX idx_mktleads_status ON public.marketing_leads(status);
CREATE INDEX idx_mktleads_source ON public.marketing_leads(source);
CREATE INDEX idx_mktleads_assigned ON public.marketing_leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_mktleads_created ON public.marketing_leads(created_at DESC);

-- Lead confirmations
CREATE INDEX idx_leadconf_stage ON public.lead_confirmations(stage);
CREATE INDEX idx_leadconf_created ON public.lead_confirmations(created_at DESC);

-- IMS Payments
CREATE INDEX idx_imspay_date ON public.ims_payments(date DESC);
CREATE INDEX idx_imspay_confirmed ON public.ims_payments(payment_confirmed);
CREATE INDEX idx_imspay_created ON public.ims_payments(created_at DESC);

-- IMS Invoices
CREATE INDEX idx_imsinv_status ON public.ims_invoices(status);

-- IMS Expenses
CREATE INDEX idx_imsexp_category ON public.ims_expenses(category);
CREATE INDEX idx_imsexp_date ON public.ims_expenses(date DESC);

-- HR
CREATE INDEX idx_hrleave_user ON public.hr_leave_requests(user_id);
CREATE INDEX idx_hrleave_status ON public.hr_leave_requests(status);
CREATE INDEX idx_hrsalary_user ON public.hr_salary_payouts(user_id);
CREATE INDEX idx_hrperf_employee ON public.hr_performance_reviews(employee_id);
CREATE INDEX idx_hrroster_date ON public.hr_roster(date DESC);

-- Ops tasks
CREATE INDEX idx_opstasks_status ON public.ops_tasks(status);
CREATE INDEX idx_opstasks_priority ON public.ops_tasks(priority);
CREATE INDEX idx_opstasks_due ON public.ops_tasks(due_date);

-- Staff attendance
CREATE INDEX idx_staffatt_user ON public.staff_attendance(user_id);
CREATE INDEX idx_staffatt_date ON public.staff_attendance(date DESC);
CREATE INDEX idx_staffatt_user_date ON public.staff_attendance(user_id, date);

-- Login history
CREATE INDEX idx_loginh_user ON public.ims_login_history(user_id);
CREATE INDEX idx_loginh_time ON public.ims_login_history(login_time DESC);

-- System commands
CREATE INDEX idx_syscmd_target ON public.ims_system_commands(target_user_id);
CREATE INDEX idx_syscmd_status ON public.ims_system_commands(status);

-- Work calendar
CREATE INDEX idx_workcal_uid ON public.work_calendar_events(uid);
CREATE INDEX idx_workcal_date ON public.work_calendar_events(date);

-- Notifications
CREATE INDEX idx_notif_user ON public.notifications(user_id);
CREATE INDEX idx_notif_read ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created ON public.notifications(created_at DESC);

-- IMS academic students
CREATE INDEX idx_imsstu_status ON public.ims_academic_students(status);
CREATE INDEX idx_imsstu_batch ON public.ims_academic_students(batch_code);

-- File uploads
CREATE INDEX idx_uploads_entity ON public.file_uploads(entity_type, entity_id);
CREATE INDEX idx_uploads_user ON public.file_uploads(uploaded_by);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 9. ROW LEVEL SECURITY (RLS)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturer_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_minute_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_minute_tracker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_system_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_academic_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_academic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 10. RLS POLICIES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Helper: check if current user is admin/super_admin/branch_manager
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin','super_admin','branch_manager')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is staff (any IMS role)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role NOT IN ('student','guest','parent_guardian')
    AND disabled = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- â”€â”€ PROFILES POLICIES â”€â”€
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

-- â”€â”€ COURSES POLICIES (public read, admin write) â”€â”€
CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());

-- â”€â”€ MODULES POLICIES â”€â”€
CREATE POLICY "Anyone can view active modules" ON public.modules FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (public.is_admin());

-- â”€â”€ BATCHES POLICIES â”€â”€
CREATE POLICY "Anyone can view active batches" ON public.batches FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admins can manage batches" ON public.batches FOR ALL USING (public.is_admin());
CREATE POLICY "Staff can view all batches" ON public.batches FOR SELECT USING (public.is_staff());

-- â”€â”€ ENROLLMENTS POLICIES â”€â”€
CREATE POLICY "Students see own enrollments" ON public.enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff can view enrollments" ON public.enrollments FOR SELECT USING (public.is_staff());
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Students can create own enrollment" ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid());

-- â”€â”€ ATTENDANCE POLICIES â”€â”€
CREATE POLICY "Students see own attendance" ON public.attendance FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL USING (public.is_staff());

-- â”€â”€ MODULE PROGRESS POLICIES â”€â”€
CREATE POLICY "Students see own progress" ON public.module_progress FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage progress" ON public.module_progress FOR ALL USING (public.is_staff());

-- â”€â”€ ASSESSMENTS POLICIES â”€â”€
CREATE POLICY "Students see own assessments" ON public.assessments FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage assessments" ON public.assessments FOR ALL USING (public.is_staff());

-- â”€â”€ ACADEMIC RECORDS POLICIES â”€â”€
CREATE POLICY "Students see own records" ON public.academic_records FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage records" ON public.academic_records FOR ALL USING (public.is_staff());

-- â”€â”€ CERTIFICATES POLICIES â”€â”€
CREATE POLICY "Students see own certs" ON public.certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can verify certs" ON public.certificates FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage certs" ON public.certificates FOR ALL USING (public.is_admin());

-- â”€â”€ LEARNING RESOURCES POLICIES â”€â”€
CREATE POLICY "Active resources visible" ON public.learning_resources FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage resources" ON public.learning_resources FOR ALL USING (public.is_admin());

-- â”€â”€ EVENTS POLICIES (public read) â”€â”€
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin());

-- â”€â”€ EVENT REGISTRATIONS POLICIES â”€â”€
CREATE POLICY "Users see own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff can view all regs" ON public.event_registrations FOR SELECT USING (public.is_staff());

-- â”€â”€ CONTACT MESSAGES (public insert, admin read) â”€â”€
CREATE POLICY "Anyone can submit message" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can view messages" ON public.contact_messages FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can update messages" ON public.contact_messages FOR UPDATE USING (public.is_staff());

-- â”€â”€ IMS TABLES: staff-only policies â”€â”€
CREATE POLICY "Staff access marketing leads" ON public.marketing_leads FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access campaigns" ON public.marketing_campaigns FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access lead confirmations" ON public.lead_confirmations FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access student leads" ON public.student_leads FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access payments" ON public.ims_payments FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access invoices" ON public.ims_invoices FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access expenses" ON public.ims_expenses FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access HR leave" ON public.hr_leave_requests FOR ALL USING (public.is_staff());
CREATE POLICY "Own leave requests" ON public.hr_leave_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff access salaries" ON public.hr_salary_payouts FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access reviews" ON public.hr_performance_reviews FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access roster" ON public.hr_roster FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access tasks" ON public.ops_tasks FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access trackers" ON public.ops_minute_trackers FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access tracker tasks" ON public.ops_minute_tracker_tasks FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access staff attendance" ON public.staff_attendance FOR ALL USING (public.is_staff());
CREATE POLICY "Own staff attendance" ON public.staff_attendance FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff access login history" ON public.ims_login_history FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access sys commands" ON public.ims_system_commands FOR ALL USING (public.is_staff());
CREATE POLICY "Target user receives commands" ON public.ims_system_commands FOR SELECT USING (target_user_id = auth.uid());
CREATE POLICY "Own work calendar" ON public.work_calendar_events FOR ALL USING (uid = auth.uid());
CREATE POLICY "Admins see all calendars" ON public.work_calendar_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff access IMS students" ON public.ims_academic_students FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access IMS results" ON public.ims_academic_results FOR ALL USING (public.is_staff());
CREATE POLICY "Staff access lecturers" ON public.lecturers FOR ALL USING (public.is_staff());

-- â”€â”€ NOTIFICATIONS â”€â”€
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (TRUE);

-- â”€â”€ SYSTEM SETTINGS â”€â”€
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Staff can read settings" ON public.system_settings FOR SELECT USING (public.is_staff());

-- â”€â”€ FILE UPLOADS â”€â”€
CREATE POLICY "Users see own uploads" ON public.file_uploads FOR SELECT USING (uploaded_by = auth.uid() OR is_public = TRUE);
CREATE POLICY "Users can upload" ON public.file_uploads FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Staff see all uploads" ON public.file_uploads FOR SELECT USING (public.is_staff());
-- ============================================================================
-- CADD CENTRE LANKA â€” Part 4a: Functions & Triggers
-- ============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 11. FUNCTIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment batch enrolled count (used by app via RPC)
CREATE OR REPLACE FUNCTION public.increment_batch_enrolled(p_batch_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.batches
  SET enrolled_count = enrolled_count + 1, updated_at = NOW()
  WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement batch enrolled count
CREATE OR REPLACE FUNCTION public.decrement_batch_enrolled(p_batch_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.batches
  SET enrolled_count = GREATEST(enrolled_count - 1, 0), updated_at = NOW()
  WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment event booked count (used by app via RPC)
CREATE OR REPLACE FUNCTION public.increment_event_booked(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events
  SET booked_count = booked_count + 1, updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate student attendance percentage
CREATE OR REPLACE FUNCTION public.fn_student_attendance_pct(p_enrollment_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_count INTEGER;
  present_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'present')
  INTO total_count, present_count
  FROM public.attendance WHERE enrollment_id = p_enrollment_id;
  IF total_count = 0 THEN RETURN 0; END IF;
  RETURN ROUND((present_count::NUMERIC / total_count) * 100, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate batch attendance rate
CREATE OR REPLACE FUNCTION public.fn_batch_attendance_rate(p_batch_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_count INTEGER;
  present_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'present')
  INTO total_count, present_count
  FROM public.attendance WHERE batch_id = p_batch_id;
  IF total_count = 0 THEN RETURN 0; END IF;
  RETURN ROUND((present_count::NUMERIC / total_count) * 100, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate student GPA across all assessments for an enrollment
CREATE OR REPLACE FUNCTION public.fn_student_gpa(p_enrollment_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_pct NUMERIC;
BEGIN
  SELECT AVG(CASE WHEN total_marks > 0 THEN (marks_obtained / total_marks) * 100 ELSE 0 END)
  INTO avg_pct
  FROM public.assessments
  WHERE enrollment_id = p_enrollment_id AND marks_obtained IS NOT NULL;
  IF avg_pct IS NULL THEN RETURN 0; END IF;
  -- Convert percentage to 4.0 scale
  RETURN ROUND(CASE
    WHEN avg_pct >= 85 THEN 4.0
    WHEN avg_pct >= 75 THEN 3.5
    WHEN avg_pct >= 65 THEN 3.0
    WHEN avg_pct >= 55 THEN 2.5
    WHEN avg_pct >= 45 THEN 2.0
    WHEN avg_pct >= 35 THEN 1.5
    ELSE 0.0
  END, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get student module completion percentage
CREATE OR REPLACE FUNCTION public.fn_module_completion_pct(p_enrollment_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_modules INTEGER;
  completed INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_modules FROM public.modules m
  JOIN public.enrollments e ON e.course_id = m.course_id
  WHERE e.id = p_enrollment_id;
  IF total_modules = 0 THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO completed FROM public.module_progress
  WHERE enrollment_id = p_enrollment_id AND status = 'completed';
  RETURN ROUND((completed::NUMERIC / total_modules) * 100, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Generate next certificate number
CREATE OR REPLACE FUNCTION public.fn_next_certificate_number()
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(REGEXP_REPLACE(certificate_number, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.certificates
  WHERE certificate_number LIKE 'CADD-' || year_part || '-%';
  RETURN 'CADD-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate next invoice number
CREATE OR REPLACE FUNCTION public.fn_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  month_part TEXT;
BEGIN
  month_part := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(
    CAST(NULLIF(REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.ims_invoices
  WHERE invoice_number LIKE 'INV-' || month_part || '-%';
  RETURN 'INV-' || month_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Batch analytics summary
CREATE OR REPLACE FUNCTION public.fn_batch_analytics(p_batch_id UUID)
RETURNS TABLE (
  total_students INTEGER,
  attendance_rate NUMERIC,
  avg_assessment_score NUMERIC,
  completion_rate NUMERIC,
  active_students INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.enrollments WHERE batch_id = p_batch_id AND status IN ('confirmed','completed')) AS total_students,
    public.fn_batch_attendance_rate(p_batch_id) AS attendance_rate,
    (SELECT COALESCE(AVG(CASE WHEN a.total_marks > 0 THEN (a.marks_obtained / a.total_marks) * 100 END), 0)
     FROM public.assessments a JOIN public.enrollments e ON e.id = a.enrollment_id
     WHERE e.batch_id = p_batch_id AND a.marks_obtained IS NOT NULL)::NUMERIC AS avg_assessment_score,
    (SELECT CASE WHEN COUNT(*) = 0 THEN 0
     ELSE ROUND(COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100, 1) END
     FROM public.enrollments WHERE batch_id = p_batch_id)::NUMERIC AS completion_rate,
    (SELECT COUNT(*)::INTEGER FROM public.enrollments WHERE batch_id = p_batch_id AND status = 'confirmed') AS active_students;
END;
$$ LANGUAGE plpgsql STABLE;

-- Dashboard summary function
CREATE OR REPLACE FUNCTION public.fn_dashboard_summary()
RETURNS TABLE (
  total_students BIGINT,
  total_courses BIGINT,
  total_batches BIGINT,
  total_lecturers BIGINT,
  total_enrollments BIGINT,
  certificates_issued BIGINT,
  total_revenue NUMERIC,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND disabled = FALSE),
    (SELECT COUNT(*) FROM public.courses WHERE is_active = TRUE AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.batches WHERE is_active = TRUE AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'lecturer' AND disabled = FALSE),
    (SELECT COUNT(*) FROM public.enrollments WHERE deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.certificates WHERE revoked = FALSE),
    (SELECT COALESCE(SUM(amount_paid), 0) FROM public.enrollments WHERE deleted_at IS NULL),
    (SELECT CASE WHEN COUNT(*) = 0 THEN 0
     ELSE ROUND(COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*) * 100, 1) END
     FROM public.attendance);
END;
$$ LANGUAGE plpgsql STABLE;

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit.fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit.audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit.audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit.audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-set batch status based on dates
CREATE OR REPLACE FUNCTION public.fn_auto_batch_status()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  IF NEW.start_date <= today AND (NEW.end_date IS NULL OR NEW.end_date >= today) THEN
    NEW.status = 'active';
  ELSIF NEW.start_date > today THEN
    NEW.status = 'upcoming';
  ELSIF NEW.end_date IS NOT NULL AND NEW.end_date < today THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION public.fn_auto_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number = public.fn_next_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-pass academic result
CREATE OR REPLACE FUNCTION public.fn_auto_pass_result()
RETURNS TRIGGER AS $$
BEGIN
  NEW.passed = (NEW.score >= NEW.max_score * 0.5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 12. TRIGGERS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- updated_at auto-update triggers
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_batches_updated BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_module_progress_updated BEFORE UPDATE ON public.module_progress FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_academic_records_updated BEFORE UPDATE ON public.academic_records FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_learning_resources_updated BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_event_regs_updated BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_student_leads_updated BEFORE UPDATE ON public.student_leads FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_marketing_leads_updated BEFORE UPDATE ON public.marketing_leads FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_lead_confirmations_updated BEFORE UPDATE ON public.lead_confirmations FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_hr_leave_updated BEFORE UPDATE ON public.hr_leave_requests FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_ops_tasks_updated BEFORE UPDATE ON public.ops_tasks FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_ims_academic_students_updated BEFORE UPDATE ON public.ims_academic_students FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Batch status auto-set on insert/update
CREATE TRIGGER trg_batch_auto_status BEFORE INSERT OR UPDATE OF start_date, end_date ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_batch_status();

-- Invoice number auto-generation
CREATE TRIGGER trg_invoice_auto_number BEFORE INSERT ON public.ims_invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_invoice_number();

-- Academic result auto-pass calculation
CREATE TRIGGER trg_result_auto_pass BEFORE INSERT OR UPDATE OF score, max_score ON public.ims_academic_results
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_pass_result();

-- Audit triggers on critical tables
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_enrollments AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_certificates AFTER INSERT OR UPDATE OR DELETE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_attendance AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_assessments AFTER INSERT OR UPDATE OR DELETE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.ims_payments
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.ims_invoices
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.ims_expenses
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_leave AFTER INSERT OR UPDATE OR DELETE ON public.hr_leave_requests
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_batches AFTER INSERT OR UPDATE OR DELETE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_courses AFTER INSERT OR UPDATE OR DELETE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
CREATE TRIGGER trg_audit_marketing_leads AFTER INSERT OR UPDATE OR DELETE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();
-- ============================================================================
-- CADD CENTRE LANKA â€” Part 4b: Views & Seed Data
-- ============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 13. VIEWS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Student dashboard view
CREATE OR REPLACE VIEW public.v_student_dashboard AS
SELECT
  p.id AS user_id, p.full_name, p.email, p.student_id, p.avatar_url,
  COUNT(DISTINCT e.id) AS total_enrollments,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'confirmed') AS active_enrollments,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completed_enrollments,
  COUNT(DISTINCT c.id) AS certificates_earned,
  COALESCE(SUM(e.amount_paid), 0) AS total_paid
FROM public.profiles p
LEFT JOIN public.enrollments e ON e.user_id = p.id AND e.deleted_at IS NULL
LEFT JOIN public.certificates c ON c.user_id = p.id AND c.revoked = FALSE
WHERE p.role = 'student' AND p.disabled = FALSE
GROUP BY p.id, p.full_name, p.email, p.student_id, p.avatar_url;

-- Lecturer dashboard view
CREATE OR REPLACE VIEW public.v_lecturer_dashboard AS
SELECT
  p.id AS user_id, p.full_name, p.email, p.specialization,
  COUNT(DISTINCT la.batch_id) AS assigned_batches,
  COUNT(DISTINCT la.module_id) FILTER (WHERE la.module_id IS NOT NULL) AS assigned_modules,
  (SELECT COUNT(*) FROM public.attendance a
   JOIN public.enrollments en ON en.id = a.enrollment_id
   JOIN public.batches b ON b.id = en.batch_id
   JOIN public.lecturer_allocations la2 ON la2.batch_id = b.id AND la2.lecturer_id = p.id
  ) AS total_attendance_marked
FROM public.profiles p
LEFT JOIN public.lecturer_allocations la ON la.lecturer_id = p.id
WHERE p.role = 'lecturer' AND p.disabled = FALSE
GROUP BY p.id, p.full_name, p.email, p.specialization;

-- Admin dashboard view
CREATE OR REPLACE VIEW public.v_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND disabled = FALSE) AS total_students,
  (SELECT COUNT(*) FROM public.courses WHERE is_active = TRUE AND deleted_at IS NULL) AS total_courses,
  (SELECT COUNT(*) FROM public.batches WHERE is_active = TRUE AND deleted_at IS NULL) AS total_batches,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'lecturer' AND disabled = FALSE) AS total_lecturers,
  (SELECT COUNT(*) FROM public.enrollments WHERE deleted_at IS NULL) AS total_enrollments,
  (SELECT COUNT(*) FROM public.certificates WHERE revoked = FALSE) AS certificates_issued,
  (SELECT COALESCE(SUM(amount_paid), 0) FROM public.enrollments WHERE deleted_at IS NULL) AS total_revenue,
  (SELECT CASE WHEN COUNT(*) = 0 THEN 0
   ELSE ROUND(COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*) * 100, 1) END
   FROM public.attendance) AS attendance_rate;

-- Attendance summary per batch
CREATE OR REPLACE VIEW public.v_attendance_summary AS
SELECT
  b.id AS batch_id, b.name AS batch_name, b.course_id,
  co.title AS course_title,
  COUNT(a.id) AS total_records,
  COUNT(a.id) FILTER (WHERE a.status = 'present') AS present_count,
  COUNT(a.id) FILTER (WHERE a.status = 'absent') AS absent_count,
  COUNT(a.id) FILTER (WHERE a.status = 'late') AS late_count,
  CASE WHEN COUNT(a.id) = 0 THEN 0
  ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status = 'present')::NUMERIC / COUNT(a.id) * 100, 1)
  END AS attendance_rate
FROM public.batches b
JOIN public.courses co ON co.id = b.course_id
LEFT JOIN public.attendance a ON a.batch_id = b.id
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.name, b.course_id, co.title;

-- Enrollment report view
CREATE OR REPLACE VIEW public.v_enrollment_report AS
SELECT
  co.title AS course_title,
  b.name AS batch_name,
  COUNT(e.id) AS total_enrolled,
  COUNT(e.id) FILTER (WHERE e.status = 'completed') AS completed,
  COUNT(e.id) FILTER (WHERE e.status = 'pending') AS pending,
  COUNT(e.id) FILTER (WHERE e.status = 'cancelled') AS cancelled,
  COALESCE(SUM(e.amount_paid), 0) AS revenue
FROM public.enrollments e
JOIN public.courses co ON co.id = e.course_id
LEFT JOIN public.batches b ON b.id = e.batch_id
WHERE e.deleted_at IS NULL
GROUP BY co.title, b.name;

-- Finance summary view
CREATE OR REPLACE VIEW public.v_finance_summary AS
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_payments) AS total_payments,
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_payments WHERE payment_confirmed = TRUE) AS confirmed_payments,
  (SELECT COALESCE(SUM(total), 0) FROM public.ims_invoices WHERE status = 'Unpaid') AS pending_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM public.ims_invoices WHERE status = 'Paid') AS paid_invoices,
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_expenses) AS total_expenses,
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_payments) -
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_expenses) AS net_revenue;

-- Certificate verification view
CREATE OR REPLACE VIEW public.v_certificate_verification AS
SELECT
  c.certificate_number, c.type, c.issued_at, c.revoked,
  p.full_name AS student_name, p.student_id, p.email,
  co.title AS course_title, co.level AS course_level
FROM public.certificates c
JOIN public.profiles p ON p.id = c.user_id
JOIN public.courses co ON co.id = c.course_id;

-- GPA summary view
CREATE OR REPLACE VIEW public.v_student_gpa_summary AS
SELECT
  e.id AS enrollment_id, e.user_id, e.course_id, e.batch_id,
  p.full_name, p.student_id,
  co.title AS course_title,
  b.name AS batch_name,
  public.fn_student_gpa(e.id) AS gpa,
  public.fn_student_attendance_pct(e.id) AS attendance_pct,
  public.fn_module_completion_pct(e.id) AS module_completion_pct
FROM public.enrollments e
JOIN public.profiles p ON p.id = e.user_id
JOIN public.courses co ON co.id = e.course_id
LEFT JOIN public.batches b ON b.id = e.batch_id
WHERE e.deleted_at IS NULL AND e.status IN ('confirmed', 'completed');

-- IMS Dashboard stats view
CREATE OR REPLACE VIEW public.v_ims_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role NOT IN ('student','guest','parent_guardian') AND disabled = FALSE) AS total_staff,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND disabled = FALSE) AS total_students,
  (SELECT COUNT(*) FROM public.marketing_leads WHERE status NOT IN ('Converted','Lost')) AS active_leads,
  (SELECT COUNT(*) FROM public.marketing_leads WHERE status = 'Converted') AS converted_leads,
  (SELECT COUNT(*) FROM public.hr_leave_requests WHERE status = 'Pending') AS pending_leaves,
  (SELECT COUNT(*) FROM public.ops_tasks WHERE status = 'pending') AS open_tasks,
  (SELECT COALESCE(SUM(amount), 0) FROM public.ims_payments) AS total_revenue,
  (SELECT COALESCE(SUM(total), 0) FROM public.ims_invoices WHERE status = 'Unpaid') AS pending_payments;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 14. SEED DATA
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Default branch
INSERT INTO public.branches (id, name, code, address, city, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'CADD Centre Lanka - Colombo', 'CMB', '123 Galle Road, Colombo 03', 'Colombo', '+94 11 234 5678', 'colombo@caddcentre.lk')
ON CONFLICT (code) DO NOTHING;

-- Default departments
INSERT INTO public.departments (name, code, branch_id) VALUES
  ('Academic', 'ACAD', '00000000-0000-0000-0000-000000000001'),
  ('Marketing', 'MKT', '00000000-0000-0000-0000-000000000001'),
  ('Finance', 'FIN', '00000000-0000-0000-0000-000000000001'),
  ('Human Resources', 'HR', '00000000-0000-0000-0000-000000000001'),
  ('IT', 'IT', '00000000-0000-0000-0000-000000000001'),
  ('Operations', 'OPS', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (code) DO NOTHING;

-- Grading rules
INSERT INTO public.grading_rules (name, min_score, max_score, grade, gpa_points, is_passing) VALUES
  ('A+', 90, 100, 'A+', 4.00, TRUE),
  ('A',  80, 89.99, 'A',  3.70, TRUE),
  ('A-', 75, 79.99, 'A-', 3.30, TRUE),
  ('B+', 70, 74.99, 'B+', 3.00, TRUE),
  ('B',  65, 69.99, 'B',  2.70, TRUE),
  ('B-', 60, 64.99, 'B-', 2.30, TRUE),
  ('C+', 55, 59.99, 'C+', 2.00, TRUE),
  ('C',  50, 54.99, 'C',  1.70, TRUE),
  ('C-', 45, 49.99, 'C-', 1.30, TRUE),
  ('D',  40, 44.99, 'D',  1.00, TRUE),
  ('F',  0,  39.99, 'F',  0.00, FALSE);

-- System settings
INSERT INTO public.system_settings (key, value, group_name, label) VALUES
  ('institute_name', '"CADD Centre Lanka"', 'general', 'Institute Name'),
  ('institute_email', '"info@caddcentre.lk"', 'general', 'Contact Email'),
  ('institute_phone', '"+94 11 234 5678"', 'general', 'Contact Phone'),
  ('currency', '"LKR"', 'finance', 'Currency'),
  ('currency_symbol', '"Rs."', 'finance', 'Currency Symbol'),
  ('academic_year', '"2025-2026"', 'academic', 'Current Academic Year'),
  ('attendance_late_threshold_minutes', '15', 'academic', 'Late Threshold (minutes)'),
  ('passing_grade_percentage', '50', 'academic', 'Passing Grade (%)'),
  ('certificate_prefix', '"CADD"', 'certificates', 'Certificate Number Prefix'),
  ('student_id_format', '"CADDSTU"', 'students', 'Student ID Prefix'),
  ('max_batch_size', '30', 'batches', 'Maximum Batch Size'),
  ('enable_email_notifications', 'true', 'notifications', 'Email Notifications'),
  ('enable_sms_notifications', 'false', 'notifications', 'SMS Notifications'),
  ('maintenance_mode', 'false', 'system', 'Maintenance Mode'),
  ('allow_self_registration', 'true', 'auth', 'Allow Self Registration')
ON CONFLICT (key) DO NOTHING;

-- Feature flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('online_payments', FALSE, 'Enable online payment gateway'),
  ('biometric_attendance', FALSE, 'Enable biometric attendance system'),
  ('lms_integration', FALSE, 'Enable Learning Management System'),
  ('zoom_integration', FALSE, 'Enable Zoom online class integration'),
  ('mobile_app_sync', FALSE, 'Enable mobile app data synchronization'),
  ('ai_analytics', FALSE, 'Enable AI-powered analytics'),
  ('discussion_forums', FALSE, 'Enable student discussion forums'),
  ('assignment_submissions', FALSE, 'Enable online assignment submissions'),
  ('parent_portal', FALSE, 'Enable parent/guardian portal'),
  ('sms_notifications', FALSE, 'Enable SMS notification service'),
  ('multi_language', FALSE, 'Enable multi-language support (Sinhala/Tamil)')
ON CONFLICT (key) DO NOTHING;

-- Sample courses
INSERT INTO public.courses (slug, title, description, short_description, price, level, category, total_hours, tags, is_active, is_featured) VALUES
  ('autocad-2d-3d', 'AutoCAD 2D & 3D', 'Comprehensive AutoCAD training covering 2D drafting and 3D modeling for architectural and engineering professionals.', 'Master AutoCAD 2D drafting and 3D modeling', 45000.00, 'Proficient Certificate', 'CAD/CAM', 60, '["AutoCAD","2D","3D","Drafting"]', TRUE, TRUE),
  ('revit-architecture', 'Revit Architecture', 'Building Information Modeling using Autodesk Revit for architectural design, documentation, and collaboration.', 'BIM with Autodesk Revit', 55000.00, 'Master Certificate', 'BIM', 80, '["Revit","BIM","Architecture"]', TRUE, TRUE),
  ('3ds-max-visualization', '3ds Max Visualization', 'Professional 3D visualization and rendering using Autodesk 3ds Max with V-Ray rendering engine.', '3D visualization and rendering', 50000.00, 'Master Certificate', 'Visualization', 70, '["3ds Max","V-Ray","Rendering"]', TRUE, TRUE),
  ('graphic-design-suite', 'Graphic Design Suite', 'Complete graphic design training: Photoshop, Illustrator, and InDesign for print and digital media.', 'Photoshop, Illustrator & InDesign', 40000.00, 'Proficient Certificate', 'Graphic Design', 50, '["Photoshop","Illustrator","InDesign"]', TRUE, FALSE),
  ('solidworks-mechanical', 'SolidWorks Mechanical', 'Mechanical engineering design and simulation using SolidWorks for product development.', 'Mechanical CAD with SolidWorks', 60000.00, 'Expert Certificate', 'CAD/CAM', 90, '["SolidWorks","Mechanical","CAD"]', TRUE, FALSE),
  ('interior-design-professional', 'Interior Design Professional', 'Complete interior design course covering SketchUp, V-Ray, and Lumion for professional interiors.', 'SketchUp + V-Ray + Lumion', 65000.00, 'Expert Certificate', 'Interior Design', 100, '["SketchUp","V-Ray","Lumion","Interior"]', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 15. TABLE COMMENTS (Documentation)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

COMMENT ON TABLE public.profiles IS 'Central user profiles - extends Supabase auth.users with role, permissions, and all user metadata';
COMMENT ON TABLE public.courses IS 'Course catalog with pricing, levels, and categorization';
COMMENT ON TABLE public.modules IS 'Course modules/chapters with topics and duration';
COMMENT ON TABLE public.batches IS 'CENTRAL ENTITY - Academic batches linking courses, students, lecturers, schedules';
COMMENT ON TABLE public.lecturer_allocations IS 'Maps lecturers to batches and optionally to specific modules';
COMMENT ON TABLE public.enrollments IS 'Student enrollments linking users to courses and batches with payment tracking';
COMMENT ON TABLE public.attendance IS 'Per-date attendance records for enrolled students';
COMMENT ON TABLE public.module_progress IS 'Student progress tracking per module with scores';
COMMENT ON TABLE public.assessments IS 'Assessment/exam records with marks and grades';
COMMENT ON TABLE public.academic_records IS 'Extended academic records: assignments, projects, skill assessments';
COMMENT ON TABLE public.certificates IS 'Issued certificates with unique numbers and QR verification';
COMMENT ON TABLE public.learning_resources IS 'Downloadable/viewable learning materials per course/module';
COMMENT ON TABLE public.events IS 'Institution events with registration and ticketing';
COMMENT ON TABLE public.event_registrations IS 'Event registration records with payment status';
COMMENT ON TABLE public.contact_messages IS 'Public website contact form submissions';
COMMENT ON TABLE public.student_leads IS 'ASMS-side prospective student tracking';
COMMENT ON TABLE public.marketing_leads IS 'IMS marketing lead pipeline with follow-ups';
COMMENT ON TABLE public.marketing_campaigns IS 'Marketing campaign tracking with budgets';
COMMENT ON TABLE public.lead_confirmations IS '3-stage cross-department lead-to-student pipeline';
COMMENT ON TABLE public.ims_payments IS 'IMS payment records with lead linkage';
COMMENT ON TABLE public.ims_invoices IS 'Auto-numbered invoices with line items';
COMMENT ON TABLE public.ims_expenses IS 'Categorized expense tracking';
COMMENT ON TABLE public.hr_leave_requests IS 'Employee leave management with approval workflow';
COMMENT ON TABLE public.hr_salary_payouts IS 'Monthly salary payment records';
COMMENT ON TABLE public.hr_performance_reviews IS 'Quarterly employee performance scoring';
COMMENT ON TABLE public.hr_roster IS 'Staff shift/duty scheduling';
COMMENT ON TABLE public.ops_tasks IS 'Operational tasks with multi-assignment and completion tracking';
COMMENT ON TABLE public.ops_minute_trackers IS 'Meeting minute trackers with sub-tasks';
COMMENT ON TABLE public.staff_attendance IS 'Staff clock-in/out with daily reports';
COMMENT ON TABLE public.ims_login_history IS 'Security audit: login time, IP, device tracking';
COMMENT ON TABLE public.ims_system_commands IS 'Admin system commands: force-logout, broadcast, disable';
COMMENT ON TABLE public.work_calendar_events IS 'Personal work calendar for staff';
COMMENT ON TABLE public.ims_academic_students IS 'IMS-managed student records (pre-enrollment)';
COMMENT ON TABLE public.ims_academic_results IS 'IMS-side exam/result tracking';
COMMENT ON TABLE public.lecturers IS 'Standalone IMS lecturer directory';
COMMENT ON TABLE public.notifications IS 'In-app notification system';
COMMENT ON TABLE public.system_settings IS 'Key-value system configuration';
COMMENT ON TABLE public.feature_flags IS 'Feature toggle system for gradual rollout';
COMMENT ON TABLE public.file_uploads IS 'Centralized file/document storage metadata';
COMMENT ON TABLE public.grading_rules IS 'Grade boundaries and GPA point mapping';
COMMENT ON TABLE public.academic_calendar IS 'Institution-wide academic calendar and holidays';
COMMENT ON TABLE public.scholarships IS 'Scholarship/discount definitions';
COMMENT ON TABLE public.timetable_slots IS 'Weekly timetable per batch with room allocation';
COMMENT ON TABLE public.branches IS 'Multi-branch/campus support';
COMMENT ON TABLE public.departments IS 'Organizational department structure';
COMMENT ON TABLE audit.audit_log IS 'Immutable audit trail for all critical table changes';
COMMENT ON TABLE audit.activity_log IS 'User activity tracking for analytics';

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 16. GRANTS (Supabase roles)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;

-- Grant access to all tables for authenticated users (RLS controls actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO authenticated;

-- Grant limited access to anon (public pages)
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.modules TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.batches TO anon;
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT ON public.certificates TO anon;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO authenticated;

-- Grant function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- END OF COMPLETE DATABASE ARCHITECTURE
-- Execute order: 01_foundation.sql â†’ 02_ims_and_system.sql â†’
--               03_indexes_and_rls.sql â†’ 04a_functions_triggers.sql â†’
--               04b_views_seed.sql
-- ============================================================================
-- ============================================================================
-- CADD CENTRE LANKA â€” LIVE RLS FIX
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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- DROP existing policies that may conflict
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- PROFILES â€” All staff can read, users can read own
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_full_admin());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- COURSES â€” Public read, academic_head + admin can write
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_all" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "courses_write_academic_head" ON public.courses
  FOR ALL USING (public.is_academic_head());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- MODULES â€” Public read, academic_head + admin can write
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_select_all" ON public.modules
  FOR SELECT USING (true);

CREATE POLICY "modules_write_academic_head" ON public.modules
  FOR ALL USING (public.is_academic_head());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- BATCHES â€” Academic roles can read, academic roles can write
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_select_all" ON public.batches
  FOR SELECT USING (true);

CREATE POLICY "batches_write_academic" ON public.batches
  FOR INSERT WITH CHECK (public.is_academic_role());

CREATE POLICY "batches_update_academic" ON public.batches
  FOR UPDATE USING (public.is_academic_role());

CREATE POLICY "batches_delete_admin" ON public.batches
  FOR DELETE USING (public.is_full_admin());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- LECTURER ALLOCATIONS â€” Academic roles can manage
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.lecturer_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lec_alloc_select_staff" ON public.lecturer_allocations
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "lec_alloc_write_academic" ON public.lecturer_allocations
  FOR ALL USING (public.is_academic_role());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- ENROLLMENTS â€” Academic head + admin can manage
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_own" ON public.enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "enrollments_select_staff" ON public.enrollments
  FOR SELECT USING (public.is_staff_member());

CREATE POLICY "enrollments_write_academic_head" ON public.enrollments
  FOR ALL USING (public.is_academic_head());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- ATTENDANCE â€” Staff can read, academic roles can write
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_staff" ON public.attendance
  FOR SELECT USING (public.is_staff_member() OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "attendance_write_academic" ON public.attendance
  FOR ALL USING (public.is_academic_role());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- ASSESSMENTS â€” Academic roles can manage
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_select_staff" ON public.assessments
  FOR SELECT USING (public.is_staff_member() OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "assessments_write_academic" ON public.assessments
  FOR ALL USING (public.is_academic_role());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- CERTIFICATES â€” Staff read, academic head write
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certs_select_all" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "certs_write_academic_head" ON public.certificates
  FOR ALL USING (public.is_academic_head());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- CONTACT MESSAGES â€” Anyone can insert, staff can read
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_insert_anyone" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_select_staff" ON public.contact_messages
  FOR SELECT USING (public.is_staff_member());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- EVENTS â€” Public read, staff manage
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_write_staff" ON public.events
  FOR ALL USING (public.is_staff_member());

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- IMS TABLES â€” Marketing, Finance, HR (department-specific)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- DONE
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- ============================================================================
-- CADD CENTRE LANKA â€” LECTURER RLS FIX
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
-- ============================================================================
-- CADD CENTRE LANKA â€” STUDENT TABLE SEPARATION
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
COMMENT ON TABLE public.students IS 'Dedicated student table â€” separated from staff profiles';

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
-- (Run this only once â€” it copies student profiles into the new students table)
INSERT INTO public.students (id, email, full_name, student_id, phone, nic, avatar_url, address, gender, dob, guardian_name, guardian_phone, emergency_contact_name, emergency_contact_phone, education_background, branch_id, disabled, is_active, last_active, created_at, updated_at)
SELECT id, email, full_name, student_id, phone, nic, avatar_url, address, gender, date_of_birth, guardian_name, guardian_phone, emergency_contact_name, emergency_contact_phone, education_background, branch_id, disabled, is_active, last_active, created_at, updated_at
FROM public.profiles
WHERE role = 'student'
ON CONFLICT (id) DO NOTHING;

-- 7. Remove student records from profiles (they now live in students table)
-- UNCOMMENT this line ONLY after verifying the migration worked:
-- DELETE FROM public.profiles WHERE role = 'student';

