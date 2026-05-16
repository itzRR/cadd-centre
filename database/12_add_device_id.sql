-- Migration: Add device_id to profiles table for biometric integration

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS device_id TEXT;
