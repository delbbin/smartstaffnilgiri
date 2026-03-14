
-- Allow all authenticated users to insert notifications (for meeting/outpass notifications)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Delete all existing staff data to start fresh
DELETE FROM public.staff_availability;
DELETE FROM public.meeting_requests;
DELETE FROM public.staff_members;
