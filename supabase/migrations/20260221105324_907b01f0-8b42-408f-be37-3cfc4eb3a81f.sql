
-- Fix overly permissive insert policy - only admins can insert directly, edge functions use service role
DROP POLICY "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_admin(auth.uid()));
