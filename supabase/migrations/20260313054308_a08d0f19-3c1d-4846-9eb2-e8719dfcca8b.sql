
-- Add 'security' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'security';

-- Add scheduled_time column to meeting_requests for staff to set meeting date/time
ALTER TABLE public.meeting_requests ADD COLUMN IF NOT EXISTS scheduled_time timestamptz;
