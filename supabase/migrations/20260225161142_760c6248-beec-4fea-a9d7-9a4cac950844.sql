
-- Add gate tracking columns
ALTER TABLE public.outpass_requests
ADD COLUMN gate_status text NOT NULL DEFAULT 'on_campus'
CONSTRAINT gate_status_check CHECK (gate_status IN ('on_campus', 'left', 'returned'));

ALTER TABLE public.outpass_requests
ADD COLUMN gate_verified_at timestamp with time zone;

ALTER TABLE public.outpass_requests
ADD COLUMN gate_verified_by uuid;

ALTER TABLE public.outpass_requests
ADD COLUMN requested_by_security boolean NOT NULL DEFAULT false;

-- Allow security to update gate status
CREATE POLICY "Security can update gate status"
ON public.outpass_requests FOR UPDATE
TO authenticated
USING (is_security(auth.uid()));

-- Allow security to create emergency outpass requests
CREATE POLICY "Security can create emergency outpass requests"
ON public.outpass_requests FOR INSERT
TO authenticated
WITH CHECK (is_security(auth.uid()));

-- Enable realtime for outpass_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.outpass_requests;
