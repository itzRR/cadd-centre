-- ============================================================================
-- CADD CENTRE LANKA — Part 4b: Views & Seed Data
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 13. VIEWS
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 14. SEED DATA
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 15. TABLE COMMENTS (Documentation)
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 16. GRANTS (Supabase roles)
-- ────────────────────────────────────────────────────────────────────────────

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
-- Execute order: 01_foundation.sql → 02_ims_and_system.sql →
--               03_indexes_and_rls.sql → 04a_functions_triggers.sql →
--               04b_views_seed.sql
-- ============================================================================
