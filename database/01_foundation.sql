-- ============================================================================
-- CADD CENTRE LANKA — ENTERPRISE DATABASE ARCHITECTURE
-- Part 1: Foundation — Extensions, Schemas, Enums, Core Tables
-- Target: PostgreSQL 15+ / Supabase
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- composite GIN indexes
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- ────────────────────────────────────────────────────────────────────────────
-- 2. SCHEMAS
-- ────────────────────────────────────────────────────────────────────────────
-- public  → all application tables (Supabase default)
-- audit   → audit trails and change logs
-- archive → soft-deleted / archived records

CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS archive;

COMMENT ON SCHEMA public  IS 'Primary application schema – all ASMS + IMS tables';
COMMENT ON SCHEMA audit   IS 'Immutable audit trail and change history';
COMMENT ON SCHEMA archive IS 'Soft-deleted and archived records';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CORE TABLES
-- ────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════
-- 4.1 BRANCHES (Multi-branch support)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.2 DEPARTMENTS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.3 PROFILES (Central user table — extends auth.users)
-- ══════════════════════════════════════════════════════════════
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
COMMENT ON TABLE public.profiles IS 'Central user profiles extending Supabase auth.users — all roles';

-- Now add the FK for departments.head_id
ALTER TABLE public.departments ADD CONSTRAINT fk_dept_head
  FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ══════════════════════════════════════════════════════════════
-- 4.4 COURSES
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.5 MODULES (per course)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.6 BATCHES (Central to the entire system)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.7 LECTURER ALLOCATIONS (Lecturer ↔ Batch ↔ Module)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.lecturer_allocations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lecturer_batch_module UNIQUE (batch_id, lecturer_id, module_id)
);

-- ══════════════════════════════════════════════════════════════
-- 4.8 ENROLLMENTS (Student ↔ Course ↔ Batch)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.9 ATTENDANCE (Student attendance per batch per date)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.10 MODULE PROGRESS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.11 ASSESSMENTS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.12 ACADEMIC RECORDS (assignments, projects, skills)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.13 CERTIFICATES
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.14 LEARNING RESOURCES
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.15 EVENTS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- 4.16 EVENT REGISTRATIONS
-- ══════════════════════════════════════════════════════════════
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
