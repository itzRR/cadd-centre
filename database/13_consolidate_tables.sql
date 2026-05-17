-- ============================================================================
-- DB MIGRATION: Phase 2 - Database Consolidation
-- ============================================================================
-- The following tables have been deprecated in favor of a centralized
-- approach to eliminate data duplication and simplify access control.
--
-- 1. student_leads -> Consolidated into marketing_leads
-- 2. ims_academic_results -> Consolidated into academic_records
-- 3. ims_academic_students -> Consolidated into students / profiles
-- ============================================================================

-- Safely drop tables if they exist
DROP TABLE IF EXISTS public.student_leads CASCADE;
DROP TABLE IF EXISTS public.ims_academic_results CASCADE;
DROP TABLE IF EXISTS public.ims_academic_students CASCADE;

-- Note: The CASCADE keyword will automatically drop any associated
-- triggers, policies, and indexes associated with these tables.
