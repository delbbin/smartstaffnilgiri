
-- Fix: Restrict staff_members from public to authenticated-only access
DROP POLICY IF EXISTS "Anyone can view staff members" ON public.staff_members;
CREATE POLICY "Authenticated users can view staff members" ON public.staff_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
