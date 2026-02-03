-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'student');

-- Create outpass status enum
CREATE TYPE public.outpass_status AS ENUM ('pending', 'approved', 'rejected');

-- Create meeting status enum
CREATE TYPE public.meeting_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department TEXT,
    roll_number TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create staff members table
CREATE TABLE public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    email TEXT,
    department TEXT DEFAULT 'Computer Science',
    is_hod BOOLEAN DEFAULT false,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create staff availability table
CREATE TABLE public.staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create outpass requests table
CREATE TABLE public.outpass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    return_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status outpass_status DEFAULT 'pending' NOT NULL,
    hod_remarks TEXT,
    approved_by UUID REFERENCES public.staff_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meeting requests table
CREATE TABLE public.meeting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE NOT NULL,
    purpose TEXT NOT NULL,
    meeting_type TEXT NOT NULL,
    requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status meeting_status DEFAULT 'pending' NOT NULL,
    staff_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category TEXT DEFAULT 'general',
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create FAQ table
CREATE TABLE public.faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outpass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Create function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role = 'staff'
  );
$$;

-- Create function to get profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for staff_members (public read)
CREATE POLICY "Anyone can view staff members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage staff members" ON public.staff_members FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for staff_availability (public read)
CREATE POLICY "Anyone can view staff availability" ON public.staff_availability FOR SELECT USING (true);
CREATE POLICY "Admins can manage staff availability" ON public.staff_availability FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Staff can manage their own availability" ON public.staff_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.staff_members sm JOIN public.profiles p ON sm.profile_id = p.id WHERE sm.id = staff_availability.staff_id AND p.user_id = auth.uid())
);

-- RLS Policies for outpass_requests
CREATE POLICY "Students can view their own outpass requests" ON public.outpass_requests FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Students can create their own outpass requests" ON public.outpass_requests FOR INSERT WITH CHECK (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Staff can view all outpass requests" ON public.outpass_requests FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update outpass requests" ON public.outpass_requests FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can manage all outpass requests" ON public.outpass_requests FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for meeting_requests
CREATE POLICY "Students can view their own meeting requests" ON public.meeting_requests FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Students can create their own meeting requests" ON public.meeting_requests FOR INSERT WITH CHECK (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Staff can view meeting requests for them" ON public.meeting_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.staff_members sm JOIN public.profiles p ON sm.profile_id = p.id WHERE sm.id = meeting_requests.staff_id AND p.user_id = auth.uid())
);
CREATE POLICY "Staff can update their meeting requests" ON public.meeting_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.staff_members sm JOIN public.profiles p ON sm.profile_id = p.id WHERE sm.id = meeting_requests.staff_id AND p.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all meeting requests" ON public.meeting_requests FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for feedback
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for FAQ (public read)
CREATE POLICY "Anyone can view active FAQs" ON public.faq FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage FAQs" ON public.faq FOR ALL USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_outpass_updated BEFORE UPDATE ON public.outpass_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_meeting_updated BEFORE UPDATE ON public.meeting_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default staff members
INSERT INTO public.staff_members (name, title, is_hod, department) VALUES
('Dr. Archana', 'Head of Department', true, 'Computer Science'),
('Miss Pavithra', 'Assistant Professor', false, 'Computer Science'),
('Miss Jima', 'Assistant Professor', false, 'Computer Science'),
('Miss Anusree', 'Assistant Professor', false, 'Computer Science'),
('Dr. Renjith', 'Associate Professor', false, 'Computer Science'),
('Miss SreeDhanya', 'Assistant Professor', false, 'Computer Science');

-- Insert default availability (Mon-Sat afternoons, some mornings)
INSERT INTO public.staff_availability (staff_id, day_of_week, start_time, end_time) 
SELECT id, day_num, 
  CASE WHEN day_num IN (1, 3, 5) THEN '09:00'::TIME ELSE '14:00'::TIME END,
  CASE WHEN day_num IN (1, 3, 5) THEN '11:00'::TIME ELSE '17:00'::TIME END
FROM public.staff_members, generate_series(1, 6) AS day_num;

-- Insert default FAQs
INSERT INTO public.faq (question, answer, category, display_order) VALUES
('What is the Smart Staff Availability System?', 'It is a web application that helps students schedule meetings with tutors, request outpasses, and view staff availability in real-time.', 'general', 1),
('How do I request an outpass?', 'Login to your student portal, navigate to the Outpass section, fill in the required details including reason, destination, and time, then submit for HOD approval.', 'outpass', 2),
('How long does outpass approval take?', 'Typically, outpass requests are processed within 24 hours. Urgent requests may be expedited based on the circumstances.', 'outpass', 3),
('Can I schedule a meeting with any tutor?', 'Yes, you can request a meeting with any available tutor. Check their availability graph to find the best time slots.', 'meetings', 4),
('What are the common purposes for meetings?', 'Common purposes include notebook signing, no-due certificate signing, project discussions, academic counseling, and attendance-related queries.', 'meetings', 5),
('How do I know when a tutor is available?', 'The availability graph on your dashboard shows when each tutor is most likely available. Afternoon slots (Mon-Sat) are generally the most available.', 'meetings', 6),
('What if my outpass request is rejected?', 'You will receive a notification with the reason. You can submit a new request with additional details or contact the HOD directly.', 'outpass', 7),
('Is my feedback anonymous?', 'Yes, you can choose to submit anonymous feedback when filling out the feedback form.', 'feedback', 8);