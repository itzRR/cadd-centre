-- Migration: Add disabled_reason to profiles and students tables

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;
