-- ============================================================================
-- CADD CENTRE LANKA — ENTERPRISE DATABASE ARCHITECTURE
-- Part 2: IMS Tables, Communication, System Admin
-- ============================================================================

-- ══════════════════════════════════════════════════════════════
-- 5. IMS TABLES
-- ══════════════════════════════════════════════════════════════

-- ── 5.1 CONTACT MESSAGES (Public contact form) ──────────────
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

-- ── 5.2 STUDENT LEADS (ASMS-side) ──────────────────────────
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

-- ── 5.3 MARKETING LEADS (IMS) ──────────────────────────────
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

-- ── 5.4 MARKETING CAMPAIGNS ────────────────────────────────
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

-- ── 5.5 LEAD CONFIRMATIONS (Cross-department pipeline) ─────
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

-- ── 5.6 IMS PAYMENTS ───────────────────────────────────────
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

-- ── 5.7 IMS INVOICES ───────────────────────────────────────
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

-- ── 5.8 IMS EXPENSES ───────────────────────────────────────
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

-- ── 5.9 HR LEAVE REQUESTS ──────────────────────────────────
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

-- ── 5.10 HR SALARY PAYOUTS ─────────────────────────────────
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

-- ── 5.11 HR PERFORMANCE REVIEWS ────────────────────────────
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

-- ── 5.12 HR ROSTER ─────────────────────────────────────────
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

-- ── 5.13 OPS TASKS ─────────────────────────────────────────
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

-- ── 5.14 OPS MINUTE TRACKERS ───────────────────────────────
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

-- ── 5.15 STAFF ATTENDANCE (Clock-in/out) ───────────────────
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

-- ── 5.16 IMS LOGIN HISTORY ─────────────────────────────────
CREATE TABLE public.ims_login_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  email       TEXT,
  login_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  INET,
  device_info TEXT
);

-- ── 5.17 IMS SYSTEM COMMANDS ───────────────────────────────
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

-- ── 5.18 WORK CALENDAR EVENTS ──────────────────────────────
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

-- ── 5.19 IMS ACADEMIC STUDENTS (IMS-managed student records) ─
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

-- ── 5.20 IMS ACADEMIC RESULTS ──────────────────────────────
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

-- ── 5.21 LECTURERS (IMS standalone) ────────────────────────
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

-- ══════════════════════════════════════════════════════════════
-- 6. AUDIT TABLES
-- ══════════════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════════════
-- 7. FUTURE-READY TABLES
-- ══════════════════════════════════════════════════════════════

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
