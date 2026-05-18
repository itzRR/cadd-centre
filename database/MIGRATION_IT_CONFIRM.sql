
ALTER TYPE public.lead_confirmation_stage ADD VALUE IF NOT EXISTS 'it_pending' AFTER 'finance_confirmed';
ALTER TYPE public.lead_confirmation_stage ADD VALUE IF NOT EXISTS 'it_confirmed' AFTER 'it_pending';

ALTER TABLE public.lead_confirmations 
ADD COLUMN IF NOT EXISTS it_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS it_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS academic_email TEXT,
ADD COLUMN IF NOT EXISTS academic_password TEXT;

