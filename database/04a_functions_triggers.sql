-- ============================================================================
-- CADD CENTRE LANKA — Part 4a: Functions & Triggers
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 11. FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────────────────
-- 12. TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

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
