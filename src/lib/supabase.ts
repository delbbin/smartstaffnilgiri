import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "staff" | "student" | "security";

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  roll_number?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  email?: string;
  department: string;
  is_hod: boolean;
  profile_id?: string;
  created_at: string;
}

export interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface OutpassRequest {
  id: string;
  student_id: string;
  reason: string;
  destination: string;
  departure_time: string;
  return_time: string;
  status: "pending" | "approved" | "rejected";
  hod_remarks?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingRequest {
  id: string;
  student_id: string;
  staff_id: string;
  purpose: string;
  meeting_type: string;
  requested_time: string;
  status: "pending" | "approved" | "rejected" | "completed";
  staff_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  message: string;
  rating?: number;
  category: string;
  is_anonymous: boolean;
  created_at: string;
}

export { supabase };
