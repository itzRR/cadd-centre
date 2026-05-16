-- ============================================================================
-- CADD CENTRE LANKA — ENTERPRISE DATABASE ARCHITECTURE
-- Part 3: Indexes, RLS, Functions, Triggers, Views, Seed Data
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 8. INDEXES (Performance Optimization)
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 10. RLS POLICIES
-- ────────────────────────────────────────────────────────────────────────────

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

-- ── PROFILES POLICIES ──
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

-- ── COURSES POLICIES (public read, admin write) ──
CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());

-- ── MODULES POLICIES ──
CREATE POLICY "Anyone can view active modules" ON public.modules FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (public.is_admin());

-- ── BATCHES POLICIES ──
CREATE POLICY "Anyone can view active batches" ON public.batches FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admins can manage batches" ON public.batches FOR ALL USING (public.is_admin());
CREATE POLICY "Staff can view all batches" ON public.batches FOR SELECT USING (public.is_staff());

-- ── ENROLLMENTS POLICIES ──
CREATE POLICY "Students see own enrollments" ON public.enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff can view enrollments" ON public.enrollments FOR SELECT USING (public.is_staff());
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Students can create own enrollment" ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── ATTENDANCE POLICIES ──
CREATE POLICY "Students see own attendance" ON public.attendance FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL USING (public.is_staff());

-- ── MODULE PROGRESS POLICIES ──
CREATE POLICY "Students see own progress" ON public.module_progress FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage progress" ON public.module_progress FOR ALL USING (public.is_staff());

-- ── ASSESSMENTS POLICIES ──
CREATE POLICY "Students see own assessments" ON public.assessments FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage assessments" ON public.assessments FOR ALL USING (public.is_staff());

-- ── ACADEMIC RECORDS POLICIES ──
CREATE POLICY "Students see own records" ON public.academic_records FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage records" ON public.academic_records FOR ALL USING (public.is_staff());

-- ── CERTIFICATES POLICIES ──
CREATE POLICY "Students see own certs" ON public.certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can verify certs" ON public.certificates FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage certs" ON public.certificates FOR ALL USING (public.is_admin());

-- ── LEARNING RESOURCES POLICIES ──
CREATE POLICY "Active resources visible" ON public.learning_resources FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage resources" ON public.learning_resources FOR ALL USING (public.is_admin());

-- ── EVENTS POLICIES (public read) ──
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin());

-- ── EVENT REGISTRATIONS POLICIES ──
CREATE POLICY "Users see own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff can view all regs" ON public.event_registrations FOR SELECT USING (public.is_staff());

-- ── CONTACT MESSAGES (public insert, admin read) ──
CREATE POLICY "Anyone can submit message" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can view messages" ON public.contact_messages FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can update messages" ON public.contact_messages FOR UPDATE USING (public.is_staff());

-- ── IMS TABLES: staff-only policies ──
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

-- ── NOTIFICATIONS ──
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (TRUE);

-- ── SYSTEM SETTINGS ──
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Staff can read settings" ON public.system_settings FOR SELECT USING (public.is_staff());

-- ── FILE UPLOADS ──
CREATE POLICY "Users see own uploads" ON public.file_uploads FOR SELECT USING (uploaded_by = auth.uid() OR is_public = TRUE);
CREATE POLICY "Users can upload" ON public.file_uploads FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Staff see all uploads" ON public.file_uploads FOR SELECT USING (public.is_staff());
