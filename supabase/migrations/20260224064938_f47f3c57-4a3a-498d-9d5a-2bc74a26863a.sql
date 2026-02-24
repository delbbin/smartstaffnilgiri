
-- Create helper function for security role check using text cast to avoid enum commit issue
CREATE OR REPLACE FUNCTION public.is_security(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role::text = 'security'
  );
$$;

-- Allow security to view all outpass requests (read-only)
CREATE POLICY "Security can view all outpass requests"
ON public.outpass_requests
FOR SELECT
USING (is_security(auth.uid()));

-- Allow security to view all profiles (to get student info)
CREATE POLICY "Security can view all profiles"
ON public.profiles
FOR SELECT
USING (is_security(auth.uid()));
